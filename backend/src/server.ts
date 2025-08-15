import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './services/RoomManager';
import { RoomJoinData, CodeUpdateData } from './types';

const app = express();
const server = createServer(app);
const roomManager = new RoomManager();

// Configure CORS
// app.use(cors({
//   origin: process.env.NODE_ENV === 'production' 
//     ? ['https://your-frontend-domain.vercel.app'] 
//     : ['http://localhost:3000'],
//   methods: ['GET', 'POST'],
//   credentials: true
// }));

app.use(express.json());

// Socket.IO setup
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://your-frontend-domain.vercel.app']
      : ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io globally available for RoomManager
declare global {
  var io: SocketIOServer | undefined;
}
global.io = io;

// REST API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/stats', (req, res) => {
  const stats = roomManager.getRoomStats();
  res.json(stats);
});

app.post('/api/rooms', (req, res) => {
  try {
    const room = roomManager.createRoom();
    res.json({
      success: true,
      roomId: room.id,
      message: 'Room created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create room'
    });
  }
});

app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = roomManager.getRoom(roomId);

  if (!room) {
    return res.status(404).json({
      success: false,
      error: 'Room not found'
    });
  }

  res.json({
    success: true,
    room: {
      id: room.id,
      developersCount: room.developers.length,
      isActive: room.isActive,
      language: room.language
    }
  });
});

// Socket.IO Event Handlers
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Handle room creation
  socket.on('create-room', (callback) => {
    try {
      console.log(`[Socket] Creating new room...`);
      const room = roomManager.createRoom();
      console.log(`[Socket] Room created: ${room.id}`);

      // Debug: List all rooms after creation
      roomManager.listAllRooms();

      if (callback && typeof callback === 'function') {
        callback({
          success: true,
          roomId: room.id
        });
      }
    } catch (error) {
      console.error('Error creating room:', error);
      if (callback && typeof callback === 'function') {
        callback({
          success: false,
          error: 'Failed to create room'
        });
      }
    }
  });

  // Handle room joining
  socket.on('join-room', (data: RoomJoinData, callback) => {
    try {
      const { roomId, developerName } = data;
      console.log(`[Socket] ${developerName} attempting to join room: ${roomId}`);
      console.log(`[Socket] Socket ID: ${socket.id}`);

      const result = roomManager.joinRoom(roomId, developerName, socket.id);

      console.log(`[Socket] Join result:`, result);

      if (result.success && result.room) {
        // Join socket to room
        socket.join(roomId);

        // Store room and user info in socket
        socket.data.roomId = roomId;
        socket.data.developerName = developerName;

        console.log(`[Socket] ${developerName} successfully joined room ${roomId}`);
        console.log(`[Socket] Room now has ${result.room.developers.length} developers`);

        // Notify all users in the room
        socket.to(roomId).emit('developer-joined', {
          developer: developerName,
          developersCount: result.room.developers.length,
          developers: result.room.developers.map(dev => ({
            id: dev.id,
            name: dev.name,
            isConnected: dev.isConnected
          }))
        });

        // Send room state to joining user
        const response = {
          success: true,
          room: {
            id: result.room.id,
            code: result.room.code,
            developers: result.room.developers.map(dev => ({
              id: dev.id,
              name: dev.name,
              isConnected: dev.isConnected
            })),
            currentTurn: result.room.currentTurn,
            isActive: result.room.isActive,
            language: result.room.language
          }
        };

        if (callback && typeof callback === 'function') {
          callback(response);
        }

        console.log(`${developerName} joined room: ${roomId} (${result.room.developers.length}/2)`);

        // Debug: List all rooms
        roomManager.listAllRooms();

        // If session started, notify all users
        if (result.room.isActive) {
          io.to(roomId).emit('session-started', {
            currentTurn: result.room.currentTurn,
            activeDeveloper: result.room.developers[result.room.currentTurn]
          });
        }
      } else {
        console.error(`[Socket] Failed to join room: ${result.error}`);
        if (callback && typeof callback === 'function') {
          callback({
            success: false,
            error: result.error
          });
        }
      }
    } catch (error) {
      console.error('Error joining room:', error);
      if (callback && typeof callback === 'function') {
        callback({
          success: false,
          error: 'Failed to join room'
        });
      }
    }
  });

  // Handle code updates
  socket.on('code-change', (data: CodeUpdateData) => {
    try {
      const { roomId, code, developerId } = data;
      const success = roomManager.updateCode(roomId, code, developerId);

      if (!success) {
        socket.emit('code-change-rejected', {
          reason: 'Not your turn or invalid session'
        });
      }
    } catch (error) {
      console.error('Error updating code:', error);
      socket.emit('error', { message: 'Failed to update code' });
    }
  });

  // Handle manual turn switch
  socket.on('switch-turn', (data: { roomId: string }) => {
    try {
      const { roomId } = data;
      const room = roomManager.getRoom(roomId);

      if (room && room.isActive) {
        roomManager.switchTurn(roomId);
        console.log(`Turn switched in room: ${roomId}`);
      }
    } catch (error) {
      console.error('Error switching turn:', error);
    }
  });

  // Handle language change
  socket.on('change-language', (data: { roomId: string; language: string }) => {
    try {
      const { roomId, language } = data;
      const room = roomManager.getRoom(roomId);

      if (room) {
        room.language = language;
        socket.to(roomId).emit('language-changed', { language });
        console.log(`Language changed to ${language} in room: ${roomId}`);
      }
    } catch (error) {
      console.error('Error changing language:', error);
    }
  });

  // Handle typing indicators
  socket.on('typing', (data: { roomId: string; isTyping: boolean }) => {
    try {
      const { roomId, isTyping } = data;
      socket.to(roomId).emit('user-typing', {
        developer: socket.data.developerName,
        isTyping
      });
    } catch (error) {
      console.error('Error handling typing:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    try {
      const roomId = socket.data.roomId;
      const developerName = socket.data.developerName;

      if (roomId) {
        console.log(`${developerName || 'Unknown'} disconnected from room: ${roomId}`);
        roomManager.handleDisconnection(roomId, socket.id);
      }

      console.log(`Client disconnected: ${socket.id}`);
    } catch (error) {
      console.error('Error handling disconnection:', error);
    }
  });
  // Add to socket event handlers
  socket.on('run-code', (data: { roomId: string, code: string, developerId: string }) => {
    try {
      const { roomId, code, developerId } = data;
      const room = roomManager.getRoom(roomId);

      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // Process code execution on server
      // (You'll need to implement actual code execution here)
      const output = "Simulated output\n" + code.slice(0, 50) + "...";
      const error = "";

      // Broadcast results to all clients
      roomManager.handleRunCode(roomId, output, error, developerId);
    } catch (error) {
      console.error('Error running code:', error);
      socket.emit('error', { message: 'Failed to run code' });
    }
  });

  // Handle ping for connection health
  socket.on('ping', () => {
    socket.emit('pong');
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready for connections`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});