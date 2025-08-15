import { io, Socket } from 'socket.io-client';

class SocketManager {
  onOutputUpdated(arg0: (data: any) => void) {
    throw new Error('Method not implemented.');
  }
  runCode(roomId: string, code: string, language: string, currentUserId: string) {
    throw new Error('Method not implemented.');
  }
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(this.socket);
        return;
      }

      const serverUrl = process.env.NODE_ENV === 'production' 
        ? 'https://code-collab-room.onrender.com'  
        : 'http://localhost:5000';

      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        upgrade: true,
        timeout: 20000,
        forceNew: false
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected to server');
        this.reconnectAttempts = 0;
        resolve(this.socket!);
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(new Error('Failed to connect to server after multiple attempts'));
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected:', reason);
      });

      this.socket.on('reconnect', () => {
        console.log('🔄 Reconnected to server');
        this.reconnectAttempts = 0;
      });
    });
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Room operations
  createRoom(): Promise<{ success: boolean; roomId?: string; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      this.socket.emit('create-room', (response: any) => {
        resolve(response);
      });
    });
  }

  joinRoom(roomId: string, developerName: string): Promise<any> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      this.socket.emit('join-room', { roomId, developerName }, (response: any) => {
        resolve(response);
      });
    });
  }

  updateCode(roomId: string, code: string, developerId: string): void {
    if (this.socket) {
      this.socket.emit('code-change', { roomId, code, developerId });
    }
  }

  switchTurn(roomId: string): void {
    if (this.socket) {
      this.socket.emit('switch-turn', { roomId });
    }
  }

  changeLanguage(roomId: string, language: string): void {
    if (this.socket) {
      this.socket.emit('change-language', { roomId, language });
    }
  }

  sendTypingStatus(roomId: string, isTyping: boolean): void {
    if (this.socket) {
      this.socket.emit('typing', { roomId, isTyping });
    }
  }

  // Event listeners
  onRoomJoined(callback: (data: any) => void): void {
    this.socket?.on('developer-joined', callback);
  }

  onCodeUpdated(callback: (data: { code: string; updatedBy: string }) => void): void {
    this.socket?.on('code-updated', callback);
  }

  onTurnSwitched(callback: (data: { currentTurn: number; activeDeveloper: any }) => void): void {
    this.socket?.on('turn-switched', callback);
  }

  onSessionStarted(callback: (data: any) => void): void {
    this.socket?.on('session-started', callback);
  }

  onSessionEnded(callback: (data: any) => void): void {
    this.socket?.on('session-ended', callback);
  }

  onTimerUpdate(callback: (data: any) => void): void {
    this.socket?.on('timer-update', callback);
  }

  onDeveloperDisconnected(callback: (data: any) => void): void {
    this.socket?.on('developer-disconnected', callback);
  }

  onLanguageChanged(callback: (data: { language: string }) => void): void {
    this.socket?.on('language-changed', callback);
  }

  onUserTyping(callback: (data: { developer: string; isTyping: boolean }) => void): void {
    this.socket?.on('user-typing', callback);
  }

  onError(callback: (error: any) => void): void {
    this.socket?.on('error', callback);
  }

  // Cleanup
  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

export const socketManager = new SocketManager();