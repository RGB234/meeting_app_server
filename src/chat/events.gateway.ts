import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CreateRoomDto } from 'src/room/create-room-dto';
import { FindRoomOptionDto } from 'src/room/match-criteria-dto';
import { RoomService } from 'src/room/room.service';
import { v4 as uuidv4 } from 'uuid';

@WebSocketGateway(80, { namespace: 'events' })
export class MessagesGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly roomService: RoomService) {}
  @WebSocketServer()
  server: Server;

  public afterInit(server: any) {
    console.log('WebSocket server initialized');
  }

  // 소켓 연결 후(?) 실행되는 메서드
  public handleConnection(client: Socket, ...args: any[]) {
    // client 는 동시에 한 개의 room 만 참여가능
    client.data.roomId = this.generateRoomId();
    client.data.userId = client.join(client.data.roomId);
    console.log(
      `client (id : ${client.id}) : room (id : ${client.data.roomId})`,
    );
  }

  // 소켓 연결 해제 전(?) 실행되는 메서드
  public handleDisconnect(client: any) {
    const { roomId } = client.data;
    console.log(`client ${client.id} disconnected`);
  }

  // message broadcasting
  @SubscribeMessage('messages')
  sendMessage(client: Socket, message: string): string {
    const roomId = client.data.roomId;
    // Broadcasting
    client.to(roomId).emit('listenMessage', {
      senderUid: client.data.userId,
      message,
    });
    return message;
  }

  // Create new chat room
  @SubscribeMessage('createRoom')
  createRoom(client: Socket, data: CreateRoomDto) {
    const room = this.roomService.getRoomById(client.data.roomId);
    if (room) {
      console.log(`the room $(client.data.roomId) is already exits.`);
      return this.matchRoomByCriteria(client);
    }
    return this.roomService.createRoom(client, data, new Date());
  }

  // Match making
  @SubscribeMessage('matchRoom')
  matchRoomByCriteria(client: Socket, data: FindRoomOptionDto) {}

  private generateRoomId(): string {
    return `room:${uuidv4()}`;
  }
}
