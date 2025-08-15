'use client';

import { useEffect, useState } from 'react';
import { Clock, Timer, AlertCircle } from 'lucide-react';
import { useRoomStore } from '@/lib/store';

export default function TimerDisplay() {
  const { sessionTimeLeft, turnTimeLeft } = useRoomStore();
  const [isLowTime, setIsLowTime] = useState(false);

  useEffect(() => {
    // Check if time is running low (less than 30 seconds for turn, 2 minutes for session)
    setIsLowTime(turnTimeLeft < 30000 || sessionTimeLeft < 120000);
  }, [turnTimeLeft, sessionTimeLeft]);

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (timeLeft: number, totalTime: number): number => {
    return Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));
  };

  const sessionProgress = getProgressPercentage(sessionTimeLeft, 10 * 60 * 1000); // 10 minutes
  const turnProgress = getProgressPercentage(turnTimeLeft, 2 * 60 * 1000); // 2 minutes

  const getTurnColorClass = () => {
    if (turnTimeLeft < 30000) return 'text-red-400 bg-red-600/20 border-red-500/30';
    if (turnTimeLeft < 60000) return 'text-orange-400 bg-orange-600/20 border-orange-500/30';
    return 'text-blue-400 bg-blue-600/20 border-blue-500/30';
  };

  const getSessionColorClass = () => {
    if (sessionTimeLeft < 120000) return 'text-red-400 bg-red-600/20 border-red-500/30';
    if (sessionTimeLeft < 300000) return 'text-orange-400 bg-orange-600/20 border-orange-500/30';
    return 'text-green-400 bg-green-600/20 border-green-500/30';
  };

  const getTurnProgressColor = () => {
    if (turnTimeLeft < 30000) return 'bg-red-500';
    if (turnTimeLeft < 60000) return 'bg-orange-500';
    return 'bg-blue-500';
  };

  const getSessionProgressColor = () => {
    if (sessionTimeLeft < 120000) return 'bg-red-500';
    if (sessionTimeLeft < 300000) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className="flex items-center space-x-6">
      {/* Turn Timer */}
      <div className={`flex items-center space-x-3 px-4 py-2 rounded-xl border ${getTurnColorClass()}`}>
        <div className="flex items-center space-x-2">
          {isLowTime && turnTimeLeft < 30000 ? (
            <AlertCircle size={18} className={`${turnTimeLeft < 30000 ? 'animate-pulse' : ''}`} />
          ) : (
            <Timer size={18} />
          )}
          <div>
            <div className="text-xs opacity-80">Turn Time</div>
            <div className={`font-mono font-bold ${turnTimeLeft < 30000 ? 'animate-pulse' : ''}`}>
              {formatTime(turnTimeLeft)}
            </div>
          </div>
        </div>
        
        {/* Turn Progress Bar */}
        <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getTurnProgressColor()} transition-all duration-1000 ease-linear`}
            style={{ width: `${turnProgress}%` }}
          />
        </div>
      </div>

      {/* Session Timer */}
      <div className={`flex items-center space-x-3 px-4 py-2 rounded-xl border ${getSessionColorClass()}`}>
        <div className="flex items-center space-x-2">
          {isLowTime && sessionTimeLeft < 120000 ? (
            <AlertCircle size={18} className={`${sessionTimeLeft < 120000 ? 'animate-pulse' : ''}`} />
          ) : (
            <Clock size={18} />
          )}
          <div>
            <div className="text-xs opacity-80">Session Time</div>
            <div className={`font-mono font-bold ${sessionTimeLeft < 120000 ? 'animate-pulse' : ''}`}>
              {formatTime(sessionTimeLeft)}
            </div>
          </div>
        </div>
        
        {/* Session Progress Bar */}
        <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getSessionProgressColor()} transition-all duration-1000 ease-linear`}
            style={{ width: `${sessionProgress}%` }}
          />
        </div>
      </div>

      {/* Critical Time Warning */}
      {(turnTimeLeft < 30000 || sessionTimeLeft < 120000) && (
        <div className="flex items-center space-x-2 text-red-400 animate-bounce">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">
            {turnTimeLeft < 30000 ? 'Turn ending soon!' : 'Session ending soon!'}
          </span>
        </div>
      )}
    </div>
  );
}