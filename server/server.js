// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);

// CORS setup for both express and socket.io
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5174', // extra port for dev
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(express.json());

// In-memory data
const users = {};
const messages = [];
const typingUsers = {};

// Socket.io connection
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // User joins
  socket.on('user_join', (username) => {
    users[socket.id] = { id: socket.id, username };
    io.emit('user_list', Object.values(users));
    io.emit('user_joined', { username, id: socket.id });
  });

  // Global message
  socket.on('send_message', (data) => {
    const message = {
      id: Date.now(),
      sender: users[socket.id]?.username || 'Anonymous',
      senderId: socket.id,
      message: data,
      timestamp: new Date().toISOString(),
    };
    messages.push(message);
    if (messages.length > 100) messages.shift();
    io.emit('receive_message', message);
  });

  // Private message
  socket.on('private_message', ({ to, message }) => {
    const messageData = {
      id: Date.now(),
      sender: users[socket.id]?.username || 'Anonymous',
      senderId: socket.id,
      message,
      timestamp: new Date().toISOString(),
      isPrivate: true,
    };
    socket.to(to).emit('private_message', messageData);
    socket.emit('private_message', messageData);
  });

  // Typing indicator
  socket.on('typing', (isTyping) => {
    if (!users[socket.id]) return;
    const username = users[socket.id].username;
    if (isTyping) typingUsers[socket.id] = username;
    else delete typingUsers[socket.id];
    io.emit('typing_users', Object.values(typingUsers));
  });

  // Disconnect
  socket.on('disconnect', () => {
    if (users[socket.id]) {
      const { username } = users[socket.id];
      io.emit('user_left', { username, id: socket.id });
    }
    delete users[socket.id];
    delete typingUsers[socket.id];
    io.emit('user_list', Object.values(users));
    io.emit('typing_users', Object.values(typingUsers));
  });
});

// Optional API endpoints
app.get('/api/messages', (req, res) => res.json(messages));
app.get('/api/users', (req, res) => res.json(Object.values(users)));

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

