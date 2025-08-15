'use client';

import { useEffect, useState } from 'react';
import { X, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

interface NotificationToastProps {
  notification: {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: number;
  };
  onClose: () => void;
}

export default function NotificationToast({ notification, onClose }: NotificationToastProps){
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in
    setIsVisible(true);

    // Auto dismiss after 5 second
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match  animation duration
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  const getIconColor = () => {
    switch (notification.type) {
      case 'success':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-blue-400';
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 shadow-lg transform transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 ${getIconColor()}`}>
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white">{notification.message}</p>
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors duration-200"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}