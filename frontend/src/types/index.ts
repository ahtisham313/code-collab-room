export interface Developer {
    active: unknown;
    id?: string;
    name: string;
    isConnected: boolean;
  }
  
  export interface Room {
    id: string;
    code: string;
    developers: Developer[];
    currentTurn: number;
    isActive: boolean;
    language: string;
  }
  
  export interface TimerData {
    sessionTimeLeft: number;
    turnTimeLeft: number;
    currentTurn: number;
    isActive: boolean;
  }
  
  export interface SessionEndedData {
    allowCopyUntil: number;
    reason: 'timeout' | 'disconnection' | 'manual';
    finalCode: string;
    duration: number;
  }