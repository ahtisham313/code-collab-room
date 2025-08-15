
'use client';

import { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { OnMount } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import { socketManager } from '@/lib/socket';
import { useRoomStore } from '@/lib/store';

type Monaco = typeof import('monaco-editor');

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  readOnly: boolean;
  roomId: string;
}

export default function CodeEditor({ value, onChange, language, readOnly, roomId }: CodeEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const { currentUser, currentUserId } = useRoomStore();

  // Remote output state (for outputs produced by other clients)
  const [remoteOutput, setRemoteOutput] = useState<string>('');
  const [remoteError, setRemoteError] = useState<string>('');
  const [remoteShowOutput, setRemoteShowOutput] = useState(false);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco as Monaco;

    // Configure editor theme
    monaco.editor.defineTheme('customDark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
      ],
      colors: {
        'editor.background': '#1a1a2e',
        'editor.foreground': '#eeeeee',
        'editorCursor.foreground': '#a7a7a7',
        'editor.lineHighlightBackground': '#2a2a4a',
        'editorLineNumber.foreground': '#858585',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41',
      }
    });

    monaco.editor.setTheme('customDark');

    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      lineHeight: 20,
      fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      renderLineHighlight: 'line',
      selectOnLineNumbers: true,
      roundedSelection: false,
      readOnly: readOnly,
      cursorStyle: 'line',
      automaticLayout: true,
      wordWrap: 'on',
      contextmenu: !readOnly,
      quickSuggestions: !readOnly,
      parameterHints: { enabled: !readOnly },
      suggestOnTriggerCharacters: !readOnly,
      tabCompletion: !readOnly ? 'on' : 'off',
      folding: true,
      foldingHighlight: true,
      showFoldingControls: 'mouseover',
      bracketPairColorization: { enabled: true }
    });

    // Add custom key bindings for active users
    if (!readOnly) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        // Prevent default save behavior
        console.log('Save prevented - auto-sync enabled');
      });

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, () => {
        editor.trigger('keyboard', 'undo', {});
      });

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ, () => {
        editor.trigger('keyboard', 'redo', {});
      });
    }

    // Focus editor if not read-only
    if (!readOnly) {
      editor.focus();
    }
  };

  const handleEditorChange = (newValue: string | undefined) => {
    if (newValue !== undefined && !readOnly) {
      onChange(newValue);
    }
  };

  // Update readd only status when it change
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ 
        readOnly: readOnly,
        contextmenu: !readOnly,
        quickSuggestions: !readOnly,
        parameterHints: { enabled: !readOnly },
        suggestOnTriggerCharacters: !readOnly,
        tabCompletion: !readOnly ? 'on' : 'off'
      });

      // Update cursor style based on read-only status
      const model = editorRef.current.getModel();
      if (model) {
        if (readOnly) {
          // Hide cursor for read-only mode
          editorRef.current.updateOptions({
            cursorStyle: 'line-thin',
            cursorBlinking: 'solid'
          });
        } else {
          // Show normal cursor for edit mode
          editorRef.current.updateOptions({
            cursorStyle: 'line',
            cursorBlinking: 'blink'
          });
          editorRef.current.focus();
        }
      }
    }
  }, [readOnly]);

  // Update language when it changes
  useEffect(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        if (monacoRef.current) {
          monacoRef.current.editor.setModelLanguage(model, language);
        }
      }
    }
  }, [language]);

  // Ensure caret alignment by forcing font measurement after fonts are ready
  useEffect(() => {
    if (monacoRef.current && editorRef.current && document && document.fonts) {
      document.fonts.ready.then(() => {
        try {
          editorRef.current!.updateOptions({});
          editorRef.current!.layout();
        } catch {}
      });
    }
  }, []);

  // Get language display name
  const getLanguageDisplayName = (lang: string) => {
    const languageMap: { [key: string]: string } = {
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      python: 'Python',
      java: 'Java',
      cpp: 'C++',
      csharp: 'C#',
      go: 'Go',
      rust: 'Rust'
    };
    return languageMap[lang] || lang;
  };

  // Get starter code based on language
  const getStarterCode = (lang: string) => {
    const starters: { [key: string]: string } = {
      javascript: '// Welcome to Code Collaboration Room!\n// Start coding when both developers join.\n\nconsole.log("Hello, World!");',
      typescript: '// Welcome to Code Collaboration Room!\n// Start coding when both developers join.\n\nconst greeting: string = "Hello, World!";\nconsole.log(greeting);',
      python: '# Welcome to Code Collaboration Room!\n# Start coding when both developers join.\n\nprint("Hello, World!")',
      java: '// Welcome to Code Collaboration Room!\n// Start coding when both developers join.\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
      cpp: '// Welcome to Code Collaboration Room!\n// Start coding when both developers join.\n\n#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}',
      csharp: '// Welcome to Code Collaboration Room!\n// Start coding when both developers join.\n\nusing System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}',
      go: '// Welcome to Code Collaboration Room!\n// Start coding when both developers join.\n\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!");\n}',
      rust: '// Welcome to Code Collaboration Room!\n// Start coding when both developers join.\n\nfn main() {\n    println!(\"Hello, World!\");\n}'
    };
    return starters[lang] || starters.javascript;
  };

  // --------------------------
  // Socket listener for remote run results
  // --------------------------
  useEffect(() => {
    const socket = socketManager.getSocket();
    if (!socket) return;

    const handler = (data: any) => {
      try {
        if (!data) return;
        if (data.roomId && data.roomId !== roomId) return; // ignore other rooms

        // If the runner is this client, ignore (they have local UI)
        if (data.ranById && data.ranById === currentUserId) {
          return;
        }

        const incomingOutput = data.output ?? '';
        const incomingError = data.error ?? '';

        setRemoteOutput(incomingOutput);
        setRemoteError(incomingError);
        setRemoteShowOutput(true);
      } catch (err) {
        console.warn('run-result handler error', err);
      }
    };

    // prefer wrapper if available
    if ((socketManager as any).onRunResult && typeof (socketManager as any).onRunResult === 'function') {
      try {
        (socketManager as any).onRunResult(handler);
      } catch {
        socket.on('run-result', handler);
      }
    } else {
      socket.on('run-result', handler);
    }

    return () => {
      try { socket.off('run-result', handler); } catch {}
    };
  }, [roomId, currentUserId]);

  // --------------------------
  // UI (editor + header)
  // --------------------------
  return (
    <div className="relative">
      {/* Editor Header */}
      <div className="bg-slate-800 px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-gray-300 text-sm font-medium">
            {getLanguageDisplayName(language)}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {readOnly && (
            <span className="px-2 py-1 bg-red-600/20 text-red-400 text-xs rounded-full border border-red-500/30">
              Read Only
            </span>
          )}
          {!readOnly && (
            <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded-full border border-green-500/30">
              Editing
            </span>
          )}
          <span className="text-gray-400 text-xs">
            Room: {roomId}
          </span>
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        <MonacoEditor
          height="60vh"
          language={language}
          value={value || getStarterCode(language)}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            theme: 'customDark'
          }}
          loading={
            <div className="flex items-center justify-center h-96 bg-slate-800">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-gray-400 text-sm">Loading editor...</p>
              </div>
            </div>
          }
        />
        
        {/* Read-only overlay message */}
        {readOnly && (
          <div className="absolute top-4 left-4 right-4 bg-amber-600/20 border border-amber-500/30 rounded-lg p-3 backdrop-blur-sm z-10">
            <p className="text-amber-200 text-sm text-center">
              🔒 You&apos;re in read-only mode. Wait for your turn to edit the code.
            </p>
          </div>
        )}

        {/* Run Button (JS/TS only) */}
        {!readOnly && (language === 'javascript' || language === 'typescript') && (
          <RunCodeButton code={value} language={language} roomId={roomId} />
        )}

        {/* Remote Output Panel (shown when another dev runs code) */}
        {remoteShowOutput && (
          <div className="absolute top-14 right-3 z-40 w-80 bg-slate-800 border border-white/20 rounded-lg shadow-xl">
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <h3 className="text-sm font-medium text-gray-200">Code Output (remote)</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setRemoteShowOutput(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-3 max-h-64 overflow-auto">
              {remoteError && (
                <div className="text-red-400 text-sm font-mono whitespace-pre-wrap">
                  {remoteError}
                </div>
              )}

              {!remoteError && remoteOutput && (
                <div className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                  {remoteOutput}
                </div>
              )}

              {!remoteError && !remoteOutput && (
                <div className="text-gray-400 text-sm">(no output)</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Editor Footer */}
      <div className="bg-slate-800 px-4 py-2 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Lines: {value.split('\n').length}</span>
          <span>Characters: {value.length}</span>
          <span>Mode: {readOnly ? 'Read-only' : 'Edit'}</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <span>Auto-save: On</span>
          <span>Sync: Real-time</span>
        </div>
      </div>
    </div>
  );
}

// Dynamic import must be after the component to avoid type-only import side effects
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false
});

// -------------------------
// RunCodeButton (local runner UI & worker emitter)
// -------------------------
// NOTE: this component no longer listens for run-result. It emits run-result after local execution.
// The remote listener lives in the parent CodeEditor (so everyone sees outputs whether readOnly or not).
function RunCodeButton({ code, language, roomId }: { code: string; language: string; roomId: string }) {
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showOutput, setShowOutput] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  const { currentUser, currentUserId } = useRoomStore();

  const cleanupWorker = () => {
    if (workerRef.current) {
      try {
        workerRef.current.terminate();
      } catch {}
      workerRef.current = null;
    }
  };

  const runInWorker = () => {
    if (isRunning) return;

    setError('');
    setOutput('');
    setShowOutput(true);

    if (!code || !code.trim()) {
      setError('No code to run');
      return;
    }

    cleanupWorker();
    setIsRunning(true);

    try {
      const workerCode = `
        self.onmessage = function(e) {
          try {
            const { code, lang } = e.data;
            const outputs = [];

            const originalLog = console.log;
            const originalError = console.error;
            console.log = function() {
              const args = Array.from(arguments);
              const output = args.map(arg => {
                if (typeof arg === 'object') {
                  try { return JSON.stringify(arg, null, 2); } catch { return String(arg); }
                }
                return String(arg);
              }).join(' ');
              outputs.push(output);
            };
            console.error = function() {
              const args = Array.from(arguments);
              const output = args.map(arg => {
                if (typeof arg === 'object') {
                  try { return JSON.stringify(arg, null, 2); } catch { return String(arg); }
                }
                return String(arg);
              }).join(' ');
              outputs.push('ERROR: ' + output);
            };

            let processedCode = code;
            if (lang === 'typescript') {
              processedCode = processedCode
                .replace(/:\\s*[^=;,)]+/g, '') 
                .replace(/interface\\s+\\w+\\s*\\{[\\s\\S]*?\\}/g, '')
                .replace(/type\\s+\\w+\\s*=/g, 'var ')
                .replace(/const\\s+(\\w+):\\s*string\\s*=/g, 'const $1 = ')
                .replace(/let\\s+(\\w+):\\s*string\\s*=/g, 'let $1 = ')
                .replace(/var\\s+(\\w+):\\s*string\\s*=/g, 'var $1 = ');
            }

            try {
              eval(processedCode);
              self.postMessage({ ok: true, output: outputs.length ? outputs.join('\\n') : '(no output)' });
            } catch (err) {
              const errMsg = err && err.stack ? String(err.stack) : String(err);
              self.postMessage({ ok: false, error: errMsg, output: outputs.length ? outputs.join('\\n') : '' });
            } finally {
              console.log = originalLog;
              console.error = originalError;
            }
          } catch (outerErr) {
            const message = outerErr && outerErr.stack ? String(outerErr.stack) : String(outerErr);
            self.postMessage({ ok: false, error: message });
          }
        };
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));
      workerRef.current = worker;

      worker.onmessage = (e) => {
        const { ok, output: resultOutput, error: resultError } = e.data as any;

        if (ok) {
          setOutput(resultOutput ?? '(no output)');
          setError('');
        } else {
          if (resultOutput) setOutput(resultOutput);
          setError(resultError ?? 'Unknown execution error');
        }

        setIsRunning(false);
        cleanupWorker();

        // emit the run-result to the server so other clients get it
        try {
          const s = socketManager.getSocket();
          const payload = {
            roomId,
            output: resultOutput ?? (resultOutput === '' ? '(no output)' : undefined),
            error: resultError,
            ranBy: currentUser ?? 'unknown',
            ranById: currentUserId ?? ''
          };
          if (s && s.connected) {
            try { s.emit('run-result', payload); } catch (e) { console.warn('emit run-result failed', e); }
          }
        } catch (emitErr) {
          console.warn('Failed to emit run-result', emitErr);
        }
      };

      worker.onerror = (ev: ErrorEvent) => {
        const details = [
          ev.message && `message: ${ev.message}`,
          (ev as any).filename && `file: ${(ev as any).filename}`,
          (ev as any).lineno != null && `line: ${(ev as any).lineno}`,
          (ev as any).colno != null && `col: ${(ev as any).colno}`,
          (ev.error && ev.error.stack) ? `stack: ${ev.error.stack}` : null
        ].filter(Boolean).join(' | ');

        const msg = details || 'Worker error (unknown)';
        console.error('Worker error (detailed):', ev, 'extracted:', msg);
        setError(`Execution error: ${msg}`);
        setIsRunning(false);
        cleanupWorker();
      };

      worker.postMessage({ code, lang: language });
    } catch (err: any) {
      const m = err && err.stack ? String(err.stack) : String(err);
      console.error('Failed to start worker:', err);
      setError(`Failed to start worker: ${m}`);
      setIsRunning(false);
      cleanupWorker();
    }
  };

  const toggleOutput = () => {
    setShowOutput((s) => !s);
    if (showOutput === true) {
      cleanupWorker();
      setIsRunning(false);
    }
  };

  const closeOutput = () => {
    setShowOutput(false);
    setOutput('');
    setError('');
    cleanupWorker();
    setIsRunning(false);
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupWorker();
    };
  }, []);

  return (
    <>
      {/* Run button */}
      <button
        onClick={runInWorker}
        disabled={isRunning}
        className={`absolute top-3 right-3 z-50 px-3 py-1 text-xs rounded-md text-white transition-colors ${
          isRunning ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 cursor-pointer'
        }`}
        title="Run code"
      >
        {isRunning ? (
          <div className="flex items-center">
            <div className="animate-spin w-3 h-3 border border-white/30 border-t-white rounded-full mr-1"></div>
            Running...
          </div>
        ) : (
          'Run'
        )}
      </button>

      {/* Local Output Panel */}
      {showOutput && (
        <div className="absolute top-14 right-3 z-40 w-80 bg-slate-800 border border-white/20 rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-3 border-b border-white/10">
            <h3 className="text-sm font-medium text-gray-200">Code Output (local)</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleOutput}
                className="text-gray-400 hover:text-white transition-colors"
                title="Toggle output"
              >
                ▤
              </button>
              <button
                onClick={closeOutput}
                className="text-gray-400 hover:text-white transition-colors"
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-3 max-h-64 overflow-auto">
            {isRunning && <div className="text-yellow-400 text-sm">Running code...</div>}

            {!isRunning && error && (
              <div className="text-red-400 text-sm font-mono whitespace-pre-wrap">
                {error}
              </div>
            )}

            {!isRunning && !error && output && (
              <div className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                {output}
              </div>
            )}

            {!isRunning && !error && !output && (
              <div className="text-gray-400 text-sm">No output</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
