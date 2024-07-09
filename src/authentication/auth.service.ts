import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, DeleteResult, Repository, UpdateResult } from 'typeorm';
import { Authentication } from './auth.entity';
import { CreateAccountDto } from './create-account-dto';
import { DeleteAccountDto } from './delete-account-dto';
import { User } from 'src/user/user.entity';
import { UpdateAccountDto } from './update-account-dto';

@Injectable()
export class AuthService {
  constructor(
    private datasource: DataSource,

    @InjectRepository(Authentication)
    private authRepository: Repository<Authentication>,
  ) {}

  async createAccount(
    createAccountDto: CreateAccountDto,
  ): Promise<Authentication> {
    const newAccount = new Authentication();
    newAccount.email = createAccountDto.email;
    newAccount.password = createAccountDto.password;

    console.log(newAccount);

    return await this.authRepository.save(newAccount);
  }

  async changePassword(
    updateAccountDto: UpdateAccountDto,
  ): Promise<UpdateResult> {
    if (await this.authRepository.existsBy({ email: updateAccountDto.email })) {
      return await this.authRepository.update(
        { email: updateAccountDto.email },
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
      id: deleteAccountDto.authenticationId,
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
          id: deleteAccountDto.authenticationId,
        },
      );
      return deleteResult;
    }
  }

  async softDeleteAccount() {}
}
