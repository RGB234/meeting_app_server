const io = require('socket.io-client');

const socket = io('ws://localhost:80/chat', {
  auth: {
    access_token:
      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3MWQ0N2JkYy0zNGFhLTRmNzAtODQ3Yy01OTJjYTQzMWRlOTkiLCJhdXRoRW1haWwiOiJPP09AbmF2ZXIuY29tIiwiaWF0IjoxNzIzODAzNzIwLCJleHAiOjE3MjM4MDczMjB9.k18_cMsdHPKLnF70oPPKCzAqjfo1jfExvRUdw7XtXdw',
  },
  query: {
    userId: 12,
  },
});

// https://socket.io/docs/v4/server-instance/#connection
// https://socket.io/docs/v4/server-socket-instance/
socket.on('connect', () => {
  console.log('Connected to WebSocket server');

  socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket server');
  });

  socket.on('message', (message) => {
    console.log('Message received from server:', message);
  });
});

socket.emit(
  'matchRoom',
  (criteria = {
    location: '수원시 장안구',
  }),
);

socket.emit('message', {
  message: "Oh, let's get back to the start",
});
