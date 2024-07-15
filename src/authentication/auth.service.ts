import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, DeleteResult, Repository, UpdateResult } from 'typeorm';
import { Authentication } from './auth.entity';
import { CreateAccountDto } from './dtos/create-account-dto';
import { DeleteAccountDto } from './dtos/delete-account-dto';
import { UpdateAccountDto } from './dtos/update-account-dto';
import { LoginDto } from './dtos/login-dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private datasource: DataSource,
    private jwtService: JwtService,
    private configService: ConfigService,

    @InjectRepository(Authentication)
    private authRepository: Repository<Authentication>,
  ) {}

  // *** helper methods ***
  async getAuthById(authId: string): Promise<Authentication | null> {
    return await this.authRepository.findOneBy({ id: authId });
  }
  async getAuthByEmail(authEmail: string): Promise<Authentication | null> {
    return await this.authRepository.findOneBy({ email: authEmail });
  }

  async getAuthIdByEmail(authEmail: string) {
    const auth = await this.getAuthByEmail(authEmail);
    return auth.id;
  }

  async getAuthEmailById(authId: string) {
    const auth = await this.getAuthById(authId);
    return auth.email;
  }
  // **********************

  async validateLogin(loginDto: LoginDto): Promise<Authentication> {
    const auth = await this.getAuthByEmail(loginDto.email);

    if (!auth) throw new UnauthorizedException('Invalid email');

    // Is a valid Password?
    if (auth?.password !== loginDto.password) {
      throw new UnauthorizedException('Invalid password');
    }
    return auth;
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    //
    const auth = await this.validateLogin(loginDto);
    //
    const access_token = await this.issueAccessToken(auth);
    const refresh_token = await this.issueRefreshToken(auth);

    await this.storeRefreshToken(auth.id, refresh_token);
    return {
      access_token: access_token,
      refresh_token: refresh_token,
    };
  }

  async logout(authId: string): Promise<void> {
    // Set refreshToken to null
    this.storeRefreshToken(authId, null);
  }

  async issueAccessToken(auth: Authentication) {
    const payload = {
      sub: auth.id,
      authEmail: auth.email,
    };
    const access_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: parseInt(this.configService.get<string>('JWT_ACCESS_EXP')),
    });
    return access_token;
  }

  async issueRefreshToken(auth: Authentication) {
    const payload = {
      sub: auth.id,
    };
    const refresh_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: parseInt(this.configService.get<string>('JWT_REFRESH_EXP')),
    });
    return refresh_token;
  }

  // Store a refresh Token to DB
  async storeRefreshToken(authId: string, refreshToken: string) {
    const updateAccountDto = new UpdateAccountDto();
    updateAccountDto.id = authId;
    updateAccountDto.refreshToken = refreshToken;

    return await this.updateAccount(updateAccountDto);
  }

  // return True if it is a valid refresh token
  async validateRefreshToken(
    authId: string,
    refreshToken: string,
  ): Promise<boolean> {
    const auth = await this.getAuthById(authId);
    if (!auth) {
      throw new BadRequestException('Invalid authId');
    }

    // console.log('refresh token: ', refreshToken);
    // if refresh token is null (Not allocated)
    if (auth.refreshToken == null) {
      console.log('ERROR : refresh token is null');
      return false;
    }

    // Not Encrypted yet (업데이트 예정)
    return auth.refreshToken === refreshToken;
  }

  // refresh access token using a refresh token if that refresh token is valid.
  async refreshAccessToken(authId: string, refreshToken: string) {
    const isValid = this.validateRefreshToken(authId, refreshToken);
    if (!isValid) throw new UnauthorizedException('Invalid Refresh token');

    const auth = await this.getAuthById(authId);
    const newAccessToken = await this.issueAccessToken(auth);

    return {
      accessToken: newAccessToken,
      refreshToken: refreshToken,
    };
  }

  async createAccount(
    createAccountDto: CreateAccountDto,
  ): Promise<Authentication> {
    const newAccount = new Authentication();
    newAccount.email = createAccountDto.email;
    newAccount.password = createAccountDto.password;

    console.log(newAccount);

    return await this.authRepository.save(newAccount);
  }

  async updateAccount(
    updateAccountDto: UpdateAccountDto,
  ): Promise<UpdateResult> {
    const auth = await this.getAuthById(updateAccountDto.id);
    if (auth) {
      return await this.authRepository.update(
        { id: updateAccountDto.id },
        updateAccountDto,
      );
    } else {
      throw new BadRequestException('Invalid Email (NOT FOUND)');
    }
  }

  async deleteAccount(
    deleteAccountDto: DeleteAccountDto,
  ): Promise<DeleteResult> {
    const auth = await this.datasource.manager.findOneBy(Authentication, {
      id: deleteAccountDto.authId,
    });
    if (!auth) {
      throw new BadRequestException(
        'Account Not Found. please check if the id is correct',
      );
    } else if (auth.password != deleteAccountDto.password) {
      throw new BadRequestException('Incorrect Password');
    } else {
      // TypeORM only sets up database-level cascading relations when a column is initially being created.
      // You might have to use migrations to make sure it is set correctly after the fact.
      const deleteResult = await this.datasource.manager.delete(
        Authentication,
        {
          id: deleteAccountDto.authId,
        },
      );
      return deleteResult;
    }
  }

  async softDeleteAccount() {}
}
