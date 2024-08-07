import {
  HttpCode,
  HttpException,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
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
import { MatchCriteriaDto } from 'src/room/match-room-dto';
import { Room } from 'src/room/room.entity';
import { RoomService } from 'src/room/room.service';
import { UserToRoomDto } from 'src/room/user-to-room-dto';

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
  MAX_CAPACITY = 4; // 방 최대 인원 제한수

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
    client.data.roomId = null;

    console.log(
      `client connected (id : ${client.id} - uid : ${client.data.userId}) : room (id : ${client.data.roomId})`,
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

    console.log(
      `message to broadcast. received from client ${client.id}:`,
      message,
    );

    // Broadcasting except this socket.
    client.to(roomId).emit('message', {
      senderUid: client.data.userId,
      message,
    });

    return;
  }

  // Create new chat room containing match criteria information
  // @SubscribeMessage('createRoom')
  // async createRoom(client: Socket, createRoomDto: CreateRoomDto) {
  //   return await this.roomService.createRoom(createRoomDto);
  // }

  // Join a room sellected by the matchmaker
  @SubscribeMessage('joinRoom')
  async joinRoom(client: Socket, data: UserToRoomDto): Promise<boolean> {
    try {
      await this.roomService.joinRoom({ userToRoom: data });

      client.data.roomId = data.roomId;
      client.join(data.roomId);

      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  // Match making
  // 1. 검색 기준에 맞는 방 탐색
  // 2-a 탐색 결과가 있음 : 탐색한 방 중에서 무작위로 입장 시도. 일정 횟수 내에 입장 실패시 3번으로
  // 2-b 탐색 결과가 없음 : 3번으로
  // 3. 새로 방을 만들고 입장함.
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  )
  @SubscribeMessage('matchRoom')
  async matchRoomByCriteria(client: Socket, criteria: MatchCriteriaDto) {
    // check if it's Unnecessary Request
    if (client.data.roomId != null || client.rooms.size != 0) {
      // console.log('matched room count : ', client.rooms.size);
      console.log(
        `A room matched to the user already exists (client.rooms.size : ${client.rooms.size})`,
      );
      // throw new HttpException(
      //   'A room matched to the user already exists',
      //   HttpStatus.CONFLICT,
      // );
      return;
    }
    const joinedRooms = await this.roomService.getAllJoinedRooms(
      client.data.userId,
    );
    if (joinedRooms.length > 0) {
      console.log(`< A user already joined a room >`);
      joinedRooms.forEach((room) => {
        console.log(room.id);
      });

      client.data.roomId = joinedRooms.at(0).id;
      client.join(client.data.roomId);
      return;
    }

    const userId = client.data.userId;
    const rooms = await this.roomService.getRoomsByCriteria(criteria);

    const MAX_TRIAL = Math.min(rooms.length, 10);

    let matchedRoom: Room;
    let trial = 1;
    while (rooms.length > 0 && trial <= MAX_TRIAL) {
      matchedRoom = rooms[Math.floor(Math.random() * rooms.length)];
      if (this.roomService.checkCapacityLimit(userId, matchedRoom.id)) {
        // true : Passing the capacity limit
        const u2r = new UserToRoomDto();
        u2r.roomId = matchedRoom.id;
        u2r.userId = userId;

        try {
          await this.joinRoom(client, u2r);
        } catch (err) {
          console.log('Err occurred during joining the room :', err);
        }
        return;
      }
      trial++;
    }
    // create new room
    const newRoomId = await this.roomService.createRoomByCriteria(criteria);
    console.log(`the room ${newRoomId} is created.`);

    matchedRoom = await this.roomService.getRoomById(newRoomId);

    const u2r = new UserToRoomDto();
    u2r.roomId = matchedRoom.id;
    u2r.userId = client.data.userId;

    try {
      await this.joinRoom(client, u2r);
    } catch (err) {
      console.log('Matching ERROR :', err);
      // rollback
      await this.deleteRoom(client, matchedRoom.id);
    }
    return;
  }

  @SubscribeMessage('exitRoom')
  async exitRoom(client: Socket) {
    if (!client.data.roomId && client.rooms.size != 0) {
      console.log('the client is not in any room');
      return;
    }
    try {
      client.rooms.forEach(async (room: string) => {
        await this.roomService.exitRoom({
          userId: client.data.userId,
          roomId: room, // a element of the rooms is roomId (string)
        });
      });
    } catch (err) {
      console.log(err);
    }

    client.leave(client.data.roomId);
    client.data.roomId = null;

    console.log(
      `client (${client.id}) exited room. roomID : ${client.data.roomId}, rooms: ${Object.values(client.rooms)}`,
    );
  }

  @SubscribeMessage('deleteRoom')
  async deleteRoom(client: Socket, roomId: string) {
    client.leave(client.data.roomId);
    client.data.roomId = null;
    await this.roomService.deleteRoom(roomId);
  }
}
