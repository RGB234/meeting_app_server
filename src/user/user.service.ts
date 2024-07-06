import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Auth, DataSource, Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './create-user-dto';
import { Authentication } from 'src/authentication/auth.entity';

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
    // const newUser = new User();

    // newUser.account = createUserDto.account;
    // newUser.affiliation = createUserDto.affiliation;
    // newUser.authentication = await this.authRepository.findOneBy({
    //   id: createUserDto.id,
    // });
    // newUser.birthday = createUserDto.birthday;
    // newUser.gender = createUserDto.gender;
    // newUser.name = createUserDto.name;
    // newUser.nickname = createUserDto.nickname;
    // newUser.phoneNum = createUserDto.phoneNum;
    // newUser.photoURL = createUserDto.photoURL;
    let auth: Authentication | null = null;

    try {
      auth = await this.authRepository.findOneBy({
        id: createUserDto.authenticationId,
      });

      if (auth == null) {
        console.log('Auth id Not Fount');
        return;
      }
    } catch (error) {
      console.log(
        `Error (Finding Authentication data by id(${createUserDto.authenticationId}) Failed)`,
        error,
      );
      return;
    }
    console.log('<auth>');
    console.log(auth);

    const newUser = this.userRepository.create({
      ...createUserDto,
      authentication: auth,
    });

    console.log('<newUser>');
    console.log(newUser);

    return await this.datasoure.manager.save(newUser);
  }
}
