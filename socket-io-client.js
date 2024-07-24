// client.js
const io = require('socket.io-client');

const socket = io('http://localhost:80/chat', {
  query: {
    userId: 6,
  },
});

socket.on('connect', (userId) => {
  console.log('Connected to WebSocket server');

  // 서버로 메시지 전송
  socket.emit('message', 'Hello from client!');
});

socket.on('message', (message) => {
  console.log('Message received from server:', message);
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});
