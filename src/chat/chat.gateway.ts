import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { UUID } from 'crypto';
import { Server, Socket } from 'socket.io';
import { CreateRoomDto, MatchCriteriaDto } from 'src/room/create-room-dto';
import { RoomService } from 'src/room/room.service';
import { UserToRoomDto } from 'src/room/user-to-room-dto';
import { v4 as uuidv4 } from 'uuid';

@WebSocketGateway(80, {
  namespace: 'chat',
  cors: {
    origin: '*',
    // methods: ['GET', 'POST'],
    // allowedHeaders: ['Content-Type'],
    // credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly roomService: RoomService) {}
  @WebSocketServer()
  server: Server;

  public afterInit(server: any) {
    console.log('WebSocket server initialized');
  }

  // 소켓 연결 후(?) 실행되는 메서드
  public async handleConnection(client: Socket, ...args: any[]) {
    const query = client.handshake.query;
    // client 는 동시에 한 개의 room 만 참여가능
    client.data.roomId = this.generateRoomId();
    client.data.userId = query.userId;

    try {
      await client.join(client.data.roomId);

      console.log(
        `client (id : ${client.id} - uid : ${client.data.userId}) : room (id : ${client.data.roomId})`,
      );
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  // 소켓 연결 해제 전(?) 실행되는 메서드
  public handleDisconnect(client: any) {
    console.log(
      `client ${client.id} disconnected. ${client.data.userId}, ${client.data.roomId}}`,
    );
  }

  // message broadcasting
  @SubscribeMessage('message')
  sendMessage(client: Socket, message: string): string {
    const roomId = client.data.roomId;

    console.log(message);

    const rooms = Array.from(client.rooms);
    console.log(`Client ${client.id} is in rooms: ${rooms.join(', ')}`);

    // Broadcasting except this socket.
    client.to(roomId).emit('message', {
      senderUid: client.data.userId,
      message,
    });

    return message;
  }

  // Create new chat room containing match criteria information
  @SubscribeMessage('createRoom')
  async createRoom(client: Socket, data: CreateRoomDto) {
    const room = this.roomService.getRoomById(client.data.roomId);
    if (room) {
      // exception handling
      console.log(`the room $(client.data.roomId) is already exits.`);
      return;
    }
    return await this.roomService.createRoom(client, data, new Date());
  }

  // Join a room sellected by the matchmaker
  @SubscribeMessage('joinRoom')
  async joinRoom(client: Socket, data: UserToRoomDto) {
    await this.roomService.joinRoom({ userToRoom: data });
  }

  // Match making
  @SubscribeMessage('matchRoom')
  async matchRoomByCriteria(client: Socket, criteria: MatchCriteriaDto) {
    const rooms = await this.roomService.getRoomsByCriteria(criteria);
    const matchedRoom = rooms[Math.floor(Math.random() * rooms.length)];

    client.data.roomId = matchedRoom.id;
    const room = this.roomService.getRoomById(client.data.roomId);
    if (room) {
      console.log(`the room $(client.data.roomId) is already exits.`);
      const u2r = new UserToRoomDto();
      u2r.roomId = client.data.roomId;
      u2r.userId = client.data.userId;
      return await this.joinRoom(client, u2r);
    }
    const createRoomDto = new CreateRoomDto();
    createRoomDto.location = criteria.location;
    if (criteria.maxFemaleCount)
      createRoomDto.maxFemaleCount = criteria.maxFemaleCount;
    if (criteria.maxMaleCount)
      createRoomDto.maxMaleCount = criteria.maxMaleCount;
    return await this.createRoom(client, createRoomDto);
  }

  @SubscribeMessage('exitRoom')
  async exitRoom(client: Socket) {
    client.data.roomId = null;
    this.roomService.exitRoom({
      userId: client.data.userId,
      roomId: client.data.roomId,
    });
  }

  @SubscribeMessage('deleteRoom')
  async deleteRoom(client: Socket, roomId: UUID) {
    client.data.roomId = null;
    this.roomService.deleteRoom(roomId);
  }

  private generateRoomId(): string {
    // return `room:${uuidv4()}`;
    return `room:e73a2021-1fd9-46c4-bc41-b509d91b3c6d`;
  }
}
