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
    client.data.userId = query.userId;
    // 기본적으로 client.id 라는 room 에 참가된 상태로 초기화된다.
    client.leave(client.id);

    console.log(
      `client (id : ${client.id} - uid : ${client.data.userId}) : room (id : ${client.data.roomId})`,
    );
  }

  // 소켓 연결 해제 전(?) 실행되는 메서드
  public handleDisconnect(client: any) {
    client.leave(client.data.roomId);
    client.data.roomId = null;

    this.exitRoom(client);

    console.log(
      `client ${client.id} disconnected. userId - ${client.data.userId}, roomId - ${client.data.roomId}}`,
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
    const room = await this.roomService.getRoomById(client.data.roomId);
    if (room) {
      // exception handling
      console.log(`the room ${client.data.roomId} is already exits.`);
      return;
    }
    return await this.roomService.createRoom(client, data, new Date());
  }

  // Join a room sellected by the matchmaker
  @SubscribeMessage('joinRoom')
  async joinRoom(client: Socket, data: UserToRoomDto) {
    client.data.roomId = data.roomId;
    client.join(client.data.roomId);

    console.log('client rooms : ', client.rooms);

    await this.roomService.joinRoom({ userToRoom: data });
  }

  // Match making
  @SubscribeMessage('matchRoom')
  async matchRoomByCriteria(client: Socket, criteria: MatchCriteriaDto) {
    const rooms = await this.roomService.getRoomsByCriteria(criteria);

    if (rooms.length == 0) {
      // If there are no rooms that meet the search conditions
      // create a new room that meet the search condition
      const createRoomDto = new CreateRoomDto();
      // allocate random UUID
      createRoomDto.id = this.generateRoomId();
      createRoomDto.location = criteria.location;
      if (criteria.maxFemaleCount)
        createRoomDto.maxFemaleCount = criteria.maxFemaleCount;
      if (criteria.maxMaleCount)
        createRoomDto.maxMaleCount = criteria.maxMaleCount;

      const newRoomId = await this.createRoom(client, createRoomDto);
      console.log(`the room ${newRoomId} is created.`);

      rooms.push(await this.roomService.getRoomById(newRoomId));
    }
    const matchedRoom = rooms[Math.floor(Math.random() * rooms.length)];
    console.log(matchedRoom);

    client.data.roomId = matchedRoom.id;

    console.log('matchedRoom Id : ', matchedRoom.id);

    const u2r = new UserToRoomDto();
    u2r.roomId = client.data.roomId;
    u2r.userId = client.data.userId;

    return await this.joinRoom(client, u2r);
  }

  @SubscribeMessage('exitRoom')
  async exitRoom(client: Socket) {
    client.leave(client.data.roomId);
    client.data.roomId = null;

    console.log(
      `exited room. client.rooms is now null : ${Object.values(client.rooms).join(' ')}`,
    );

    this.roomService.exitRoom({
      userId: client.data.userId,
      roomId: client.data.roomId,
    });
  }

  @SubscribeMessage('deleteRoom')
  async deleteRoom(client: Socket, roomId: UUID) {
    client.leave(client.data.roomId);
    client.data.roomId = null;
    this.roomService.deleteRoom(roomId);
  }

  private generateRoomId(): string {
    // return `room:${uuidv4()}`;
    return uuidv4();
  }
}
