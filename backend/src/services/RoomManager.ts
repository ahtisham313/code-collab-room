
import { Room, Developer, TimerData } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class RoomManager {
  private rooms = new Map<string, Room>();
  private timers = new Map<string, NodeJS.Timeout>(); // interval timers for timer updates
  private pendingDisconnectionTimers = new Map<string, NodeJS.Timeout>(); // per-room pending disconnection -> endSession timers

  // grace periods
  private readonly reconnectionWindowMs = 30_000; // 30s for reconnection
  private readonly finalCodeCopyWindowMs = 8_000; // 30s to copy final code before permanent deletion

  generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // ensure uniqueness (rare collision but safe)
    if (this.rooms.has(result)) return this.generateRoomCode();
    return result;
  }

  createRoom(): Room {
    const roomId = this.generateRoomCode();
    console.log(`[RoomManager] Creating new room with ID: ${roomId}`);

    const room: Room = {
      id: roomId,
      code: '// Welcome to Code Collaboration Room!\n// Start coding when both developers join.\n\nconsole.log("Hello, World!");',
      developers: [],
      currentTurn: 0,
      turnStartTime: 0,
      sessionStartTime: 0,
      sessionDuration: 10 * 60 * 1000, // 10 mint
      turnDuration: 2 * 60 * 1000, // 2 mint
      isActive: false,
      isTerminated: false, // NEW: mark room terminated when session ends
      language: 'javascript'
    };

    this.rooms.set(roomId, room);
    console.log(`[RoomManager] Room ${roomId} created successfully`);
    console.log(`[RoomManager] Total rooms: ${this.rooms.size}`);

    // Auto-cleanup room after 13 min if not active (only if not terminated)
    setTimeout(() => {
      const r = this.rooms.get(roomId);
      if (r && !r.isActive && !r.isTerminated) {
        console.log(`[RoomManager] Auto-cleaning up inactive room ${roomId}`);
        this.deleteRoom(roomId);
      }
    }, 13 * 60 * 1000);

    return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  joinRoom(roomId: string, developerName: string, socketId: string): { success: boolean; room?: Room; error?: string } {
    const room = this.rooms.get(roomId);

    console.log(`[RoomManager] joinRoom -> roomId=${roomId}, name="${developerName}", socket=${socketId}`);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    // Prevent joins to terminated rooms
    if (room.isTerminated) {
      console.log(`[RoomManager] Attempt to join terminated room ${roomId}`);
      return { success: false, error: 'Session has ended. This room is closed.' };
    }

    const cleanName = (developerName || '').trim();
    if (!cleanName) return { success: false, error: 'Invalid name' };

    console.log(`[RoomManager] Current developers before join:`, room.developers.map(d => ({
      id: d.id, name: d.name, socketId: d.socketId, isConnected: d.isConnected
    })));

    // If same socket already present -> reconnect/update
    const bySocket = room.developers.find(d => d.socketId === socketId);
    if (bySocket) {
      console.log(`[RoomManager] Socket ${socketId} already in room ${roomId}, refreshing connection`);
      bySocket.name = cleanName;
      bySocket.isConnected = true;
      bySocket.lastSeen = Date.now();
      // clear any pending disconnection timer (someone reconnected)
      this.clearPendingDisconnectionTimer(roomId);
      return { success: true, room };
    }

    // If name exists (case-insensitive) -> treat as reconnect
    const byName = room.developers.find(d => d.name.trim().toLowerCase() === cleanName.toLowerCase());
    if (byName) {
      console.log(`[RoomManager] Developer name "${cleanName}" found, updating socket id`);
      byName.socketId = socketId;
      byName.isConnected = true;
      byName.lastSeen = Date.now();
      this.clearPendingDisconnectionTimer(roomId);
      return { success: true, room };
    }

    // Count only connected developers when deciding fullness
    const connectedCount = room.developers.filter(d => d.isConnected).length;
    console.log(`[RoomManager] connectedCount=${connectedCount}, totalEntries=${room.developers.length}`);
    if (connectedCount >= 2) {
      console.log(`[RoomManager] Room ${roomId} is full (connected: ${connectedCount}/2)`);
      return { success: false, error: 'Room is full' };
    }

    // Reuse disconnected slot if available (so stale entries don't block)
    const disconnectedIndex = room.developers.findIndex(d => !d.isConnected);
    if (disconnectedIndex !== -1) {
      console.log(`[RoomManager] Reusing disconnected slot at index ${disconnectedIndex} for "${cleanName}"`);
      const slot = room.developers[disconnectedIndex];
      slot.id = uuidv4();
      slot.name = cleanName;
      slot.socketId = socketId;
      slot.isConnected = true;
      slot.lastSeen = Date.now();
    } else {
      console.log(`[RoomManager] Adding new developer "${cleanName}" to room ${roomId}`);
      const developer: Developer = {
        id: uuidv4(),
        name: cleanName,
        socketId,
        isConnected: true,
        lastSeen: Date.now()
      };
      room.developers.push(developer);
    }

    console.log(`[RoomManager] After join, room has entries:`, room.developers.map(d => ({ name: d.name, isConnected: d.isConnected, socketId: d.socketId })));

    // If we now have 2 connected devs and session not yet active -> start it
    const newConnectedCount = room.developers.filter(d => d.isConnected).length;
    if (newConnectedCount === 2 && !room.isActive) {
      console.log(`[RoomManager] Starting session for room ${roomId}`);
      this.startSession(roomId);
    }

    return { success: true, room };
  }

  startSession(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    if (room.isTerminated) return;

    room.isActive = true;
    room.sessionStartTime = Date.now();
    room.turnStartTime = Date.now();

    this.startTimers(roomId);
    // notify clients that session started
    (global as any).io?.to(roomId).emit('session-started', {
      currentTurn: room.currentTurn,
      activeDeveloper: room.developers[room.currentTurn]
    });
  }

  private startTimers(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Clear existing timer
    const existingTimer = this.timers.get(roomId);
    if (existingTimer) clearInterval(existingTimer);

    const timer = setInterval(() => this.updateTimers(roomId), 1000);
    this.timers.set(roomId, timer);
  }

  private updateTimers(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room || !room.isActive || room.isTerminated) return;

    const now = Date.now();
    const sessionElapsed = now - room.sessionStartTime;
    const turnElapsed = now - room.turnStartTime;

    const sessionTimeLeft = Math.max(0, room.sessionDuration - sessionElapsed);
    const turnTimeLeft = Math.max(0, room.turnDuration - turnElapsed);

    if (sessionTimeLeft <= 0) {
      this.endSession(roomId, 'timeout');
      return;
    }

    if (turnTimeLeft <= 0) {
      this.switchTurn(roomId);
      return;
    }

    const timerData: TimerData = { sessionTimeLeft, turnTimeLeft, currentTurn: room.currentTurn, isActive: room.isActive };
    (global as any).io?.to(roomId).emit('timer-update', timerData);
  }

  switchTurn(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room || !room.isActive || room.isTerminated) return;

    room.currentTurn = room.currentTurn === 0 ? 1 : 0;
    room.turnStartTime = Date.now();

    (global as any).io?.to(roomId).emit('turn-switched', {
      currentTurn: room.currentTurn,
      activeDeveloper: room.developers[room.currentTurn]
    });
  }

  updateCode(roomId: string, code: string, developerId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.isTerminated) return false;

    const developer = room.developers.find(dev => dev.id === developerId);
    if (!developer) return false;

    const activeDeveloper = room.developers[room.currentTurn];
    if (!activeDeveloper || activeDeveloper.id !== developerId) return false;

    room.code = code;
    (global as any).io?.to(roomId).emit('code-updated', { code, updatedBy: developer.name });
    return true;
  }

  handleDisconnection(roomId: string, socketId: string): void {
    const room = this.rooms.get(roomId);
    if (!room || room.isTerminated) return;

    const developer = room.developers.find(dev => dev.socketId === socketId);
    if (!developer) return;

    developer.isConnected = false;
    developer.lastSeen = Date.now();

    // Notify other developers in the room about the disconnection
    (global as any).io?.to(roomId).emit('developer-disconnected', {
      developer: developer.name,
      reconnectionWindow: this.reconnectionWindowMs
    });

    // Start reconnection timer (if not already set)
    if (this.pendingDisconnectionTimers.has(roomId)) {
      // already pending — don't create a new one
      return;
    }

    const timeout = setTimeout(() => {
      const currentRoom = this.rooms.get(roomId);
      if (!currentRoom) return;
      // find the dev again
      const dev = currentRoom.developers.find(d => d.id === developer.id);
      if (dev && !dev.isConnected) {
        // end session because reconnection window expired
        this.endSession(roomId, 'disconnection');
      }
      this.pendingDisconnectionTimers.delete(roomId);
    }, this.reconnectionWindowMs);

    this.pendingDisconnectionTimers.set(roomId, timeout);
  }

  private clearPendingDisconnectionTimer(roomId: string) {
    const t = this.pendingDisconnectionTimers.get(roomId);
    if (t) {
      clearTimeout(t);
      this.pendingDisconnectionTimers.delete(roomId);
      console.log(`[RoomManager] Cleared pending disconnection timer for room ${roomId}`);
    }
  }

  endSession(roomId: string, reason: 'timeout' | 'disconnection' | 'manual'): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    if (room.isTerminated) return; // already ended

    console.log(`[RoomManager] Ending session for room ${roomId}. Reason: ${reason}`);

    // mark terminated so no more joins allowed
    room.isActive = false;
    room.isTerminated = true;

    // clear interval timer for regular timer updates
    const timer = this.timers.get(roomId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(roomId);
    }

    // clear any pending disconnection timer
    this.clearPendingDisconnectionTimer(roomId);

    // prepare session-ended payload
    const payload = {
      reason,
      finalCode: room.code,
      duration: Date.now() - room.sessionStartTime,
      allowCopyUntil: Date.now() + this.finalCodeCopyWindowMs,
      navigateTo: '/' // hint client to navigate home after copy window
    };

    // notify all connected clients in the room that the session ended and provide final code
    (global as any).io?.to(roomId).emit('session-ended', payload);

    // delete the room after a short grace period (allow users to copy final code)
    setTimeout(() => {
      console.log(`[RoomManager] Permanently deleting room ${roomId} after final-code copy window`);
      this.deleteRoom(roomId);
    }, this.finalCodeCopyWindowMs + 1000); // add a small buffer
  }

  deleteRoom(roomId: string): void {
    // clear timers
    const timer = this.timers.get(roomId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(roomId);
    }

    // clear pending disconnection timer
    const pending = this.pendingDisconnectionTimers.get(roomId);
    if (pending) {
      clearTimeout(pending);
      this.pendingDisconnectionTimers.delete(roomId);
    }

    this.rooms.delete(roomId);
    console.log(`[RoomManager] Room ${roomId} deleted`);
  }
  // Add to RoomManager class
  handleRunCode(roomId: string, output: string, error: string, developerId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.isTerminated) return;

    // Broadcast output to all clients in the room
    (global as any).io?.to(roomId).emit('run-result', {
      output,
      error,
      ranBy: room.developers.find(d => d.id === developerId)?.name || "Unknown"
    });
  }

  getRoomStats(): { totalRooms: number; activeRooms: number } {
    const totalRooms = this.rooms.size;
    const activeRooms = Array.from(this.rooms.values()).filter(room => room.isActive).length;
    return { totalRooms, activeRooms };
  }

  // Debug helper
  listAllRooms(): void {
    console.log(`[RoomManager] === ROOM LIST ===`);
    console.log(`[RoomManager] Total rooms: ${this.rooms.size}`);
    this.rooms.forEach((room, roomId) => {
      console.log(`[RoomManager] Room ${roomId}:`, {
        developers: room.developers.map(d => ({ name: d.name, isConnected: d.isConnected, socketId: d.socketId })),
        isActive: room.isActive,
        isTerminated: room.isTerminated,
        currentTurn: room.currentTurn
      });
    });
    console.log(`[RoomManager] =================`);
  }
}

