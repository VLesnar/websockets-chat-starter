const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const index = fs.readFileSync(`${__dirname}/../client/client.html`);

const onRequest = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const app = http.createServer(onRequest).listen(port);

console.log(`Listening on 127.0.0.1: ${port}`);

const io = socketio(app);

const users = {};

const onJoined = (sock) => {
  const socket = sock;

  socket.on('join', (data) => {
// Add user to users object
    socket.name = data.name;
    users[socket.name] = socket.name;

    const joinMsg = {
      name: 'server',
      msg: `There are ${Object.keys(users).length} users online`,
    };

    socket.join('room1');

    const response = {
      name: 'server',
      msg: `${data.name} has joined the room`,
    };

    console.log(`${data.name} joined`);
    socket.emit('msg', { name: 'server', msg: 'You joined the room' });
    socket.broadcast.to('room1').emit('msg', response);
    io.sockets.in('room1').emit('msg', joinMsg);
  });
};

const onMsg = (sock) => {
  const socket = sock;

  socket.on('msgToServer', (data) => {
// Checks if the user wants to signify an action
    let text = data.msg;
    if (text.startsWith('/me')) {
      text = text.replace('/me', socket.name);
    }

    io.sockets.in('room1').emit('msg', { name: socket.name, msg: text });
  });
};

const onDisconnect = (sock) => {
  const socket = sock;

  socket.on('disconnect', () => {
    const response = {
      name: 'server',
      msg: `${socket.name} has left the room`,
    };

    socket.broadcast.to('room1').emit('msg', response);

    delete users[socket.name];
  });
};

io.sockets.on('connection', (socket) => {
  console.log('started');

  onJoined(socket);
  onMsg(socket);
  onDisconnect(socket);
});
