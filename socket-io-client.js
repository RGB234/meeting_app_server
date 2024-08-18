// const io = require('socket.io-client');
import { io } from 'socket.io-client';

const socket = io('ws://localhost:80/chat', {
  query: {
    userId: 11,
  },
  extraHeaders: {
    // URL, userId, iat(issued at)
    // "idempotency-key" : "",
    // JWT
    // Bearer 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MWI0ODM3Zi0yYzE0LTQ5Y2YtYWM5NS0xNWQyYjhlZmM4ZGUiLCJhdXRoRW1haWwiOiJPeE9AbmF2ZXIuY29tIiwiaWF0IjoxNzIzODAzNzUyLCJleHAiOjE3MjM4MDczNTJ9.dBkJk87kTKvxFHQ_WZpzEmpgAVB0Pdx2FeZWIEMhjac',
    Authorization:
      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MWI0ODM3Zi0yYzE0LTQ5Y2YtYWM5NS0xNWQyYjhlZmM4ZGUiLCJhdXRoRW1haWwiOiJPeE9AbmF2ZXIuY29tIiwiaWF0IjoxNzIzODAzNzUyLCJleHAiOjE3MjM4MDczNTJ9.dBkJk87kTKvxFHQ_WZpzEmpgAVB0Pdx2FeZWIEMhjac',
  },
});

// https://socket.io/docs/v4/server-instance/#connection
// https://socket.io/docs/v4/server-socket-instance/
socket.on('connect', () => {
  console.log('Connected to WebSocket server');

  socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket server');
  });

  // socket.on('disconnecting', () => {
  //   console.log('Disconnected from WebSocket server2');
  // });

  socket.on('message', (message) => {
    console.log('Message received from server:', message);
  });
});

socket.emit(
  'matchRoom',
  (criteria = {
    location: '수원시 장안구',
    maxFemaleCount: 4,
    // maxMaleCount: 2,
  }),
);

socket.emit('message', {
  message: 'Nobody said it was easy.',
});

// *************************************************************************
// Intentional ERROR
// 짧은 시간 연속적으로 matchRoom 이벤트를 보낼 경우
// DB 를 읽는 과정에서 race condition 발생하여 버그발생
// 추후 request Id 가 null 인 경우에만 해당 이벤트를 처리하는 방식으로 해결할 예정
// *************************************************************************
// socket.emit(
//   'matchRoom',
//   (criteria = {
//     location: '수원시 장안구',
//   }),
// );

// process.on('SIGINT', () => {
//   socket.emit('exitRoom');

//   console.log('Client disconnected');
//   process.exit();
// });
