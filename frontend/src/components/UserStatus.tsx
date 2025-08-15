'use client';

import { Users, User, Crown, UserCheck } from 'lucide-react';
import { useRoomStore } from '@/lib/store';

export default function UserStatus() {
  const { room, currentUser } = useRoomStore();

  if (!room) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-white/10 rounded-xl">
        <Users size={18} className="text-gray-400" />
        <span className="text-gray-400 text-sm">Connecting...</span>
      </div>
    );
  }

  const activeDeveloper = room.developers[room.currentTurn];
  const isCurrentUserActive = activeDeveloper?.name === currentUser;

  return (
    <div className="flex items-center space-x-4">
      {/* Developers List */}
      <div className="flex items-center space-x-2">
        {room.developers.map((developer, index) => {
          const isActive = room.isActive && room.currentTurn === index;
          const isCurrentUser = developer.name === currentUser;
          const isConnected = developer.isConnected;

          return (
            <div
              key={developer.name}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl border transition-all duration-200 ${
                isActive
                  ? 'bg-green-600/20 border-green-500/40 text-green-200'
                  : isCurrentUser
                  ? 'bg-purple-600/20 border-purple-500/40 text-purple-200'
                  : 'bg-white/10 border-white/20 text-gray-300'
              } ${!isConnected ? 'opacity-60' : ''}`}
            >
              {/* User Icon */}
              <div className="relative">
                {isCurrentUser ? (
                  <UserCheck size={16} />
                ) : isActive ? (
                  <Crown size={16} />
                ) : (
                  <User size={16} />
                )}
                
                {/* Connection Status Indicator */}
                <div
                  className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-800 ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
              </div>

              {/* Developer Name */}
              <span className="text-sm font-medium max-w-24 truncate">
                {developer.name}
                {isCurrentUser && ' (You)'}
              </span>

              {/* Active Indicator */}
              {isActive && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs font-medium">CODING</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Empty Slot for Second Developer */}
        {room.developers.length < 2 && (
          <div className="flex items-center space-x-2 px-3 py-2 bg-gray-600/20 border border-gray-500/30 rounded-xl text-gray-400">
            <User size={16} />
            <span className="text-sm">Waiting...</span>
          </div>
        )}
      </div>

      {/* Room Status */}
      <div className="flex items-center space-x-2">
        <div
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            room.isActive
              ? 'bg-green-600 text-green-100'
              : room.developers.length === 2
              ? 'bg-yellow-600 text-yellow-100'
              : 'bg-gray-600 text-gray-100'
          }`}
        >
          {room.isActive
            ? 'Session Active'
            : room.developers.length === 2
            ? 'Ready to Start'
            : `${room.developers.length}/2 Connected`}
        </div>

        {/* Turn Indicator */}
        {room.isActive && (
          <div className={`px-2 py-1 rounded-full text-xs ${
            isCurrentUserActive
              ? 'bg-blue-600 text-blue-100 animate-pulse'
              : 'bg-orange-600 text-orange-100'
          }`}>
            {isCurrentUserActive ? 'Your Turn' : 'Watching'}
          </div>
        )}
      </div>
    </div>
  );
}