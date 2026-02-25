import { createServer } from 'node:http';
import mongoose from 'mongoose';

import app from './app.js';
import env, { validateEnv } from './config/env.js';
import { connectToSocket } from './sockets/socketManager.js';

const server = createServer(app);

connectToSocket(server);

const start = async () => {
  try {
    validateEnv();

    const connectionDb = await mongoose.connect(env.mongoUri);
    console.log(`MONGO connected: ${connectionDb.connection.host}`);

    server.listen(env.port, () => {
      console.log(`Server listening on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

start();