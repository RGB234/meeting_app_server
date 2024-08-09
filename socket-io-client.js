// client.js
const io = require('socket.io-client');

const socket = io('http://localhost:80/chat', {
  auth: {
    access_token:
      // 'aaa',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MWI0ODM3Zi0yYzE0LTQ5Y2YtYWM5NS0xNWQyYjhlZmM4ZGUiLCJhdXRoRW1haWwiOiJPeE9AbmF2ZXIuY29tIiwiaWF0IjoxNzIzMTk2ODY2LCJleHAiOjE3MjMxOTc0NjZ9.TcD0n5VPg5tSoJuquBk9qrBAZaw_hwQedbxQm6ik10M',
  },
  query: {
    userId: 11,
  },
});

socket.on('connect', (userId) => {
  console.log('Connected to WebSocket server');

  // 서버로 메시지 전송
  socket.emit(`message', 'Hello from client! ${userId}`);
  // UserToRoom 테이블에 소켓의 userId 가 있는 레코드 (비정상적인 경우 둘 이상일 수 있음) 중 하나에 참가.
  // 없다면 아무것도 하지 않음.
  socket.emit('enterRoom');
});

socket.on('message', (message) => {
  console.log('Message received from server:', message);
});

socket.on('disconnect', () => {
  socket.emit('exitRoom');

  console.log('Disconnected from WebSocket server');
});

socket.emit(
  'matchRoom',
  (criteria = {
    location: '수원시 장안구',
    // maxFemaleCount: 1,
    maxMaleCount: 1,
  }),
);

// Intentional ERROR
// socket.emit(
//   'matchRoom',
//   (criteria = {
//     location: '수원시 장안구',
//   }),
// );

process.on('SIGINT', () => {
  socket.emit('exitRoom');

  console.log('Client disconnected');
  process.exit();
});
