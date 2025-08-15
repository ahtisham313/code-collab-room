
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useParams } from 'next/navigation';
import { socketManager } from '@/lib/socket';
import { useRoomStore } from '@/lib/store';
import CodeEditor from '@/components/CodeEditor';
import TimerDisplay from '@/components/TimerDisplay';
import UserStatus from '@/components/UserStatus';
import NotificationToast from '@/components/NotificationToast';
import SessionEndModal from '@/components/SessionEndModal';
import { Copy, Users, Settings, Home, Play } from 'lucide-react';
import type { SessionEndedData } from '@/types';

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const roomId = params.roomId as string;
  const developerName = searchParams.get('name') || '';

  const {
    room,
    isConnected,
    currentUser,
    currentUserId,
    sessionTimeLeft,
    turnTimeLeft,
    isTyping,
    typingUser,
    notifications,
    setRoom,
    updateRoom,
    setCurrentUser,
    updateTimers,
    setTyping,
    addNotification,
    removeNotification,
    reset
  } = useRoomStore();

  const [isJoining, setIsJoining] = useState(true);
  const [sessionEnded, setSessionEnded] = useState<SessionEndedData | null>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [showSettings, setShowSettings] = useState(false);
  const [reconnectTimer, setReconnectTimer] = useState<number>(0);
  const [hasJoined, setHasJoined] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const disconnectedDeveloperRef = useRef<string | null>(null);

  const [output, setOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [ranBy, setRanBy] = useState<string | null>(null);
  // Instead of per-disconnect intervals, keep a single target timestamp and a single ticker
  const reconnectTargetRef = useRef<number | null>(null); // ms timestamp when reconnect window ends
  const [isConnecting, setIsConnecting] = useState(false);
  // Single ticker that updates reconnectTimer based on reconnectTargetRef
  useEffect(() => {
    const tick = () => {
      const target = reconnectTargetRef.current;
      if (!target) {
        // nothing to do
        return;
      }
      const remaining = Math.max(0, Math.ceil((target - Date.now()) / 1000));
      setReconnectTimer(remaining);
      if (remaining === 0) {
        // finished
        reconnectTargetRef.current = null;
        disconnectedDeveloperRef.current = null;
        setReconnectTimer(0);
      }
    };

    // run immediately to set initial value
    tick();
    const id = window.setInterval(tick, 250);

    return () => {
      clearInterval(id);
    };
  }, []);

  // Initialize room connection
  useEffect(() => {
    if (!roomId) return;
    if (!developerName) return; // wait for query param
    if (hasJoined) return; // guard against duplicate joins

    const initializeRoom = async () => {
      try {
        setIsJoining(true);

        // Connect socket if necessary
        const socket = socketManager.getSocket();
        if (!socket?.connected) {
          await socketManager.connect();
        }

        // Join room
        const result = await socketManager.joinRoom(roomId, developerName);
        console.log('Join room result:', result);

        if (result.success && result.room) {
          setRoom(result.room);
          const self = result.room.developers.find((d: { name: string; }) => d.name === developerName);
          setCurrentUser(developerName, self?.id || '');
          setCode(result.room.code);
          setLanguage(result.room.language);
          setHasJoined(true);
          addNotification('Successfully joined the room!', 'success');
        } else {
          addNotification(result.error || 'Failed to join room', 'error');
          setTimeout(() => router.push('/'), 2000);
        }
      } catch (error) {
        console.error('Failed to initialize room:', error);
        addNotification('Failed to connect to room', 'error');
        setTimeout(() => router.push('/'), 2000);
      } finally {
        setIsJoining(false);
      }
    };

    initializeRoom();

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [roomId, developerName, router, setRoom, setCurrentUser, addNotification, hasJoined]);

  // Socket event listeners
  useEffect(() => {
    const socket = socketManager.getSocket();
    if (!socket) return;

    socketManager.onRoomJoined((data: any) => {
      // update store with newest developer list
      updateRoom({ developers: data.developers });

      // if someone who was marked as disconnected came back, clear the reconnect UI
      if (disconnectedDeveloperRef.current && disconnectedDeveloperRef.current === data.developer) {
        disconnectedDeveloperRef.current = null;
        reconnectTargetRef.current = null;
        setReconnectTimer(0);
      }

      // ensure current user id (if server returned an id for us)
      if (currentUser && data.developer === currentUser && !currentUserId) {
        const self = data.developers.find((d: { name: string; }) => d.name === currentUser);
        if (self?.id) setCurrentUser(currentUser, self.id);
      }

      addNotification(`${data.developer} joined the room`, 'info');
    });

    socketManager.onCodeUpdated((data: any) => {
      // Update code silently
      setCode(data.code);
      if (room) updateRoom({ code: data.code });
    });

    socketManager.onTurnSwitched((data: any) => {
      if (room) updateRoom({ currentTurn: data.currentTurn });
      addNotification(`It's now ${data.activeDeveloper.name}'s turn to code`, 'info');
    });

    socketManager.onSessionStarted((data: any) => {
      if (room) updateRoom({ isActive: true, currentTurn: data.currentTurn });
      if (currentUser && !currentUserId && room) {
        const self = room.developers.find((d: { name: string; }) => d.name === currentUser);
        if (self?.id) setCurrentUser(currentUser, self.id);
      }
      addNotification('Coding session has started! 🚀', 'success');
    });

    socketManager.onTimerUpdate((timerData: any) => updateTimers(timerData));

    socketManager.onSessionEnded((data: SessionEndedData) => {
      setSessionEnded(data);
      if (room) updateRoom({ isActive: false });
    });

    // Developer disconnected: set a reconnect target timestamp
    socketManager.onDeveloperDisconnected((data: { developer: string; reconnectionWindow: number }) => {
      // reconnectionWindow expected in milliseconds
      const seconds = Math.max(0, Math.round((data.reconnectionWindow || 30000) / 1000));
      addNotification(`${data.developer} disconnected. Reconnection window: ${seconds}s`, 'warning');

      // mark developer inactive locally so header/footer shows inactive
      try {
        if (room) {
          updateRoom({ developers: room.developers.map((d: any) => d.name === data.developer ? { ...d, active: false } : d) });
        }
      } catch (e) { console.warn('Unable to mark developer inactive locally', e); }

      // set a target timestamp for the reconnect window
      const targetTs = Date.now() + Math.max(0, data.reconnectionWindow || 30000);
      reconnectTargetRef.current = targetTs;
      disconnectedDeveloperRef.current = data.developer;
      // set immediate display value
      setReconnectTimer(Math.ceil((targetTs - Date.now()) / 1000));
    });

    socketManager.onLanguageChanged((data: any) => {
      setLanguage(data.language);
      addNotification(`Language changed to ${data.language}`, 'info');
    });

    socketManager.onUserTyping((data: any) => {
      if (data.developer !== currentUser) setTyping(data.isTyping, data.developer);
    });

    const handleRunResult = (data: any) => {
      // keep existing run handling in case CodeEditor needs it
      // Expected { output: string }
      // We intentionally don't show an output panel here because CodeEditor shows it now
    };

    if ((socketManager as any).onRunResult && typeof (socketManager as any).onRunResult === 'function') {
      (socketManager as any).onRunResult(handleRunResult);
    } else {
      try { socket.on('run-result', handleRunResult); } catch (e) { }
    }

    socketManager.onError((error: any) => {
      addNotification(error.message || 'An error occurred', 'error');
    });


    return () => {
      socketManager.removeAllListeners();
      try { socket.off('run-result', handleRunResult); } catch { }
    };
    // intentionally not depending on addNotification to avoid re-registering listeners frequently
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, currentUser, currentUserId, updateRoom, updateTimers, setTyping]);

  // Handle code changes
  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    if (room && currentUserId) {
      socketManager.updateCode(roomId, newCode, currentUserId);
    }

    // typing indicator
    socketManager.sendTypingStatus(roomId, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketManager.sendTypingStatus(roomId, false);
    }, 1000);
  }, [room, currentUserId, roomId]);

  // Check if current user can edit
  const canEdit = room && room.isActive && currentUserId && room.developers[room.currentTurn]?.name === currentUser;

  // Debug logging
  useEffect(() => {
    if (room && currentUser) {
      console.log('Room state:', { roomId: room.id, currentUser, currentUserId, isActive: room.isActive, currentTurn: room.currentTurn, developers: room.developers, canEdit });
    }
  }, [room, currentUser, currentUserId, canEdit]);

  // If current user is missing from server list, try rejoin
  useEffect(() => {
    if (room && currentUser && !room.developers.some(d => d.name === currentUser) && hasJoined) {
      const rejoin = async () => {
        try {
          const result = await socketManager.joinRoom(roomId, developerName || '');
          if (result.success && result.room) {
            setRoom(result.room);
            const self = result.room.developers.find((d: { name: string; }) => d.name === developerName);
            setCurrentUser(developerName || '', self?.id || '');
          } else {
            console.error('Rejoin failed:', result.error);
          }
        } catch (err) {
          console.error('Failed to rejoin room:', err);
        }
      };
      rejoin();
    }
  }, [room, currentUser, roomId, developerName, hasJoined, setRoom, setCurrentUser]);

  // copy room code
  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      addNotification('Room code copied to clipboard!', 'success');
    } catch {
      addNotification('Failed to copy room code', 'error');
    }
  };

  // handle language change
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    socketManager.changeLanguage(roomId, newLanguage);
  };

  // handle manual turn switch
  const handleSwitchTurn = () => {
    if (room && room.isActive) socketManager.switchTurn(roomId);
  };

  // Proper leave handler (Leave button). This performs a clean disconnect and resets store.
  const handleLeaveRoom = useCallback(async () => {
    try {
      const s = socketManager.getSocket();
      if (s && s.connected) {
        try { s.emit('leave-room', { roomId, developer: developerName }); } catch { }
        s.disconnect();
      }
    } catch (err) {
      console.error('Error leaving room:', err);
    } finally {
      socketManager.disconnect();
      reset();
      router.push('/');
    }
  }, [roomId, developerName, reset, router]);

  // go home (used by SessionEndModal)
  const goHome = useCallback(() => {
    try {
      const s = socketManager.getSocket();
      if (s && s.connected) {
        s.disconnect();
      }
    } catch { }
    socketManager.disconnect();
    reset();
    router.push('/');
  }, [reset, router]);

  if (isJoining) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-xl">Joining room...</p>
          <p className="text-gray-400 mt-2">Room: {roomId}</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-xl mb-4">Room not found</p>
          <button
            onClick={goHome}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors duration-200"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-y-auto">
      <div className="container mx-auto px-4 py-6">
        {/* Header: two-row room label + id to avoid overflow */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div className="flex items-start space-x-4 w-full md:w-auto">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleLeaveRoom}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors duration-200"
                title="Leave room"
              >
                <Home size={20} />
              </button>
            </div>

            <div className="flex flex-col">
              <div className="text-left">
                <div className="text-2xl font-bold leading-tight">Room</div>
                <div className="mt-1 md:mt-0">
                  <code className="text-xl md:text-2xl font-mono bg-white/10 px-3 py-1 rounded-lg inline-block overflow-hidden truncate max-w-[22rem]">
                    {roomId}
                  </code>
                  <button
                    onClick={copyRoomCode}
                    className="ml-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors duration-200"
                    title="Copy room code"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-300 mt-2 md:mt-1">
                {room.developers.length} / 2 developers connected
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 justify-end">
            <UserStatus />
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors duration-200"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={handleLeaveRoom}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-sm text-white"
            >
              Leave
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-6 border border-white/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Users size={20} />
                <span>{room.developers.length}/2 Developers</span>
              </div>

              {room.isActive && (
                <>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${room.developers[room.currentTurn]?.name === currentUser ? 'bg-green-600 text-green-100' : 'bg-orange-600 text-orange-100'}`}>
                    {room.developers[room.currentTurn]?.name === currentUser ? "Your turn to code" : `${room.developers[room.currentTurn]?.name}'s turn`}
                  </div>

                  {canEdit && (
                    <button onClick={handleSwitchTurn} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-blue-100 rounded-full text-sm font-medium transition-colors duration-200">
                      Switch Turn
                    </button>
                  )}
                </>
              )}

              {isTyping && typingUser && (
                <div className="flex items-center space-x-2 text-yellow-400">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                  <span className="text-sm">{typingUser} is typing...</span>
                </div>
              )}
            </div>

            {room.isActive && <TimerDisplay />}
          </div>

          {reconnectTimer > 0 && (
            <div className="mt-3 p-3 bg-yellow-600/20 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-200 text-sm">
                Waiting for developer to reconnect... {reconnectTimer}s remaining
              </p>
            </div>
          )}
        </div>

        {/* Waiting for second developer */}
        {!room.isActive && room.developers.length < 2 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-4 border border-white/20 text-center">
            <div className="animate-pulse mb-4">
              <Users size={48} className="mx-auto text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Waiting for another developer...</h3>
            <p className="text-gray-400 mb-4">Share the room code with your coding partner</p>
            <div className="bg-white/10 rounded-lg p-4 max-w-xs mx-auto">
              <p className="text-sm text-gray-300 mb-2">Room Code:</p>
              <p className="text-2xl font-mono font-bold">{roomId}</p>
            </div>
          </div>
        )}

        {/* Settings */}
        {showSettings && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
            <h3 className="text-lg font-semibold mb-4">Settings</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['javascript', 'typescript', 'python', 'java', 'cpp', 'csharp', 'go', 'rust'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${language === lang ? 'bg-purple-600 text-white' : 'bg-white/10 hover:bg-white/20 text-gray-300'}`}
                >
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Editor (full width) */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
          <div className="flex flex-col h-[70vh] min-h-[40vh]">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-300">Language:</div>
                <div className="text-sm font-medium">{language.charAt(0).toUpperCase() + language.slice(1)}</div>
              </div>

              {/* Run button removed here — CodeEditor now exposes run/clear UI */}
            </div>

            <div className="flex-1 min-h-0 p-4">
              <CodeEditor
                value={code}
                onChange={handleCodeChange}
                language={language}
                readOnly={!canEdit}
                roomId={roomId}
              />
            </div>

            {/* connected developers footer */}
            <div className="p-4 border-t border-white/10 text-sm text-gray-300">
              <div className="mb-2">Connected developers:</div>
              <ul className="list-disc list-inside">
                {room.developers.map((d: any) => (
                  <li key={d.id} className="text-sm flex items-center justify-between">
                    <div>
                      {d.name} {d.id === currentUserId ? <span className="text-xs text-green-300">(you)</span> : null}
                      {!d.active && <span className="ml-2 text-xs text-yellow-300">(inactive)</span>}
                    </div>
                    <div className="text-xs text-gray-400">{d.role || ''}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="fixed bottom-6 right-6">

        <div
          className={`px-6 py-3 rounded-full text-base font-medium flex items-center shadow-lg ${isConnecting || !socketManager.getSocket()?.connected
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-green-100 text-green-800'
            }`}
        >
          <div
            className={`w-4 h-4 rounded-full mr-3 ${isConnecting || !socketManager.getSocket()?.connected
                ? 'bg-yellow-500 animate-pulse'
                : 'bg-green-500'
              }`}
          ></div>
          {isConnecting || !socketManager.getSocket()?.connected ? 'Connecting...' : 'Connected'}
        </div>
        </div>
        {/* Instructions */}
        {room.developers.length === 2 && !room.isActive && (
          <div className="mt-6 bg-blue-600/20 border border-blue-500/30 rounded-2xl p-6 text-center">
            <div className="flex items-center justify-center mb-3">
              <Play size={24} className="text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-blue-200 mb-2">Ready to Start!</h3>
            <p className="text-blue-300">
              Both developers are connected. The session will start automatically.
            </p>
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>

      {/* Session End Modal */}
      {sessionEnded && (
        <SessionEndModal
          data={sessionEnded}
          finalCode={sessionEnded.finalCode || code}
          onClose={() => {
            setSessionEnded(null);
          }}
          onGoHome={() => {
            setSessionEnded(null);
            goHome();
          }}
        />
      )}
    </div>
  );
}
