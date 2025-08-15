
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Code2, Users, Timer, Sparkles, Github, Globe, User, Key } from 'lucide-react';
import { socketManager } from '@/lib/socket';
import { useRoomStore } from '@/lib/store';

export default function HomePage() {
  const router = useRouter();
  const { setConnectionStatus, addNotification, reset } = useRoomStore();

  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [developerName, setDeveloperName] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    reset();

    const connectSocket = async () => {
      try {
        setIsConnecting(true);
        setConnectionStatus('connecting');
        await socketManager.connect();
        setConnectionStatus('connected');
      } catch (error) {
        console.error('Failed to connect:', error);
        setConnectionStatus('error');
        addNotification('Failed to connect to server', 'error');
      } finally {
        setIsConnecting(false);
      }
    };

    connectSocket();
  }, [setConnectionStatus, addNotification, reset]);

  const handleCreateRoom = async () => {
    if (!developerName.trim()) {
      addNotification('Please enter your name', 'warning');
      return;
    }

    setIsCreating(true);
    try {
      const result = await socketManager.createRoom();
      if (result.success && result.roomId) {
        addNotification('Room created successfully!', 'success');
        router.push(`/room/${result.roomId}?name=${encodeURIComponent(developerName)}`);
      } else {
        addNotification(result.error || 'Failed to create room', 'error');
      }
    } catch (error) {
      addNotification('Failed to create room', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      addNotification('Please enter a room code', 'warning');
      return;
    }
    if (!developerName.trim()) {
      addNotification('Please enter your name', 'warning');
      return;
    }

    setIsJoining(true);
    try {
      router.push(`/room/${roomCode.toUpperCase()}?name=${encodeURIComponent(developerName)}`);
    } catch (error) {
      addNotification('Failed to join room', 'error');
      setIsJoining(false);
    }
  };

  const handleRoomCodeChange = (value: string) => {
    const cleanValue = value.replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setRoomCode(cleanValue);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 to-indigo-900">
      {/* Header */}
      <header className="pt-16 pb-8 flex justify-center">
        <div className="flex flex-col items-center sm:flex-row sm:items-end sm:gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg">
            <Code2 className="text-white h-10 w-10" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mt-8 sm:mt-0">
            Code<span className="text-indigo-300">Collab</span>
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-4">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-md border border-white/40 rounded-2xl shadow-2xl p-8 sm:p-12 transition-all duration-300 hover:shadow-3xl">
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
              {showJoinForm ? "Join a Room" : "Get Started"}
            </h2>
            <p className="text-gray-600 mt-3 text-base sm:text-lg">
              {showJoinForm
                ? "Enter the room code to join a session"
                : "Create or join a coding session"}
            </p>
          </div>

          {/* Developer Name Input */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3 flex items-center">
              <User className="mr-2 h-5 w-5 text-indigo-600" />
              Your Name
            </label>
            <input
              type="text"
              value={developerName}
              onChange={(e) => setDeveloperName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 text-gray-800 text-base sm:text-lg shadow-sm"
              maxLength={50}
            />
          </div>

          {!showJoinForm ? (
            <div className="space-y-1 sm:space-y-4">
              {/* Create Room Button */}
              <button
                onClick={handleCreateRoom}
                disabled={isCreating || !developerName.trim()}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-3 sm:py-4 px-8 rounded-xl transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg disabled:shadow-none"
              >
                {isCreating ? (
                  <div className="flex items-center">
                    <div className="animate-spin w-5 h-5 sm:w-6 sm:h-6 border-2 border-white/30 border-t-white rounded-full mr-3"></div>
                    Creating Room...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Code2 className="mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                    Create New Room
                  </div>
                )}
              </button>

              {/* Divider */}
              <div className="relative flex items-center py-2 sm:py-4">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-3 text-gray-500 text-xs sm:text-sm">or</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              {/* Join Room Button */}
              <button
                onClick={() => setShowJoinForm(true)}
                className="w-full bg-white/90 border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50 font-semibold py-3 sm:py-4 px-8 rounded-xl transition-all duration-300 flex items-center justify-center shadow-sm hover:shadow-md"
              >
                <Users className="mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                Join Existing Room
              </button>
            </div>
          ) : (
            <div className="space-y-5 sm:space-y-6">
              {/* Room Code Input */}
              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3 flex items-center">
                  <Key className="mr-2 h-5 w-5 text-indigo-600" />
                  Room Code
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => handleRoomCodeChange(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character code"
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-center text-lg sm:text-xl tracking-wider font-mono placeholder:text-gray-400 text-gray-800 shadow-sm"
                  maxLength={6}
                />
              </div>

              {/* Join Button */}
              <button
                onClick={handleJoinRoom}
                disabled={isJoining || roomCode.length !== 6 || !developerName.trim()}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-3 sm:py-4 px-8 rounded-xl transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg disabled:shadow-none"
              >
                {isJoining ? (
                  <div className="flex items-center">
                    <div className="animate-spin w-5 h-5 sm:w-6 sm:h-6 border-2 border-white/30 border-t-white rounded-full mr-3"></div>
                    Joining Room...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Users className="mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                    Join Room
                  </div>
                )}
              </button>

              {/* Back Button */}
              <button
                onClick={() => {
                  setShowJoinForm(false);
                  setRoomCode('');
                }}
                className="w-full text-indigo-600 hover:text-indigo-800 py-2 sm:py-3 transition-colors duration-200 flex items-center justify-center text-sm sm:text-base font-medium mt-2 sm:mt-4"
              >
                <span className="mr-2">←</span> Back to options
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Description Section */}
      <section className="mt-16 mb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12 text-white">
            Why Choose CodeCollab?
          </h3>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 justify-items-center">
            {[
              {
                icon: Timer,
                title: "Turn-Based Coding",
                desc: "10-minute sessions with 2-minute turns. Perfect for pair programming and code reviews."
              },
              {
                icon: Users,
                title: "Real-time Collaboration",
                desc: "Instant synchronization with live cursor tracking and typing indicators."
              },
              {
                icon: Sparkles,
                title: "Simple & Efficient",
                desc: "Create rooms with 6-character codes. No registration required, start coding immediately."
              }
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="glass p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center max-w-sm w-full">
                <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-xl w-fit mb-6">
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-white">{title}</h3>
                <p className="text-indigo-100 text-lg">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/20 bg-gradient-to-r from-indigo-900/30 to-purple-900/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg mr-3">
                <Code2 className="text-white h-6 w-6" />
              </div>
              <span className="font-bold text-white text-lg">CodeCollab</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              <div className="flex items-center text-base text-indigo-200">
                <Globe className="mr-2 h-5 w-5 text-indigo-300" />
                <span>Real-time</span>
              </div>
              <div className="flex items-center text-base text-indigo-200">
                <Github className="mr-2 h-5 w-5 text-indigo-300" />
                <span>Open Source</span>
              </div>
              <div className="flex items-center text-base text-indigo-200">
                <Timer className="mr-2 h-5 w-5 text-indigo-300" />
                <span>Turn-based</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Connection Status Indicator */}
      {/* <div className="fixed bottom-6 right-6">
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
      </div> */}
    </div>
  );
}
