/**
 * ARK RCON Console - Real-time command interface
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, Send, Copy, Trash2, Settings } from 'lucide-react';

interface ConsoleMessage {
  id: string;
  timestamp: Date;
  type: 'command' | 'output' | 'error' | 'info';
  content: string;
}

interface CommandLibraryItem {
  id: string;
  label: string;
  command: string;
  description: string;
  requiresInput?: boolean;
}

interface RconConsoleProps {
  serverId: string;
  serverName: string;
}

export function RconConsole({ serverId, serverName }: RconConsoleProps) {
  const [messages, setMessages] = useState<ConsoleMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [commandLibrary, setCommandLibrary] = useState<CommandLibraryItem[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load RCON status and command library
  useEffect(() => {
    const loadRconStatus = async () => {
      try {
        const response = await fetch(`/api/servers/${serverId}/rcon`);
        const data = await response.json();
        setConnected(data.rconAvailable);
        setCommandLibrary(data.commandLibrary || []);

        addMessage({
          type: 'info',
          content: `RCON Console Ready - ${serverName}`,
        });
      } catch (error) {
        addMessage({
          type: 'error',
          content: 'Failed to load RCON status',
        });
      }
    };

    loadRconStatus();
  }, [serverId, serverName]);

  const addMessage = (msg: Omit<ConsoleMessage, 'id' | 'timestamp'>) => {
    const newMessage: ConsoleMessage = {
      id: Math.random().toString(36),
      timestamp: new Date(),
      ...msg,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const executeCommand = async (command: string) => {
    if (!command.trim()) return;

    // Add command to console
    addMessage({
      type: 'command',
      content: `> ${command}`,
    });

    setLoading(true);

    try {
      const response = await fetch(`/api/servers/${serverId}/rcon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });

      const data = await response.json();

      if (data.success) {
        addMessage({
          type: 'output',
          content: data.output || 'Command executed',
        });
      } else {
        addMessage({
          type: 'error',
          content: data.error || 'Command failed',
        });
      }

      setInput('');
    } catch (error: any) {
      addMessage({
        type: 'error',
        content: `Error: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const clearConsole = () => {
    setMessages([]);
    addMessage({
      type: 'info',
      content: 'Console cleared',
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getMessageColor = (type: ConsoleMessage['type']) => {
    switch (type) {
      case 'command':
        return 'text-green-400';
      case 'output':
        return 'text-blue-300';
      case 'error':
        return 'text-red-400';
      case 'info':
        return 'text-yellow-300';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">RCON Console</h3>
          <p className="text-xs text-gray-400">{serverName}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowLibrary(!showLibrary)}
            className="h-8 px-3 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm flex items-center gap-1"
          >
            <Settings className="w-4 h-4" />
            Commands
          </button>
          <button
            onClick={clearConsole}
            className="h-8 px-3 bg-red-700 hover:bg-red-600 rounded text-white text-sm flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Console Output */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 font-mono text-sm bg-black">
            {messages.length === 0 ? (
              <div className="text-gray-500">Console ready...</div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`${getMessageColor(msg.type)} mb-1 flex items-start gap-2`}
                >
                  <span className="text-gray-500 flex-shrink-0">
                    [{msg.timestamp.toLocaleTimeString()}]
                  </span>
                  <span className="flex-1 break-words">{msg.content}</span>
                  <button
                    onClick={() => copyToClipboard(msg.content)}
                    className="flex-shrink-0 opacity-0 hover:opacity-100 transition-opacity p-1"
                    title="Copy"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
            <div ref={consoleEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-700 p-4 flex gap-2 bg-gray-800">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  executeCommand(input);
                }
              }}
              placeholder="Enter RCON command or use library below..."
              className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm"
              disabled={!connected || loading}
            />
            <button
              onClick={() => executeCommand(input)}
              disabled={!connected || loading || !input.trim()}
              className="px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-white flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Command Library Sidebar */}
        {showLibrary && (
          <div className="w-80 border-l border-gray-700 bg-gray-800 overflow-y-auto p-4">
            <h4 className="font-semibold text-white mb-3">Command Library</h4>
            <div className="space-y-2">
              {commandLibrary.map((cmd) => (
                <div
                  key={cmd.id}
                  className="bg-gray-900 p-3 rounded border border-gray-700 hover:border-gray-600 cursor-pointer transition-colors"
                  onClick={() => {
                    setInput(cmd.command);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-white text-sm">
                        {cmd.label}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {cmd.description}
                      </p>
                    </div>
                  </div>
                  <code className="text-xs text-green-400 mt-2 block bg-black p-2 rounded">
                    {cmd.command}
                  </code>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span>{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
        <div>Messages: {messages.length}</div>
      </div>
    </div>
  );
}
