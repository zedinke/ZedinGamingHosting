'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

interface GameServerStartupLogsProps {
  serverId: string;
  autoRefresh?: boolean;
}

export function GameServerStartupLogs({
  serverId,
  autoRefresh = false,
}: GameServerStartupLogsProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'error' | 'warning'>('all');
  const [lines, setLines] = useState(200);
  const [serviceStatus, setServiceStatus] = useState<string>('unknown');
  const [serviceActive, setServiceActive] = useState<boolean>(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Csak első betöltéskor és filter/lines változásakor töltjük be
  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, lines]);

  useEffect(() => {
    // Automatikus görgetés az új logokhoz
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/servers/${serverId}/startup-logs?lines=${lines}&filter=${filter}`
      );
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      setLogs(data.logs || []);
      setServiceStatus(data.serviceStatus || 'unknown');
      setServiceActive(data.serviceActive || false);
    } catch (error) {
      toast.error('Hiba történt a logok betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const getLogColor = (log: string) => {
    const lowerLog = log.toLowerCase();
    if (lowerLog.includes('error') || lowerLog.includes('failed') || lowerLog.includes('fatal')) {
      return 'text-red-400 font-semibold';
    }
    if (lowerLog.includes('warning') || lowerLog.includes('warn')) {
      return 'text-yellow-400';
    }
    if (lowerLog.includes('active') || lowerLog.includes('started') || lowerLog.includes('success')) {
      return 'text-green-400';
    }
    if (lowerLog.includes('inactive') || lowerLog.includes('stopped') || lowerLog.includes('failed')) {
      return 'text-red-400';
    }
    return 'text-white';
  };

  const getServiceStatusColor = () => {
    if (serviceActive) return 'text-green-600';
    if (serviceStatus === 'inactive') return 'text-red-600';
    if (serviceStatus === 'failed') return 'text-red-600';
    return 'text-yellow-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Indítási Logok (Systemd Service)</h2>
          <p className="text-sm text-gray-600 mt-1">
            Service státusz:{' '}
            <span className={`font-semibold ${getServiceStatusColor()}`}>
              {serviceStatus === 'active' ? 'Aktív' : serviceStatus === 'inactive' ? 'Inaktív' : serviceStatus === 'failed' ? 'Sikertelen' : serviceStatus}
            </span>
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">Összes</option>
            <option value="error">Csak Hibák</option>
            <option value="warning">Figyelmeztetések</option>
          </select>
          <select
            value={lines}
            onChange={(e) => setLines(parseInt(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="50">50 sor</option>
            <option value="100">100 sor</option>
            <option value="200">200 sor</option>
            <option value="500">500 sor</option>
            <option value="1000">1000 sor</option>
          </select>
          <button
            onClick={loadLogs}
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {loading ? 'Betöltés...' : 'Frissítés'}
          </button>
        </div>
      </div>

      <div className="bg-gray-900 text-white p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-gray-300">Nincs log</div>
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

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Info:</strong> Ezek a logok a systemd service indítási és futási logjait mutatják. 
          Itt láthatók az indítási hibák, a service státusz változások és a szerver indításakor fellépő problémák.
          A logok frissítéséhez használd a "Frissítés" gombot.
        </p>
      </div>
    </div>
  );
}

