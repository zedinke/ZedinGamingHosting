'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AgentStatus } from '@prisma/client';
import toast from 'react-hot-toast';

interface Agent {
  id: string;
  agentId: string;
  apiKey: string | null;
  version: string;
  status: AgentStatus;
  lastHeartbeat: Date | null;
  capabilities: any;
  machine: {
    id: string;
    name: string;
    ipAddress: string;
    status: string;
  };
  _count: {
    servers: number;
    tasks: number;
  };
}

interface Server {
  id: string;
  name: string;
  gameType: string;
  status: string;
  user: {
    name: string | null;
    email: string;
  };
}

interface Task {
  id: string;
  type: string;
  status: string;
  createdAt: Date;
  server: {
    id: string;
    name: string;
  } | null;
}

interface AgentDetailProps {
  agent: Agent;
  servers: Server[];
  recentTasks: Task[];
  locale: string;
}

export function AgentDetail({ agent, servers, recentTasks, locale }: AgentDetailProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState(agent.apiKey);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerateApiKey = async () => {
    if (!confirm('Biztosan újragenerálni szeretnéd az API kulcsot? A régi kulcs azonnal érvénytelenné válik.')) {
      return;
    }

    setIsRegenerating(true);
    try {
      const response = await fetch(`/api/admin/agents/${agent.id}/regenerate-api-key`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Hiba történt');
        return;
      }

      setApiKey(result.apiKey);
      setShowApiKey(true);
      toast.success('API kulcs sikeresen újragenerálva. Mentsd el az új kulcsot!');
    } catch (error) {
      toast.error('Hiba történt');
    } finally {
      setIsRegenerating(false);
    }
  };

  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      toast.success('API kulcs másolva');
    }
  };

  const getStatusBadgeColor = (status: AgentStatus) => {
    switch (status) {
      case 'ONLINE':
        return 'bg-green-100 text-green-800';
      case 'OFFLINE':
        return 'bg-gray-100 text-gray-800';
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      case 'UPDATING':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Agent Részletek</h1>
          <p className="text-gray-600">Agent ID: <span className="font-mono">{agent.agentId}</span></p>
        </div>
        <Link
          href={`/${locale}/admin/agents`}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Vissza
        </Link>
      </div>

      {/* Alapinformációk */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Alapinformációk</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-600">Agent ID:</span>
              <p className="font-mono text-sm">{agent.agentId}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Verzió:</span>
              <p>{agent.version}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Státusz:</span>
              <p>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(
                    agent.status
                  )}`}
                >
                  {agent.status}
                </span>
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Gép:</span>
              <p>
                <Link
                  href={`/${locale}/admin/machines/${agent.machine.id}`}
                  className="text-primary-600 hover:underline"
                >
                  {agent.machine.name}
                </Link>
                <span className="text-gray-500 ml-2">({agent.machine.ipAddress})</span>
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Utolsó Heartbeat:</span>
              <p>
                {agent.lastHeartbeat
                  ? new Date(agent.lastHeartbeat).toLocaleString('hu-HU')
                  : 'Soha'}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4">Statisztikák</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-600">Szerverek:</span>
              <p className="text-2xl font-bold text-primary-600">{agent._count.servers}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Feladatok:</span>
              <p className="text-2xl font-bold text-primary-600">{agent._count.tasks}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Képességek:</span>
              <div className="mt-1">
                {agent.capabilities
                  ? Object.entries(agent.capabilities)
                      .filter(([_, v]) => v)
                      .map(([k]) => (
                        <span
                          key={k}
                          className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded mr-2 mb-2"
                        >
                          {k}
                        </span>
                      ))
                  : '-'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Kulcs */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">API Kulcs</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm"
            >
              {showApiKey ? 'Elrejtés' : 'Megjelenítés'}
            </button>
            <button
              onClick={handleRegenerateApiKey}
              disabled={isRegenerating}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isRegenerating ? 'Újragenerálás...' : 'Újragenerálás'}
            </button>
          </div>
        </div>
        {showApiKey && apiKey ? (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-sm break-all">{apiKey}</code>
              <button
                onClick={copyApiKey}
                className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm"
              >
                Másolás
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              ⚠️ Ez az API kulcs csak egyszer jelenik meg. Mentsd el biztonságos helyre!
            </p>
          </div>
        ) : (
          <p className="text-gray-600">Kattints a "Megjelenítés" gombra az API kulcs megtekintéséhez.</p>
        )}
      </div>

      {/* Szerverek */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Szerverek ({servers.length})</h2>
        {servers.length === 0 ? (
          <p className="text-gray-600">Nincs szerver ehhez az agenthöz.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Név</th>
                  <th className="text-left p-3">Játék</th>
                  <th className="text-left p-3">Státusz</th>
                  <th className="text-left p-3">Felhasználó</th>
                  <th className="text-left p-3">Műveletek</th>
                </tr>
              </thead>
              <tbody>
                {servers.map((server) => (
                  <tr key={server.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{server.name}</td>
                    <td className="p-3">{server.gameType}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          server.status === 'ONLINE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {server.status}
                      </span>
                    </td>
                    <td className="p-3">{server.user.name || server.user.email}</td>
                    <td className="p-3">
                      <Link
                        href={`/${locale}/admin/servers/${server.id}`}
                        className="text-primary-600 hover:underline text-sm"
                      >
                        Részletek →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legutóbbi feladatok */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Legutóbbi Feladatok</h2>
        {recentTasks.length === 0 ? (
          <p className="text-gray-600">Nincs feladat ehhez az agenthöz.</p>
        ) : (
          <div className="space-y-2">
            {recentTasks.map((task) => (
              <div
                key={task.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded"
              >
                <div>
                  <span className="font-medium">{task.type}</span>
                  {task.server && (
                    <span className="text-gray-600 ml-2">- {task.server.name}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      task.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : task.status === 'FAILED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {task.status}
                  </span>
                  <span className="text-xs text-gray-600">
                    {new Date(task.createdAt).toLocaleString('hu-HU')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

