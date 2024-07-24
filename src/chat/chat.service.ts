import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from './message.entity';
import { Auth, DataSource, Repository } from 'typeorm';
import { CreateMessageDto } from './create-message-dto';
import { Room } from 'src/room/room.entity';
import { User } from 'src/user/user.entity';
import { Authentication } from 'src/authentication/auth.entity';
import { UUID } from 'crypto';

@Injectable()
export class ChatService {
  constructor(
    private dataSource: DataSource,

    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,

    @InjectRepository(Room)
    private roomRepository: Repository<Room>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Authentication)
    private authRepository: Repository<Authentication>,
  ) {}

  findAllMessages(): Promise<Message[]> {
    return this.messagesRepository.find();
  }

  async findOneMessage(roomId: UUID, writerId: UUID): Promise<Message | null> {
    const _room = await this.roomRepository.findOneBy({ id: roomId });
    const _user = await this.userRepository.findOneBy({
      authentication: await this.authRepository.findOneBy({
        id: writerId,
      }),
    });
    return this.messagesRepository.findOneBy({ room: _room, user: _user });
  }

  async removeMessage(id: number): Promise<void> {
    await this.messagesRepository.delete(id);
  }

  async createMessage(createMessageDto: CreateMessageDto): Promise<Message> {
    const newMessage = new Message();
    // newMessage.id = createMessageDto.id;
    // **********************
    newMessage.room = await this.roomRepository.findOneBy({
      id: createMessageDto.roomId,
    });
    newMessage.user = await this.userRepository.findOneBy({
      authentication: await this.authRepository.findOneBy({
        id: createMessageDto.writerId,
      }),
    });
    newMessage.createdAt = createMessageDto.createdAt;
    newMessage.deleted = createMessageDto.deleted;
    newMessage.text = createMessageDto.text;
    return await this.dataSource.manager.save(newMessage);
    // return await this.messagesRepository.save(newMessage);
  }
}
