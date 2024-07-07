import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Auth, DataSource, Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './create-user-dto';
import { Authentication } from 'src/authentication/auth.entity';
import { UpdateUserDto } from './update-user-dto';

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
    let auth: Authentication | null = null;

    try {
      auth = await this.authRepository.findOneBy({
        id: createUserDto.authenticationId,
      });

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

  async updateUser(updateUserDto: UpdateUserDto): Promise<void> {
    const { authenticationId, ...updateProperties } = updateUserDto;
    const auth = await this.authRepository.findOneBy({
      id: updateUserDto.authenticationId,
    });

    if (auth != null) {
      try {
        const updateResult = await this.userRepository.update(
          {
            authentication: auth,
          },
          updateProperties,
        );
        console.log(updateResult);
      } catch (error) {
        console.log(error);
        throw error;
      }
    } else {
      throw new BadRequestException('Invalid Authentication id');
    }
  }
}
