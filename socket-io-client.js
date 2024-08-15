// client.js
const io = require('socket.io-client');

const socket = io('http://localhost:80/chat', {
  auth: {
    access_token:
      // 'aaa',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MWI0ODM3Zi0yYzE0LTQ5Y2YtYWM5NS0xNWQyYjhlZmM4ZGUiLCJhdXRoRW1haWwiOiJPeE9AbmF2ZXIuY29tIiwiaWF0IjoxNzIzNzA5NTI5LCJleHAiOjE3MjM3MTA3Mjl9.k_mWnuCD5bFGc5F4fnFOYBrF5YQbYpIezJH0s39SEwE',
  },
  query: {
    userId: 11,
  },
});

// https://socket.io/docs/v4/server-instance/#connection
// https://socket.io/docs/v4/server-socket-instance/
socket.on('connect', () => {
  console.log('Connected to WebSocket server');

  // 서버로 메시지 전송
  socket.emit('message', { message: `client ${socket.id}} is connected` });

  socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket server');
  });

  // socket.on('disconnectecting', () => {
  //   console.log('Disconnected from WebSocket server2');
  // });
});

socket.on('message', (message) => {
  console.log('Message received from server:', message);
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

// process.on('SIGINT', () => {
//   socket.emit('exitRoom');

//   console.log('Client disconnected');
//   process.exit();
// });
