import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';

let io: SocketServer;

export const initializeSocket = (server: HttpServer): void => {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join a match room for live updates
    socket.on('join_match', (matchId: string) => {
      socket.join(`match:${matchId}`);
      console.log(`📺 Socket ${socket.id} joined match:${matchId}`);
    });

    // Leave a match room
    socket.on('leave_match', (matchId: string) => {
      socket.leave(`match:${matchId}`);
    });

    // Join admin room
    socket.on('join_admin', () => {
      socket.join('admin');
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  console.log('✅ Socket.io initialized');
};

// ─── Emit helpers ─────────────────────────────────────────────────────────────

/** Emit live ball update to a match room */
export const emitBallUpdate = (matchId: string, data: object): void => {
  if (io) {
    io.to(`match:${matchId}`).emit('ball_update', data);
  }
};

/** Emit full scorecard refresh */
export const emitScoreUpdate = (matchId: string, data: object): void => {
  if (io) {
    io.to(`match:${matchId}`).emit('score_update', data);
  }
};

/** Emit wicket event */
export const emitWicketEvent = (matchId: string, data: object): void => {
  if (io) {
    io.to(`match:${matchId}`).emit('wicket', data);
  }
};

/** Emit innings change */
export const emitInningsChange = (matchId: string, data: object): void => {
  if (io) {
    io.to(`match:${matchId}`).emit('innings_change', data);
  }
};

/** Emit match status change */
export const emitMatchStatus = (matchId: string, status: string): void => {
  if (io) {
    io.to(`match:${matchId}`).emit('match_status', { status });
  }
};

/** Emit notification to admin room */
export const emitAdminNotification = (data: object): void => {
  if (io) {
    io.to('admin').emit('notification', data);
  }
};

export { io };
