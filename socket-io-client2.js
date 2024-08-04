// client.js
const io = require('socket.io-client');

const socket = io('http://localhost:80/chat', {
  query: {
    userId: 12,
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
    // maxMaleCount: 1,
    maxFemaleCount: 1,
  }),
);

setTimeout(() => {}, 1000);

// Intentional ERROR
// => 이미 한 방에 매칭되었음에도 다른 방에 매칭됨. 예외처리가 적용안되는 문제
// 또한, exitRoom 실행 시 client.data.roomId 1개 방만 나가지므로, 위의 문제가 발생하여 2개 이상의 방에 매칭되었을 경우 추가 문제 발생
socket.emit(
  'matchRoom',
  (criteria = {
    location: '수원시 장안구',
  }),
);

process.on('SIGINT', () => {
  socket.emit('exitRoom');

  console.log('Client disconnected');
  process.exit();
});
