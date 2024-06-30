import { Body, Controller, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Message } from './message.entity';
import { CreateMessageDto } from './create-message-dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  async postMessage(
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    console.log(createMessageDto);
    return await this.chatService.createMessage(createMessageDto);
  }
}
