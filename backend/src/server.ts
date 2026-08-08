import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app';
import { initializeSocket } from './socket/socket';

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🏏 CricRS Backend running on port ${PORT}`);
  console.log(`📡 Socket.io ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated.');
    process.exit(0);
  });
});
