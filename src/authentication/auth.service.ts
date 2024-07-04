import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Authentication } from './auth.entity';
import { CreateAccountDto } from './create-account-dto';

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
}
