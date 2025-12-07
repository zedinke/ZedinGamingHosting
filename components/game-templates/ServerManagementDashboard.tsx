/**
 * Server Management Dashboard
 * Admin szerver kezelés, monitoring, frissítések
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';

interface ServerStatus {
  serverId: string;
  gameName: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  containerStatus: string;
  uptime: number;
  cpu: string;
  memory: string;
  disk: {
    used: number;
    total: number;
    percentUsed: number;
  };
  lastCheck: string;
  alerts: number;
  updateAvailable: boolean;
  lastUpdate?: string;
}

interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  type: string;
  message: string;
  createdAt: string;
  resolved: boolean;
}

/**
 * Server Management Card
 */
const ServerCard: React.FC<{
  server: ServerStatus;
  onRestart?: () => void;
  onUpdate?: () => void;
  onViewAlerts?: () => void;
}> = ({ server, onRestart, onUpdate, onViewAlerts }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 border-green-200';
      case 'degraded':
        return 'bg-yellow-50 border-yellow-200';
      case 'unhealthy':
        return 'bg-red-50 border-red-200';
      case 'offline':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">✓ Egészséges</span>;
      case 'degraded':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">⚠ Leromlott</span>;
      case 'unhealthy':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">✗ Nem egészséges</span>;
      case 'offline':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded">⊘ Offline</span>;
      default:
        return null;
    }
  };

  const uptimeHours = Math.floor(server.uptime / 3600);
  const uptimeMinutes = Math.floor((server.uptime % 3600) / 60);

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor(server.status)}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg">{server.gameName}</h3>
          <p className="text-xs text-gray-600">{server.serverId}</p>
        </div>
        {getStatusBadge(server.status)}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <div className="text-gray-600">Container</div>
          <div className="font-semibold text-xs">{server.containerStatus}</div>
        </div>
        <div>
          <div className="text-gray-600">Uptime</div>
          <div className="font-semibold text-xs">{uptimeHours}h {uptimeMinutes}m</div>
        </div>

        <div>
          <div className="text-gray-600">CPU</div>
          <div className="font-semibold text-xs">{server.cpu}</div>
        </div>
        <div>
          <div className="text-gray-600">Memory</div>
          <div className="font-semibold text-xs">{server.memory}</div>
        </div>

        <div>
          <div className="text-gray-600">Disk</div>
          <div className="font-semibold text-xs">{server.disk.percentUsed}% ({server.disk.used}/{server.disk.total}GB)</div>
        </div>
        <div>
          <div className="text-gray-600">Last check</div>
          <div className="font-semibold text-xs">{server.lastCheck}</div>
        </div>
      </div>

      {server.updateAvailable && (
        <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-3">
          <p className="text-xs text-blue-700">
            📦 Frissítés elérhető
            {server.lastUpdate && <span> (utolsó: {server.lastUpdate})</span>}
          </p>
        </div>
      )}

      {server.alerts > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded p-2 mb-3">
          <p className="text-xs text-orange-700">⚠️ {server.alerts} aktív riasztás</p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onRestart}
          className="flex-1 px-3 py-2 bg-gray-600 text-white text-xs font-semibold rounded hover:bg-gray-700 transition"
        >
          🔄 Restart
        </button>
        <button
          onClick={onUpdate}
          className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition"
          disabled={!server.updateAvailable}
        >
          📥 Update
        </button>
        <button
          onClick={onViewAlerts}
          className="flex-1 px-3 py-2 bg-orange-600 text-white text-xs font-semibold rounded hover:bg-orange-700 transition"
          disabled={server.alerts === 0}
        >
          ⚠️ Riasztások
        </button>
      </div>
    </div>
  );
};

/**
 * Server Management Dashboard
 */
export const ServerManagementDashboard: React.FC<{ userId: string }> = ({ userId }) => {
  const [servers, setServers] = useState<ServerStatus[]>([]);
  const [selectedServer, setSelectedServer] = useState<ServerStatus | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Load servers
  const loadServers = useCallback(async () => {
    try {
      // Mock data - valóságban API-ból jönne
      const mockServers: ServerStatus[] = [
        {
          serverId: 'srv-ark-01',
          gameName: 'ARK Survival Ascended',
          status: 'healthy',
          containerStatus: 'running',
          uptime: 172800, // 2 days
          cpu: '45%',
          memory: '62%',
          disk: { used: 58, total: 100, percentUsed: 58 },
          lastCheck: format(new Date(), 'HH:mm:ss'),
          alerts: 0,
          updateAvailable: false,
          lastUpdate: format(new Date(Date.now() - 7 * 24 * 3600 * 1000), 'yyyy-MM-dd'),
        },
        {
          serverId: 'srv-rust-01',
          gameName: 'Rust',
          status: 'degraded',
          containerStatus: 'running',
          uptime: 86400,
          cpu: '78%',
          memory: '85%',
          disk: { used: 22, total: 40, percentUsed: 55 },
          lastCheck: format(new Date(), 'HH:mm:ss'),
          alerts: 2,
          updateAvailable: true,
          lastUpdate: format(new Date(Date.now() - 14 * 24 * 3600 * 1000), 'yyyy-MM-dd'),
        },
        {
          serverId: 'srv-ark-evolved-01',
          gameName: 'ARK Survival Evolved',
          status: 'healthy',
          containerStatus: 'running',
          uptime: 345600,
          cpu: '32%',
          memory: '48%',
          disk: { used: 45, total: 80, percentUsed: 56 },
          lastCheck: format(new Date(), 'HH:mm:ss'),
          alerts: 1,
          updateAvailable: false,
          lastUpdate: format(new Date(Date.now() - 3 * 24 * 3600 * 1000), 'yyyy-MM-dd'),
        },
      ];

      setServers(mockServers);
      setLoading(false);
    } catch (error) {
      console.error('Server load hiba:', error);
      setLoading(false);
    }
  }, []);

  // Load alerts for selected server
  const loadAlerts = useCallback(async (serverId: string) => {
    try {
      // Mock alerts
      const mockAlerts: Alert[] = [
        {
          id: 'alert-1',
          severity: 'warning',
          type: 'cpu_high',
          message: 'CPU utilization magas',
          createdAt: format(new Date(Date.now() - 1800 * 1000), 'HH:mm:ss'),
          resolved: false,
        },
      ];

      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Alerts load hiba:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadServers();
  }, [loadServers]);

  // Refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadServers, 30000);
    return () => clearInterval(interval);
  }, [loadServers]);

  const handleRestart = async (server: ServerStatus) => {
    setActionInProgress(true);
    try {
      // API call would go here
      console.log(`Restarting ${server.serverId}`);
      // await fetch(`/api/servers/${server.serverId}/restart`, { method: 'POST' });
      setAction(`✅ ${server.gameName} újraindítása megkezdődött...`);
      setTimeout(() => setAction(null), 5000);
    } catch (error) {
      setAction(`❌ Hiba: ${error instanceof Error ? error.message : 'Ismeretlen hiba'}`);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleUpdate = async (server: ServerStatus) => {
    setActionInProgress(true);
    try {
      console.log(`Updating ${server.serverId}`);
      setAction(`📥 ${server.gameName} frissítése megkezdődött...`);
      setTimeout(() => setAction(null), 5000);
    } catch (error) {
      setAction(`❌ Hiba: ${error instanceof Error ? error.message : 'Ismeretlen hiba'}`);
    } finally {
      setActionInProgress(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">⏳ Szerver info betöltése...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">🖥️ Szerver Management</h1>
        <p className="text-gray-600 mb-6">Telepített szervereink kezelése és monitoring</p>

        {action && (
          <div className={`p-4 rounded-lg mb-6 ${action.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {action}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {servers.map((server) => (
            <ServerCard
              key={server.serverId}
              server={server}
              onRestart={() => handleRestart(server)}
              onUpdate={() => handleUpdate(server)}
              onViewAlerts={() => {
                setSelectedServer(server);
                loadAlerts(server.serverId);
              }}
            />
          ))}
        </div>

        {selectedServer && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{selectedServer.gameName} - Riasztások</h2>
              <button
                onClick={() => setSelectedServer(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {alerts.length === 0 ? (
              <p className="text-gray-600">Nincsenek aktív riasztások</p>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded border ${
                      alert.severity === 'critical'
                        ? 'bg-red-50 border-red-200'
                        : alert.severity === 'warning'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-sm">{alert.type}</p>
                        <p className="text-xs text-gray-700">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{alert.createdAt}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        alert.severity === 'critical'
                          ? 'bg-red-200 text-red-800'
                          : alert.severity === 'warning'
                          ? 'bg-yellow-200 text-yellow-800'
                          : 'bg-blue-200 text-blue-800'
                      }`}>
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServerManagementDashboard;
