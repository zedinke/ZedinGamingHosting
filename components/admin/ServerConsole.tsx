'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

interface ServerConsoleProps {
  serverId: string;
  locale: string;
}

export function ServerConsole({ serverId, locale }: ServerConsoleProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 5000); // 5 másodpercenként frissítés
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const loadLogs = async () => {
    try {
      const response = await fetch(`/api/admin/servers/${serverId}/console?lines=100`);
      const data = await response.json();

      if (!response.ok) {
        return;
      }

      setLogs(data.logs || []);
    } catch (error) {
      // Csendes hiba, ne zavarjuk a felhasználót
    }
  };

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/servers/${serverId}/console`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      toast.success('Parancs elküldve');
      setCommand('');
      setTimeout(loadLogs, 1000); // 1 másodperc után frissítés
    } catch (error) {
      toast.error('Hiba történt a parancs küldése során');
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR':
        return 'text-red-600';
      case 'WARN':
        return 'text-yellow-600';
      case 'INFO':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Beállítások */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Automatikus görgetés</span>
        </label>
        <button
          onClick={loadLogs}
          className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm"
        >
          Frissítés
        </button>
      </div>

      {/* Konzol logok */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">Konzol Logok</h3>
        <div className="bg-gray-900 text-green-400 font-mono text-sm p-4 rounded h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">Nincs log bejegyzés</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                <span className="text-gray-500">
                  [{new Date(log.timestamp).toLocaleTimeString('hu-HU')}]
                </span>{' '}
                <span className={getLevelColor(log.level)}>[{log.level}]</span>{' '}
                <span>{log.message}</span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* Parancs küldése */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">Parancs Küldése</h3>
        <form onSubmit={handleSendCommand} className="flex gap-2">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Parancs (pl: say Hello World)"
            className="flex-1 px-4 py-2 border rounded-lg font-mono"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !command.trim()}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Küldés...' : 'Küldés'}
          </button>
        </form>
        <p className="text-sm text-gray-500 mt-2">
          Figyelem: A parancsok közvetlenül a szerver konzoljára kerülnek
        </p>
      </div>
    </div>
  );
}

