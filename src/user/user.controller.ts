import {
  Body,
  Controller,
  Post,
  Put,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './create-user-dto';
import { User } from './user.entity';
import { UpdateUserDto } from './update-user-dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      // If set to true, validator will strip validated (returned) object of any properties that do not use any validation decorators.
      whitelist: true,
    }),
  )
  async postUser(@Body() createUserDto: CreateUserDto): Promise<User | null> {
    // console.log(createUserDto);
    try {
      return await this.userService.createUser(createUserDto);
    } catch (error) {
      console.log(error.message);
      throw error;
    }
  }

  @Put('update')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      // If set to true, validator will strip validated (returned) object of any properties that do not use any validation decorators.
      whitelist: true,
    }),
  )
  async updateUser(@Body() updateUserDto: UpdateUserDto): Promise<void> {
    return await this.userService.updateUser(updateUserDto);
  }
}
