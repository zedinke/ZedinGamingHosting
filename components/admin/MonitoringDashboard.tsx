'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MachineStatus, AgentStatus, TaskStatus } from '@prisma/client';

interface Machine {
  id: string;
  name: string;
  ipAddress: string;
  status: MachineStatus;
  lastHeartbeat: Date | null;
  resources: any;
  agents: Array<{
    id: string;
    agentId: string;
    status: AgentStatus;
    lastHeartbeat: Date | null;
  }>;
  _count: {
    servers: number;
  };
}

interface Task {
  id: string;
  type: string;
  status: TaskStatus;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  agent: {
    machine: {
      name: string;
      ipAddress: string;
    };
  } | null;
  server: {
    name: string;
  } | null;
}

interface Stats {
  machines: {
    total: number;
    online: number;
    offline: number;
  };
  agents: {
    total: number;
    online: number;
    offline: number;
  };
  servers: {
    total: number;
    online: number;
    offline: number;
  };
  tasks: {
    pending: number;
    running: number;
  };
}

interface MonitoringDashboardProps {
  stats: Stats;
  machines: Machine[];
  recentTasks: Task[];
  locale: string;
}

export function MonitoringDashboard({
  stats,
  machines,
  recentTasks,
  locale,
}: MonitoringDashboardProps) {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // másodperc

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      window.location.reload();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const getStatusBadgeColor = (status: MachineStatus | AgentStatus) => {
    switch (status) {
      case 'ONLINE':
        return 'bg-green-100 text-green-800';
      case 'OFFLINE':
        return 'bg-gray-100 text-gray-800';
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      case 'MAINTENANCE':
      case 'UPDATING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'RUNNING':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Auto-refresh beállítások */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Automatikus frissítés</span>
            </label>
            {autoRefresh && (
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="10">10 másodperc</option>
                <option value="30">30 másodperc</option>
                <option value="60">1 perc</option>
                <option value="300">5 perc</option>
              </select>
            )}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
          >
            Frissítés
          </button>
        </div>
      </div>

      {/* Statisztikák */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Szerver Gépek */}
        <div className="card">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Szerver Gépek</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-2xl font-bold text-primary-600">{stats.machines.total}</span>
              <span className="text-sm text-gray-600">összesen</span>
            </div>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-green-600 font-medium">{stats.machines.online}</span>
                <span className="text-gray-600 ml-1">online</span>
              </div>
              <div>
                <span className="text-gray-600 font-medium">{stats.machines.offline}</span>
                <span className="text-gray-600 ml-1">offline</span>
              </div>
            </div>
          </div>
        </div>

        {/* Agentek */}
        <div className="card">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Agentek</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-2xl font-bold text-primary-600">{stats.agents.total}</span>
              <span className="text-sm text-gray-600">összesen</span>
            </div>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-green-600 font-medium">{stats.agents.online}</span>
                <span className="text-gray-600 ml-1">online</span>
              </div>
              <div>
                <span className="text-gray-600 font-medium">{stats.agents.offline}</span>
                <span className="text-gray-600 ml-1">offline</span>
              </div>
            </div>
          </div>
        </div>

        {/* Szerverek */}
        <div className="card">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Szerverek</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-2xl font-bold text-primary-600">{stats.servers.total}</span>
              <span className="text-sm text-gray-600">összesen</span>
            </div>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-green-600 font-medium">{stats.servers.online}</span>
                <span className="text-gray-600 ml-1">online</span>
              </div>
              <div>
                <span className="text-gray-600 font-medium">{stats.servers.offline}</span>
                <span className="text-gray-600 ml-1">offline</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feladatok */}
        <div className="card">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Feladatok</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-2xl font-bold text-primary-600">
                {stats.tasks.pending + stats.tasks.running}
              </span>
              <span className="text-sm text-gray-600">aktív</span>
            </div>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-yellow-600 font-medium">{stats.tasks.pending}</span>
                <span className="text-gray-600 ml-1">várakozó</span>
              </div>
              <div>
                <span className="text-blue-600 font-medium">{stats.tasks.running}</span>
                <span className="text-gray-600 ml-1">futó</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Szerver Gépek Áttekintés */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Szerver Gépek Áttekintés</h2>
          <Link
            href={`/${locale}/admin/machines`}
            className="text-primary-600 hover:underline text-sm"
          >
            Összes megtekintése →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Név</th>
                <th className="text-left p-3">IP Cím</th>
                <th className="text-left p-3">Státusz</th>
                <th className="text-left p-3">Agentek</th>
                <th className="text-left p-3">Szerverek</th>
                <th className="text-left p-3">Utolsó Heartbeat</th>
                <th className="text-left p-3">Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {machines.map((machine) => (
                <tr key={machine.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{machine.name}</td>
                  <td className="p-3">{machine.ipAddress}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(
                        machine.status
                      )}`}
                    >
                      {machine.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="space-y-1">
                      {machine.agents.map((agent) => (
                        <div key={agent.id} className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${getStatusBadgeColor(
                              agent.status
                            )}`}
                          >
                            {agent.agentId}
                          </span>
                        </div>
                      ))}
                      {machine.agents.length === 0 && (
                        <span className="text-gray-400 text-sm">Nincs agent</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">{machine._count.servers}</td>
                  <td className="p-3 text-sm text-gray-600">
                    {machine.lastHeartbeat
                      ? new Date(machine.lastHeartbeat).toLocaleString('hu-HU')
                      : '-'}
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/${locale}/admin/machines/${machine.id}`}
                      className="text-primary-600 hover:underline text-sm"
                    >
                      Részletek
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legutóbbi Feladatok */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Legutóbbi Feladatok</h2>
          <Link
            href={`/${locale}/admin/tasks`}
            className="text-primary-600 hover:underline text-sm"
          >
            Összes megtekintése →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Típus</th>
                <th className="text-left p-3">Státusz</th>
                <th className="text-left p-3">Gép</th>
                <th className="text-left p-3">Szerver</th>
                <th className="text-left p-3">Létrehozva</th>
              </tr>
            </thead>
            <tbody>
              {recentTasks.map((task) => (
                <tr key={task.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{task.type}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${getTaskStatusColor(
                        task.status
                      )}`}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td className="p-3 text-sm">
                    {task.agent ? (
                      <span>
                        {task.agent.machine.name} ({task.agent.machine.ipAddress})
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-3 text-sm">
                    {task.server ? (
                      <Link
                        href={`/${locale}/admin/servers/${task.server.id}`}
                        className="text-primary-600 hover:underline"
                      >
                        {task.server.name}
                      </Link>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-3 text-sm text-gray-600">
                    {new Date(task.createdAt).toLocaleString('hu-HU')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

