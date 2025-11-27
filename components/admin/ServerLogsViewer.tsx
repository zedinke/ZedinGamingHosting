'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

interface ServerLogsViewerProps {
  serverId: string;
  autoRefresh?: boolean;
}

export function ServerLogsViewer({
  serverId,
  autoRefresh = false,
}: ServerLogsViewerProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [logType, setLogType] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [lines, setLines] = useState(100);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Csak első betöltéskor és logType/lines változásakor töltjük be
  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logType, lines]);

  useEffect(() => {
    // Automatikus görgetés az új logokhoz
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/servers/${serverId}/logs?lines=${lines}&type=${logType}`
      );
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      setLogs(data.logs || []);
    } catch (error) {
      toast.error('Hiba történt a logok betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const getLogColor = (log: string) => {
    if (log.includes('[ERROR]')) return 'text-red-600';
    if (log.includes('[WARN]')) return 'text-yellow-600';
    if (log.includes('[INFO]')) return 'text-blue-600';
    return 'text-gray-800';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Szerver Logok</h2>
        <div className="flex gap-2 items-center">
          <select
            value={logType}
            onChange={(e) => setLogType(e.target.value as any)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="all">Összes</option>
            <option value="error">Hibák</option>
            <option value="warning">Figyelmeztetések</option>
            <option value="info">Információk</option>
          </select>
          <select
            value={lines}
            onChange={(e) => setLines(parseInt(e.target.value))}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="50">50 sor</option>
            <option value="100">100 sor</option>
            <option value="200">200 sor</option>
            <option value="500">500 sor</option>
          </select>
          <button
            onClick={loadLogs}
            disabled={loading}
            className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-sm"
          >
            {loading ? 'Betöltés...' : 'Frissítés'}
          </button>
        </div>
      </div>

      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-gray-500">Nincs log</div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className={`mb-1 ${getLogColor(log)}`}
            >
              {log}
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}

