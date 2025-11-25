'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/Badge';
import { RefreshCw, Trash2, Download, AlertCircle, Info, AlertTriangle, XCircle } from 'lucide-react';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: string;
  message: string;
  data?: any;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

interface DebugManagementProps {
  locale: string;
}

export function DebugManagement({ locale }: DebugManagementProps) {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [levelFilter, setLevelFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'debug'>('all');

  // Load debug mode status
  useEffect(() => {
    loadDebugStatus();
    loadLogs();
  }, []);

  const loadDebugStatus = async () => {
    try {
      const response = await fetch('/api/admin/debug');
      if (response.ok) {
        const data = await response.json();
        setEnabled(data.enabled);
      }
    } catch (error) {
      console.error('Error loading debug status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const levelParam = levelFilter === 'all' ? '' : `&level=${levelFilter}`;
      const response = await fetch(`/api/admin/debug?action=logs&limit=500${levelParam}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Hiba történt a logok betöltése során');
    } finally {
      setLogsLoading(false);
    }
  };

  const toggleDebugMode = async () => {
    try {
      const response = await fetch('/api/admin/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', enabled: !enabled }),
      });

      if (response.ok) {
        const data = await response.json();
        setEnabled(data.enabled);
        toast.success(data.message);
      } else {
        toast.error('Hiba történt a debug mód váltása során');
      }
    } catch (error) {
      console.error('Error toggling debug mode:', error);
      toast.error('Hiba történt');
    }
  };

  const clearLogs = async () => {
    if (!confirm('Biztosan törölni szeretnéd az összes debug logot?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' }),
      });

      if (response.ok) {
        toast.success('Logok törölve');
        loadLogs();
      } else {
        toast.error('Hiba történt a logok törlése során');
      }
    } catch (error) {
      console.error('Error clearing logs:', error);
      toast.error('Hiba történt');
    }
  };

  const downloadLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.category}] ${log.message}${log.data ? '\n' + JSON.stringify(log.data, null, 2) : ''}`
    ).join('\n\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'debug':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLevelBadge = (level: LogEntry['level']) => {
    const variants: Record<LogEntry['level'], 'error' | 'warning' | 'info' | 'default'> = {
      error: 'error',
      warn: 'warning',
      info: 'info',
      debug: 'default',
    };
    return <Badge variant={variants[level]}>{level.toUpperCase()}</Badge>;
  };

  if (loading) {
    return <div>Betöltés...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Debug Mode Toggle */}
      <Card padding="lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">Debug Mód</h2>
            <p className="text-gray-600 text-sm">
              Ha be van kapcsolva, minden művelet és hiba logolva lesz a debug log fájlba.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={enabled ? 'success' : 'default'}>
              {enabled ? 'Bekapcsolva' : 'Kikapcsolva'}
            </Badge>
            <Button
              onClick={toggleDebugMode}
              variant={enabled ? 'danger' : 'primary'}
            >
              {enabled ? 'Kikapcsolás' : 'Bekapcsolás'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Logs Section */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Debug Logok</h2>
          <div className="flex gap-2">
            <select
              value={levelFilter}
              onChange={(e) => {
                setLevelFilter(e.target.value as any);
                setTimeout(loadLogs, 100);
              }}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">Összes</option>
              <option value="error">Csak hibák</option>
              <option value="warn">Csak figyelmeztetések</option>
              <option value="info">Csak információk</option>
              <option value="debug">Csak debug</option>
            </select>
            <Button
              onClick={loadLogs}
              variant="outline"
              size="sm"
              disabled={logsLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${logsLoading ? 'animate-spin' : ''}`} />
              Frissítés
            </Button>
            <Button
              onClick={downloadLogs}
              variant="outline"
              size="sm"
              disabled={logs.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Letöltés
            </Button>
            <Button
              onClick={clearLogs}
              variant="danger"
              size="sm"
              disabled={logs.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Törlés
            </Button>
          </div>
        </div>

        {/* Logs List */}
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {logsLoading ? (
            <div className="text-center py-8 text-gray-500">Logok betöltése...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nincsenek logok</div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getLevelIcon(log.level)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getLevelBadge(log.level)}
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString('hu-HU')}
                      </span>
                      <span className="text-xs text-gray-400">[{log.category}]</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">{log.message}</p>
                    {log.data && (
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                    {(log.userId || log.ip) && (
                      <div className="text-xs text-gray-400 mt-2">
                        {log.userId && <span>User: {log.userId}</span>}
                        {log.ip && <span className="ml-2">IP: {log.ip}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

