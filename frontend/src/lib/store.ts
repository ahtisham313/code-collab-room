import { create } from 'zustand';
import { Room, TimerData } from '@/types';

interface RoomState {
  // Room data
  room: Room | null;
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  
  // User data
  currentUser: string | null;
  currentUserId: string | null;
  
  // Timer data
  sessionTimeLeft: number;
  turnTimeLeft: number;
  
  // UI state
  isTyping: boolean;
  typingUser: string | null;
  notifications: Array<{ id: string; message: string; type: 'info' | 'success' | 'warning' | 'error'; timestamp: number }>;
  
  // Actions
  setRoom: (room: Room) => void;
  updateRoom: (updates: Partial<Room>) => void;
  setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void;
  setCurrentUser: (name: string, id: string) => void;
  updateTimers: (timerData: TimerData) => void;
  setTyping: (isTyping: boolean, user?: string) => void;
  addNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  reset: () => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  // Initial state
  room: null,
  isConnected: false,
  connectionStatus: 'disconnected',
  currentUser: null,
  currentUserId: null,
  sessionTimeLeft: 0,
  turnTimeLeft: 0,
  isTyping: false,
  typingUser: null,
  notifications: [],

  // Actions
  setRoom: (room: Room) => {
    set({ room, isConnected: true });
  },

  updateRoom: (updates: Partial<Room>) => {
    const currentRoom = get().room;
    if (currentRoom) {
      set({ room: { ...currentRoom, ...updates } });
    }
  },

  setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => {
    set({ connectionStatus: status, isConnected: status === 'connected' });
  },

  setCurrentUser: (name: string, id: string) => {
    set({ currentUser: name, currentUserId: id });
  },

  updateTimers: (timerData: TimerData) => {
    set({
      sessionTimeLeft: timerData.sessionTimeLeft,
      turnTimeLeft: timerData.turnTimeLeft
    });
    
    // Update room current turn
    const currentRoom = get().room;
    if (currentRoom && currentRoom.currentTurn !== timerData.currentTurn) {
      set({
        room: { ...currentRoom, currentTurn: timerData.currentTurn }
      });
    }
  },

  setTyping: (isTyping: boolean, user?: string) => {
    set({
      isTyping,
      typingUser: isTyping ? (user || null) : null
    });
  },

  addNotification: (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const notification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: Date.now()
    };
    
    set((state) => ({
      notifications: [...state.notifications, notification]
    }));

    // Auto-remove after 5 seconds
    setTimeout(() => {
      get().removeNotification(notification.id);
    }, 5000);
  },

  removeNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },

  reset: () => {
    set({
      room: null,
      isConnected: false,
      connectionStatus: 'disconnected',
      currentUser: null,
      currentUserId: null,
      sessionTimeLeft: 0,
      turnTimeLeft: 0,
      isTyping: false,
      typingUser: null,
      notifications: []
    });
  }
}));