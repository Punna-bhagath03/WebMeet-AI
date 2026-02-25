import { Server } from 'socket.io';
import env from '../config/env.js';
import { verifyAccessToken } from '../utils/token.js';

let connections = {};
let messages = {};
let timeOnline = {};
let roomLastActiveAt = {};

const MAX_MESSAGES_PER_ROOM = 100;
const MAX_ROOM_PARTICIPANTS = 10;

const isRateLimited = (socket, key, limit, windowMs) => {
  const now = Date.now();
  const bucket = socket.data?.rateLimits?.[key];

  if (!bucket) {
    return false;
  }

  if (now - bucket.windowStart > windowMs) {
    bucket.count = 0;
    bucket.windowStart = now;
  }

  bucket.count += 1;

  return bucket.count > limit;
};

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: env.corsOrigin,
      methods: ['GET', 'POST'],
      allowedHeaders: ['*'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake?.auth?.token;

      if (!token) {
        console.warn('Socket auth failed: missing token');
        return next(new Error('Unauthorized'));
      }

      const decoded = verifyAccessToken(token);

      if (!decoded || decoded.type !== 'access') {
        console.warn('Socket auth failed: invalid token type or payload');
        return next(new Error('Unauthorized'));
      }

      socket.data.user = {
        sub: decoded.sub,
        username: decoded.username,
      };

      return next();
    } catch (error) {
      console.warn('Socket auth failed: token verification failed');
      return next(new Error('Unauthorized'));
    }
  });

  console.log('Socket.IO attached');

  io.on('connection', (socket) => {
    console.log('SOMETHING CONNECTED', socket.data.user?.username || 'unknown');

    socket.data.rateLimits = {
      chat: { count: 0, windowStart: Date.now() },
      signal: { count: 0, windowStart: Date.now() },
      join: { count: 0, windowStart: Date.now() },
    };

    socket.on('join-call', (path) => {
      if (!socket.data.user) {
        return;
      }

      if (isRateLimited(socket, 'join', 5, 30000)) {
        console.warn(
          `Rate limit exceeded for join-call by user ${socket.data.user.username}`
        );
        return;
      }

      if (connections[path] === undefined) {
        connections[path] = [];
      }

      if (connections[path].includes(socket.id)) {
        roomLastActiveAt[path] = Date.now();
        return;
      }

      if (connections[path].length >= MAX_ROOM_PARTICIPANTS) {
        io.to(socket.id).emit('room-full');
        return;
      }

      connections[path].push(socket.id);
      roomLastActiveAt[path] = Date.now();

      timeOnline[socket.id] = new Date();

      for (let a = 0; a < connections[path].length; a++) {
        io.to(connections[path][a]).emit(
          'user-joined',
          socket.id,
          connections[path]
        );
      }

      if (messages[path] !== undefined) {
        for (let a = 0; a < messages[path].length; ++a) {
          io.to(socket.id).emit(
            'chat-message',
            messages[path][a]['data'],
            messages[path][a]['sender'],
            messages[path][a]['socket-id-sender']
          );
        }
      }
    });

    socket.on('signal', (toId, message) => {
      if (socket.data.user && isRateLimited(socket, 'signal', 50, 10000)) {
        console.warn(
          `Rate limit exceeded for signal by user ${socket.data.user.username}`
        );
        return;
      }

      io.to(toId).emit('signal', socket.id, message);
    });

    socket.on('chat-message', (data) => {
      if (!socket.data.user) {
        return;
      }

      if (isRateLimited(socket, 'chat', 20, 10000)) {
        console.warn(
          `Rate limit exceeded for chat-message by user ${socket.data.user.username}`
        );
        return;
      }

      const sender = socket.data.user.username;

      const [matchingRoom, found] = Object.entries(connections).reduce(
        ([room, isFound], [roomKey, roomValue]) => {
          if (!isFound && roomValue.includes(socket.id)) {
            return [roomKey, true];
          }

          return [room, isFound];
        },
        ['', false]
      );

      if (found === true) {
        if (messages[matchingRoom] === undefined) {
          messages[matchingRoom] = [];
        }

        messages[matchingRoom].push({
          sender: sender,
          data: data,
          'socket-id-sender': socket.id,
        });

        if (messages[matchingRoom].length > MAX_MESSAGES_PER_ROOM) {
          messages[matchingRoom].shift();
        }

        roomLastActiveAt[matchingRoom] = Date.now();

        console.log('message', matchingRoom, ':', sender, data);

        connections[matchingRoom].forEach((elem) => {
          io.to(elem).emit('chat-message', data, sender, socket.id);
        });
      }
    });

    socket.on('disconnect', () => {
      const username = socket.data.user?.username;
      console.log('DISCONNECTED', username || 'unknown', socket.id);

      Math.abs(timeOnline[socket.id] - new Date());

      for (const [room, sockets] of Object.entries(connections)) {
        const index = sockets.indexOf(socket.id);

        if (index === -1) {
          continue;
        }

        sockets.splice(index, 1);

        for (const socketId of sockets) {
          io.to(socketId).emit('user-left', socket.id);
        }

        if (sockets.length === 0) {
          delete connections[room];
          delete messages[room];
          delete roomLastActiveAt[room];
        } else {
          roomLastActiveAt[room] = Date.now();
        }
      }

      delete timeOnline[socket.id];
    });
  });

  return io;
};