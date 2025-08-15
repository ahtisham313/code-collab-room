export interface Developer {
    id: string;
    name: string;
    socketId: string;
    isConnected: boolean;
    lastSeen: number;
  }
  
  export interface Room {
    id: string;
    code: string;
    developers: Developer[];
    currentTurn: number; // 0 or 1
    turnStartTime: number;
    sessionStartTime: number;
    sessionDuration: number; // 10 minutes in ms
    turnDuration: number; // 2 minutes in ms
    isActive: boolean;
    language: string;
    isTerminated: boolean;
  }
  
  export interface TimerData {
    sessionTimeLeft: number;
    turnTimeLeft: number;
    currentTurn: number;
    isActive: boolean;
  }
  
  export interface RoomJoinData {
    roomId: string;
    developerName: string;
  }
  
  export interface CodeUpdateData {
    roomId: string;
    code: string;
    developerId: string;
  }
  
  export interface DisconnectionData {
    roomId: string;
    developerId: string;
    reason: 'manual' | 'timeout' | 'error';
  }