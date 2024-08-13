import {
  HttpException,
  HttpStatus,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtAccessTokenGuard } from 'src/authentication/jwt-access-token.guard';
import { MatchCriteriaDto } from 'src/room/match-room-dto';
import { Room } from 'src/room/room.entity';
import { RoomService } from 'src/room/room.service';
import { UserToRoomDto } from 'src/room/user-to-room-dto';

@UseGuards(JwtAccessTokenGuard)
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

  constructor(
    private readonly roomService: RoomService,
    private readonly configService: ConfigService,
  ) {}
  @WebSocketServer()
  server: Server;

  public afterInit(server: any) {
    console.log('WebSocket server initialized');
  }

  // ************* 소켓에 auth & Guard 적용 후 exitRoom 에서 버그 발견.

  // 소켓 연결 후(?) 실행되는 메서드
  public async handleConnection(
    @ConnectedSocket() client: Socket,
    ...args: any[]
  ) {
    const query = client.handshake.query;
    client.data.userId = query.userId;
    // 기본적으로 client.id 라는 room 에 참가된 상태로 초기화된다.
    // client 는 동시에 한 개의 room 만 참여가능한 비즈니스 로직으로 구현할 것이다.
    client.leave(client.id);
    client.data.roomId = null;

    // Authentication
    const accessToken = client.handshake.auth.access_token;
    client.data.access_token = accessToken;

    console.log(
      `client connected (id : ${client.id} - uid : ${client.data.userId}) : room (id : ${client.data.roomId})`,
    );
  }

  // 소켓 연결 해제 전(?) 실행되는 메서드
  public async handleDisconnect(client: any) {
    // client.leave(client.data.roomId);
    // client.data.roomId = null;

    await this.exitRoom(client);

    console.log(
      `client ${client.id} disconnected. userId - ${client.data.userId}, roomId - ${client.data.roomId}}`,
    );
  }

  async checkClientIsNotInAnyRoom(
    @ConnectedSocket() client: Socket,
  ): Promise<boolean> {
    if (client.data.roomId != null || client.rooms.size != 0) {
      console.log(
        `A room matched to the user already exists (client.rooms.size : ${client.rooms.size})`,
      );
      return false;
    }
    const joinedRooms = await this.roomService.getAllJoinedRooms(
      client.data.userId,
    );
    if (joinedRooms.length > 0) {
      console.log(`< A user already joined a room >`);
      joinedRooms.forEach((room) => {
        console.log(room.id);
      });

      // client.data.roomId = joinedRooms.at(0).id;
      // client.join(client.data.roomId);
      return false;
    }
    return true;
  }

  // message broadcasting
  @SubscribeMessage('message')
  sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: string,
  ): string {
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

  // Join a room sellected by the matchmaker
  @SubscribeMessage('joinRoom')
  async joinRoom(
    @ConnectedSocket() client: Socket,
    u2r: UserToRoomDto,
  ): Promise<boolean> {
    // check if it's Unnecessary Request
    if (!(await this.checkClientIsNotInAnyRoom(client))) {
      await this.enterRoom(client);
      return;
    }

    try {
      await this.roomService.createUserToRoomRecord({ userToRoom: u2r });

      client.data.roomId = u2r.roomId;
      client.join(u2r.roomId);

      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  // A client socket joins the room using userId-roomId mapping saved in the database
  @SubscribeMessage('enterRoom')
  async enterRoom(@ConnectedSocket() client: Socket) {
    if (client.data.roomId && client.rooms.size > 0) {
      // consider user already entered a room. (duplicated request)
      // return;
      throw new HttpException(
        `The user already entered a room (${client.data.roomId}), the size of rooms : ${client.rooms.size}`,
        HttpStatus.CONFLICT,
      );
    }
    const joinedRooms = await this.roomService.getAllJoinedRooms(
      client.data.userId,
    );

    if (joinedRooms.length == 0) {
      return;
    }

    const roomId = joinedRooms.at(0).id;
    client.data.roomId = roomId;
    client.join(roomId);

    console.log(
      `the client (${client.data.userId}) entered a room (${client.data.roomId})`,
    );
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
  async matchRoomByCriteria(
    @ConnectedSocket() client: Socket,
    @MessageBody() criteria: MatchCriteriaDto,
  ) {
    // check if it's Unnecessary Request
    if (!(await this.checkClientIsNotInAnyRoom(client))) {
      await this.enterRoom(client);
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

  // By default, One user only can have one room at the same time.
  // but to handle cases where an error occurred and more than 2 rooms were joined, exit All joined rooms.
  @SubscribeMessage('exitRoom')
  async exitRoom(@ConnectedSocket() client: Socket) {
    console.log(`before exit : ${client.data.roomId}, ${client.rooms.size}`);
    if (client.data.roomId == null || client.rooms.size == 0) {
      console.log('the client is not in any room');
      return;
    }
    try {
      client.rooms.forEach(async (room: string) => {
        await this.roomService.deleteUserToRoomRecord({
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
  async deleteRoom(@ConnectedSocket() client: Socket, roomId: string) {
    client.leave(client.data.roomId);
    client.data.roomId = null;
    await this.roomService.deleteRoom(roomId);
  }
}
