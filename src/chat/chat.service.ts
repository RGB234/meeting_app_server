import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from './message.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateMessageDto } from './create-message-dto';
import { Room } from 'src/room/room.entity';
import { User } from 'src/user/user.entity';

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
  ) {}

  findAllMessages(): Promise<Message[]> {
    return this.messagesRepository.find();
  }

  findOneMessage(id: number): Promise<Message | null> {
    return this.messagesRepository.findOneBy({ id });
  }

  async removeMessage(id: number): Promise<void> {
    await this.messagesRepository.delete(id);
  }

  async createMessage(createMessageDto: CreateMessageDto): Promise<Message> {
    const newMessage = new Message();
    newMessage.id = createMessageDto.id;
    newMessage.room = await this.roomRepository.findOneBy({
      id: createMessageDto.roomId,
    });
    newMessage.user = await this.userRepository.findOneBy({
      id: createMessageDto.id,
    });
    newMessage.createdAt = createMessageDto.createdAt;
    newMessage.deleted = createMessageDto.deleted;
    newMessage.text = createMessageDto.text;
    return await this.dataSource.manager.save(newMessage);
    // return await this.messagesRepository.save(newMessage);
  }
}
