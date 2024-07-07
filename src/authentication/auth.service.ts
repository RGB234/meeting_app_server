import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Authentication } from './auth.entity';
import { CreateAccountDto } from './create-account-dto';
import { DeleteAccountDto } from './delete-account-dto';
import { User } from 'src/user/user.entity';

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

  async deleteAccount(deleteAccountDto: DeleteAccountDto): Promise<void> {
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
      await this.datasource.manager.delete(Authentication, {
        id: deleteAccountDto.authenticationId,
      });
    }
    return;
  }

  async softDeleteAccount() {}
}
