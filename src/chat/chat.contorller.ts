import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { Message } from './message.entity';
import { CreateMessageDto } from './create-message-dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      // If set to true, validator will strip validated (returned) object of any properties that do not use any validation decorators.
      whitelist: true,
    }),
  )
  async postMessage(
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    console.log(createMessageDto);
    return await this.chatService.createMessage(createMessageDto);
  }
}
