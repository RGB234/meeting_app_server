import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './create-user-dto';
import { Authentication } from 'src/authentication/authentication.entity';

@Injectable()
export class UserService {
  constructor(
    private datasoure: DataSource,
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Authentication)
    private authRepository: Repository<Authentication>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const newUser = new User();

    newUser.account = createUserDto.account;
    newUser.affiliation = createUserDto.affiliation;
    newUser.authentication = await this.authRepository.findOneBy({
      uid: createUserDto.uid,
    });
    newUser.birthday = createUserDto.birthday;
    newUser.gender = createUserDto.gender;
    newUser.name = createUserDto.name;
    newUser.nickname = createUserDto.nickname;
    newUser.phoneNum = createUserDto.phoneNum;
    newUser.photoURL = createUserDto.photoURL;

    return await this.datasoure.manager.save(newUser);
  }
}
