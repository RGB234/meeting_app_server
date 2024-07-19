import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, UpdateResult } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './create-user-dto';
import { Authentication } from 'src/authentication/auth.entity';
import { UpdateUserDto } from './update-user-dto';
import { AuthService } from 'src/authentication/auth.service';

@Injectable()
export class UserService {
  constructor(
    private datasoure: DataSource,
    @InjectRepository(User)
    private userRepository: Repository<User>,

    // @InjectRepository(Authentication)
    // private authRepository: Repository<Authentication>,

    private authService: AuthService,
  ) {}

  async getUserById(userId: number) {
    return await this.userRepository.findOneBy({ id: userId });
  }

  async getAuthByUserId(userId: number): Promise<Authentication | null> {
    const user = await this.userRepository.findOneBy({ id: userId });
    return user.authentication;
  }

  async getUserByAuthId(authId: string): Promise<User | null> {
    // const auth = await this.authRepository.findOneBy({
    //   id: authId,
    // });
    const auth = await this.authService.getAuthById(authId);
    if (!auth) throw new BadRequestException('Invalid auth id');
    return await this.userRepository.findOneBy({
      authentication: auth,
    });
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    let auth: Authentication | null = null;

    try {
      // auth = await this.authRepository.findOneBy({
      //   id: createUserDto.authenticationId,
      // });
      auth = await this.authService.getAuthById(createUserDto.authId);

      if (auth == null) {
        throw new BadRequestException('Auth id Not Found');
      }
    } catch (error) {
      // console.log(
      //   `Error (Finding Authentication data by id(${createUserDto.authenticationId}) Failed)`,
      //   error,
      // );
      throw error;
    }
    const newUser = this.userRepository.create({
      ...createUserDto,
      authentication: auth,
    });

    return await this.datasoure.manager.save(newUser);
  }

  async updateUser(updateUserDto: UpdateUserDto): Promise<UpdateResult> {
    const { authId, ...updateProperties } = updateUserDto;
    // const auth = await this.authRepository.findOneBy({
    //   id: updateUserDto.authenticationId,
    // });
    const auth = await this.authService.getAuthById(updateUserDto.authId);

    if (auth != null) {
      try {
        const updateResult = await this.userRepository.update(
          {
            authentication: auth,
          },
          updateProperties,
        );
        return updateResult;
      } catch (error) {
        console.log(error);
        throw error;
      }
    } else {
      throw new BadRequestException('Invalid Authentication id');
    }
  }
}
