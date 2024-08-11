// client.js
const io = require('socket.io-client');

const socket = io('http://localhost:80/chat', {
  auth: {
    access_token:
      // 'aaa',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MWI0ODM3Zi0yYzE0LTQ5Y2YtYWM5NS0xNWQyYjhlZmM4ZGUiLCJhdXRoRW1haWwiOiJPeE9AbmF2ZXIuY29tIiwiaWF0IjoxNzIzMzcxNzkxLCJleHAiOjE3MjMzNzI5OTF9.84cJK5y7bycUrM0X2cvE1BXduGy9woNmzGzIMbahv3M',
  },
  query: {
    userId: 11,
  },
});

socket.on('connect', (userId) => {
  console.log('Connected to WebSocket server');

  // 서버로 메시지 전송
  socket.emit(`message', 'Hello from client! ${userId}`);
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
