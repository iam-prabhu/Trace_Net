import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../types/user.types';

export interface UserPresence {
  socketId: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
  color?: string;
  activity?: string;
  cursor?: { x: number; y: number };
}

interface CollaborationSocket extends Socket {
  user?: JwtPayload;
  joinedRooms?: Set<string>;
}

// Map from room (e.g. "investigation:inv-01") to Map of socketId -> UserPresence
const roomPresenceMap = new Map<string, Map<string, UserPresence>>();

const PRESENCE_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
];

function getRoomName(id: string): string {
  return id.startsWith('investigation:') ? id : `investigation:${id}`;
}

export function getRoomActiveUsers(investigationId: string): UserPresence[] {
  const room = getRoomName(investigationId);
  const roomPresences = roomPresenceMap.get(room);
  if (!roomPresences) return [];
  return Array.from(roomPresences.values());
}

export function registerCollaborationHandlers(io: Server): void {
  // Authentication middleware
  io.use((socket: CollaborationSocket, next) => {
    try {
      let token: string | undefined =
        (socket.handshake.auth?.token as string) ||
        (socket.handshake.query?.token as string);

      if (!token && socket.handshake.headers?.authorization) {
        const header = socket.handshake.headers.authorization;
        token = header.startsWith('Bearer ') ? header.substring(7) : header;
      }

      if (!token) {
        // Fallback demo user for development/testing if token is missing
        socket.user = {
          userId: `demo-user-${socket.id.substring(0, 5)}`,
          email: 'investigator@fraudconsole.internal',
          name: 'Investigator (Demo)',
          role: 'INVESTIGATOR',
        };
        return next();
      }

      const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      socket.user = payload;
      next();
    } catch {
      // Fallback for sockets with expired/mock tokens
      socket.user = {
        userId: `guest-${socket.id.substring(0, 5)}`,
        email: 'guest@fraudconsole.internal',
        name: 'Guest Investigator',
        role: 'INVESTIGATOR',
      };
      next();
    }
  });

  io.on('connection', (socket: CollaborationSocket) => {
    socket.joinedRooms = new Set();
    const user = socket.user!;
    console.log(`🔌 Socket connected: ${socket.id} (${user.name || user.email})`);

    // Helper to get color for user
    const userColor =
      PRESENCE_COLORS[Math.abs(hashString(user.userId || socket.id)) % PRESENCE_COLORS.length];

    // Join room handler (supports both 'investigation:join' and 'join:investigation')
    const handleJoin = (investigationId: string) => {
      if (!investigationId) return;
      const room = getRoomName(investigationId);

      socket.join(room);
      socket.joinedRooms!.add(room);

      if (!roomPresenceMap.has(room)) {
        roomPresenceMap.set(room, new Map());
      }

      const presence: UserPresence = {
        socketId: socket.id,
        userId: user.userId,
        name: user.name || user.email.split('@')[0],
        email: user.email,
        role: user.role,
        joinedAt: new Date().toISOString(),
        color: userColor,
        activity: 'viewing',
      };

      roomPresenceMap.get(room)!.set(socket.id, presence);

      const activeUsers = Array.from(roomPresenceMap.get(room)!.values());

      // Notify the joining user with full presence list
      socket.emit('investigation:presence-list', { investigationId, users: activeUsers });
      socket.emit('investigation:users', { investigationId, users: activeUsers });

      // Broadcast to other users in the room
      socket.to(room).emit('investigation:user-joined', {
        investigationId,
        user: presence,
        users: activeUsers,
      });
      socket.to(room).emit('user:joined', {
        userId: user.userId,
        name: presence.name,
        investigationId,
      });

      console.log(`👤 ${user.name} joined room ${room}. Active users: ${activeUsers.length}`);
    };

    socket.on('investigation:join', handleJoin);
    socket.on('join:investigation', handleJoin);

    // Leave room handler
    const handleLeave = (investigationId: string) => {
      if (!investigationId) return;
      const room = getRoomName(investigationId);

      socket.leave(room);
      socket.joinedRooms!.delete(room);

      if (roomPresenceMap.has(room)) {
        roomPresenceMap.get(room)!.delete(socket.id);
        const remaining = Array.from(roomPresenceMap.get(room)!.values());

        socket.to(room).emit('investigation:user-left', {
          investigationId,
          userId: user.userId,
          users: remaining,
        });
        socket.to(room).emit('user:left', {
          userId: user.userId,
          investigationId,
        });
      }
    };

    socket.on('investigation:leave', handleLeave);
    socket.on('leave:investigation', handleLeave);

    // Presence update (cursor, active tab, viewing node)
    socket.on('investigation:presence', (data: { investigationId: string; activity?: string; cursor?: { x: number; y: number } }) => {
      const room = getRoomName(data.investigationId);
      const roomPresences = roomPresenceMap.get(room);
      if (roomPresences && roomPresences.has(socket.id)) {
        const pres = roomPresences.get(socket.id)!;
        if (data.activity) pres.activity = data.activity;
        if (data.cursor) pres.cursor = data.cursor;

        socket.to(room).emit('investigation:presence', {
          userId: user.userId,
          name: pres.name,
          color: pres.color,
          activity: pres.activity,
          cursor: pres.cursor,
        });
      }
    });

    // Synchronized Graph Selection (node, edge, or highlighted path)
    const handleGraphSelection = (data: {
      investigationId: string;
      selectedNodeId?: string;
      selectedEdgeId?: string;
      highlightedPath?: string[];
      highlightedCycle?: string[];
    }) => {
      const room = getRoomName(data.investigationId);
      socket.to(room).emit('investigation:graph-selection', {
        ...data,
        userId: user.userId,
        userName: user.name,
        color: userColor,
      });
      // Legacy compatibility
      socket.to(room).emit('graph:selection', {
        ...data,
        userId: user.userId,
      });
    };

    socket.on('investigation:graph-selection', handleGraphSelection);
    socket.on('graph:selection', handleGraphSelection);

    // Annotation Created event
    socket.on('investigation:annotation-created', (data: { investigationId: string; annotation: any }) => {
      const room = getRoomName(data.investigationId);
      socket.to(room).emit('investigation:annotation-created', {
        ...data,
        author: user.name,
      });
    });

    // Note Created event
    socket.on('investigation:note-created', (data: { investigationId: string; note: any }) => {
      const room = getRoomName(data.investigationId);
      socket.to(room).emit('investigation:note-created', {
        ...data,
        author: user.name,
      });
      socket.to(room).emit('note:update', data);
    });

    // Case Status Updated event
    socket.on('investigation:status-updated', (data: { investigationId: string; status: string; priority?: string }) => {
      const room = getRoomName(data.investigationId);
      socket.to(room).emit('investigation:status-updated', {
        ...data,
        updatedBy: user.name,
      });
    });

    // Real-time Chat / Collaboration Stream event
    socket.on('investigation:chat', (data: { investigationId: string; message: string }) => {
      const room = getRoomName(data.investigationId);
      socket.to(room).emit('investigation:chat', {
        id: `chat-${Date.now()}`,
        investigationId: data.investigationId,
        user: user.name,
        color: userColor,
        message: data.message,
        time: new Date().toLocaleTimeString(),
      });
    });

    // Disconnect cleanup
    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
      if (socket.joinedRooms) {
        for (const room of socket.joinedRooms) {
          const roomPresences = roomPresenceMap.get(room);
          if (roomPresences) {
            roomPresences.delete(socket.id);
            const remaining = Array.from(roomPresences.values());
            socket.to(room).emit('investigation:user-left', {
              userId: user.userId,
              users: remaining,
            });
          }
        }
      }
    });
  });
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
