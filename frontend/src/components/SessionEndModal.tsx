'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { X, Copy, Home } from 'lucide-react';
import type { SessionEndedData } from '@/types';

interface Props {
  data: SessionEndedData;
  finalCode: string;
  onClose: () => void;
  onGoHome: () => void;
}

/**
 * SessionEndModal
 * - shows final code
 * - copy button (copies final code to clipboard)
 * - enforces an 8-second client-side copy window, then auto-calls onGoHome
 */
export default function SessionEndModal({ data, finalCode, onClose, onGoHome }: Props) {
  // client window set to 8 seconds (match server)
  const CLIENT_COPY_WINDOW_MS = 8_000;
  const now = Date.now();
  const serverAllowUntil = data?.allowCopyUntil ?? 0;
  // prefer the server allow until but do not exceed client window; take whichever is smaller to be safe
  const effectiveAllowUntil = serverAllowUntil > now ? Math.min(serverAllowUntil, now + CLIENT_COPY_WINDOW_MS) : now + CLIENT_COPY_WINDOW_MS;

  const [timeLeftMs, setTimeLeftMs] = useState<number>(Math.max(0, effectiveAllowUntil - now));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const tick = () => {
      const t = Math.max(0, effectiveAllowUntil - Date.now());
      setTimeLeftMs(t);
      if (t <= 0) {
        // auto close and navigate home after window ends
        onGoHome();
      }
    };
    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [effectiveAllowUntil, onGoHome]);

  const secondsLeft = Math.ceil(timeLeftMs / 1000);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(finalCode || data.finalCode || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const humanReason = useMemo(() => {
    if (!data) return '';
    if (data.reason === 'timeout') return 'Session finished (time expired)';
    if (data.reason === 'disconnection') return 'Session ended due to disconnection';
    if (data.reason === 'manual') return 'Session manually ended';
    return 'Session ended';
  }, [data]);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative z-70 w-full max-w-3xl bg-slate-800 rounded-xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <h3 className="text-lg font-semibold">Session Ended</h3>
            <p className="text-sm text-gray-400 mt-1">{humanReason}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={handleCopy} className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-md flex items-center text-sm transition-colors">
              <Copy size={14} className="mr-2" />
              {copied ? 'Copied!' : 'Copy code'}
            </button>
            <button onClick={onClose} className="p-2 rounded-md text-gray-300 hover:text-white">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-6 bg-slate-900">
          <div className="mb-4 text-sm text-gray-300">Final code (available to copy for {secondsLeft}s)</div>
          <pre className="max-h-72 overflow-auto bg-black/50 p-4 rounded-md text-xs text-gray-200 whitespace-pre-wrap font-mono">
            {finalCode}
          </pre>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-400">You can copy the code now. This screen will close automatically.</div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onGoHome()}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-md text-white text-sm"
              >
                Go Home Now
              </button>
              <button
                onClick={handleCopy}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md text-white text-sm"
              >
                {copied ? 'Copied' : 'Copy code'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
