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
  private readonly MAX_CAPACITY = 4; // 방 최대 인원 제한수
  @WebSocketServer() private server: any;

  constructor(
    private readonly roomService: RoomService,
    private readonly configService: ConfigService,
  ) {}

  public afterInit(server: Server) {
    console.log('WebSocket server initialized');
  }

  // 소켓 연결 시 실행되는 메서드
  public async handleConnection(
    @ConnectedSocket() socket: Socket,
    ...args: any[]
  ) {
    const query = socket.handshake.query;
    socket.data.userId = query.userId;
    // 기본적으로 client.id 라는 room 에 참가된 상태로 초기화된다.
    // client 는 동시에 한 개의 room 만 참여가능한 비즈니스 로직으로 구현할 것이다.
    socket.leave(socket.id);
    socket.data.roomId = null;

    // Authentication
    const accessToken = socket.handshake.auth.access_token;
    socket.data.access_token = accessToken;

    console.log(
      `client connected (socket id : ${socket.id} - uid : ${socket.data.userId}) : room (id : ${socket.data.roomId})`,
    );

    // 소켓 연결 해제 시 자동으로 disconnecting (a reserved event name) 이벤트 발생
    // https://socket.io/docs/v4/server-socket-instance/#disconnect
    // This event is similar to disconnect but is fired a bit earlier, ** when the Socket#rooms set is not empty yet **
    socket.on('disconnecting', async (reason) => {
      // console.log('< All rooms before disconnecting >');
      // client.rooms.forEach((room) => {
      //   console.log(room);
      // });

      await this.exitAllRooms(socket);
    });
  }

  // 소켓 연결 해제 시 실행되는 메서드
  // 아마 disconnect 이벤트 발생 후로 생각됨. (the Socket#rooms set is empty)
  public async handleDisconnect(
    @ConnectedSocket() socket: Socket,
    ...args: any[]
  ) {
    // client.rooms is {}
    console.log(
      `client ${socket.id} disconnected. userId - ${socket.data.userId}`,
    );
  }

  async checkClientIsNotInAnyRooms(
    @ConnectedSocket() socket: Socket,
  ): Promise<boolean> {
    if (socket.data.roomId != null || socket.rooms.size != 0) {
      console.log(
        `A room matched to the user already exists (socket.rooms.size : ${socket.rooms.size})`,
      );
      return false;
    }
    const joinedRooms = await this.roomService.getAllJoinedRooms(
      socket.data.userId,
    );
    if (joinedRooms.length > 0) {
      console.log(`< A user already joined a room >`);
      joinedRooms.forEach((room) => {
        console.log(room.id);
      });
      return false;
    }
    return true;
  }

  // message broadcasting
  @SubscribeMessage('message')
  sendMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() message: { string: string },
  ): void {
    const roomId = socket.data.roomId;

    console.log(`received from client ${socket.id}:`, message);

    socket.broadcast.emit('message', {
      senderUid: socket.data.userId,
      message,
    });
  }

  // Join a room sellected by the matchmaker
  @SubscribeMessage('joinRoom')
  async joinRoom(
    @ConnectedSocket() socket: Socket,
    u2r: UserToRoomDto,
  ): Promise<boolean> {
    // check if it's Unnecessary Request
    if (!(await this.checkClientIsNotInAnyRooms(socket))) {
      await this.enterRoom(socket);
      return;
    }

    try {
      await this.roomService.createUserToRoomRecord({ userToRoom: u2r });

      socket.data.roomId = u2r.roomId;
      socket.join(u2r.roomId);

      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  // A client socket joins the room using userId-roomId mapping saved in the database
  @SubscribeMessage('enterRoom')
  async enterRoom(@ConnectedSocket() socket: Socket) {
    if (socket.data.roomId && socket.rooms.size > 0) {
      // consider user already entered a room. (duplicated request)
      // return;
      console.log(`the size of rooms : ${socket.rooms.size}`);
      throw new HttpException(
        `The user already entered a room (${socket.data.roomId})`,
        HttpStatus.CONFLICT,
      );
    }
    const joinedRooms = await this.roomService.getAllJoinedRooms(
      socket.data.userId,
    );

    if (joinedRooms.length == 0) {
      return;
    }

    const roomId = joinedRooms.at(0).id;
    socket.data.roomId = roomId;
    socket.join(roomId);

    console.log(
      `the client (${socket.data.userId}) entered a room (${socket.data.roomId}) rooms : ${socket.rooms.size})`,
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
    @ConnectedSocket() socket: Socket,
    @MessageBody() criteria: MatchCriteriaDto,
  ) {
    // check if it's Unnecessary Request
    if (!(await this.checkClientIsNotInAnyRooms(socket))) {
      await this.enterRoom(socket);
      return;
    }

    const userId = socket.data.userId;
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
          await this.joinRoom(socket, u2r);
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
    u2r.userId = socket.data.userId;

    try {
      await this.joinRoom(socket, u2r);
    } catch (err) {
      console.log('Matching ERROR :', err);
      // rollback
      await this.deleteRoom(socket, matchedRoom.id);
    }
    return;
  }

  // By default, One user only can have one room at the same time.
  // but to handle cases where an error occurred and more than 2 rooms were joined, exit All joined rooms.
  @SubscribeMessage('exitRoom')
  async exitAllRooms(@ConnectedSocket() socket: Socket) {
    // console.log(`before exit : ${socket.data.roomId}, ${socket.rooms.size}`);
    if (socket.data.roomId == null || socket.rooms.size == 0) {
      console.log('the client is not in any room');
      return;
    }
    socket.rooms.forEach(async (room: string) => {
      try {
        await this.roomService.deleteUserToRoomRecord({
          userId: socket.data.userId,
          roomId: room, // a element of the rooms is roomId (string)
        });
      } catch (err) {
        if (
          err instanceof HttpException &&
          err.getStatus() === HttpStatus.NOT_FOUND
        ) {
          console.log(err.message);
        }
      }
      await socket.leave(room);
    });

    await socket.leave(socket.data.roomId);
    socket.data.roomId = null;

    console.log(
      `client (${socket.id}) exited room. roomID : ${socket.data.roomId}, rooms: ${Object.values(socket.rooms)}`,
    );
  }

  @SubscribeMessage('deleteRoom')
  async deleteRoom(@ConnectedSocket() socket: Socket, roomId: string) {
    socket.leave(socket.data.roomId);
    socket.data.roomId = null;
    await this.roomService.deleteRoom(roomId);
  }
}
