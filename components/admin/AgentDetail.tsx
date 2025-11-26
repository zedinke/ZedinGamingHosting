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
  const [isReinstalling, setIsReinstalling] = useState(false);
  const [reinstallLogs, setReinstallLogs] = useState<string[]>([]);
  const [showReinstallDialog, setShowReinstallDialog] = useState(false);

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

  const handleReinstall = async () => {
    if (!confirm('Biztosan újratelepíted az agentet? Ez néhány percig eltarthat, és az agent szolgáltatás újraindul.')) {
      return;
    }

    setIsReinstalling(true);
    setShowReinstallDialog(true);
    setReinstallLogs([]);
    
    try {
      const response = await fetch(`/api/admin/agents/${agent.id}/reinstall`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Hiba történt az agent újratelepítése során');
        if (result.logs) {
          setReinstallLogs(result.logs);
        }
        return;
      }

      toast.success('Agent sikeresen újratelepítve');
      if (result.logs) {
        setReinstallLogs(result.logs);
      }
      
      // Oldal frissítése néhány másodperc után
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error) {
      toast.error('Hiba történt');
      console.error('Reinstall error:', error);
    } finally {
      setIsReinstalling(false);
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Alapinformációk</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-700">Agent ID:</span>
              <p className="font-mono text-sm text-gray-900 mt-1">{agent.agentId}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Verzió:</span>
              <p className="text-gray-900 mt-1">{agent.version}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Státusz:</span>
              <p className="mt-1">
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
              <span className="text-sm font-medium text-gray-700">Gép:</span>
              <p className="mt-1">
                <Link
                  href={`/${locale}/admin/machines/${agent.machine.id}`}
                  className="text-primary-600 hover:underline font-medium text-gray-900"
                >
                  {agent.machine.name}
                </Link>
                <span className="text-gray-500 ml-2">({agent.machine.ipAddress})</span>
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Utolsó Heartbeat:</span>
              <p className="text-gray-900 mt-1">
                {agent.lastHeartbeat
                  ? new Date(agent.lastHeartbeat).toLocaleString('hu-HU')
                  : 'Soha'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Statisztikák</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-700">Szerverek:</span>
              <p className="text-2xl font-bold text-primary-600 mt-1">{agent._count.servers}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Feladatok:</span>
              <p className="text-2xl font-bold text-primary-600 mt-1">{agent._count.tasks}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Képességek:</span>
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

      {/* Agent Műveletek */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Agent Műveletek</h2>
        <div className="flex gap-2">
          <button
            onClick={handleReinstall}
            disabled={isReinstalling}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isReinstalling ? 'Újratelepítés...' : 'Agent Újratelepítése'}
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Az újratelepítés során az agent szolgáltatás újraindul, és a SteamCMD is újratelepítésre kerül, ha szükséges.
        </p>
      </div>

      {/* API Kulcs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">API Kulcs</h2>
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
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-sm break-all text-gray-900">{apiKey}</code>
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Szerverek ({servers.length})</h2>
        {servers.length === 0 ? (
          <p className="text-gray-600">Nincs szerver ehhez az agenthöz.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-gray-700">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left p-3 font-semibold text-gray-900">Név</th>
                  <th className="text-left p-3 font-semibold text-gray-900">Játék</th>
                  <th className="text-left p-3 font-semibold text-gray-900">Státusz</th>
                  <th className="text-left p-3 font-semibold text-gray-900">Felhasználó</th>
                  <th className="text-left p-3 font-semibold text-gray-900">Műveletek</th>
                </tr>
              </thead>
              <tbody>
                {servers.map((server) => (
                  <tr key={server.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-medium text-gray-800">{server.name}</td>
                    <td className="p-3 text-gray-900">{server.gameType}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          server.status === 'ONLINE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {server.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-900">{server.user.name || server.user.email}</td>
                    <td className="p-3">
                      <Link
                        href={`/${locale}/admin/servers/${server.id}`}
                        className="text-primary-600 hover:underline text-sm font-medium"
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Legutóbbi Feladatok</h2>
        {recentTasks.length === 0 ? (
          <p className="text-gray-600">Nincs feladat ehhez az agenthöz.</p>
        ) : (
          <div className="space-y-2">
            {recentTasks.map((task) => (
              <div
                key={task.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div>
                  <span className="font-medium text-gray-900">{task.type}</span>
                  {task.server && (
                    <span className="text-gray-600 ml-2">- {task.server.name}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
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

      {/* Újratelepítési dialógus */}
      {showReinstallDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Agent Újratelepítés</h2>
                <button
                  onClick={() => {
                    if (!isReinstalling) {
                      setShowReinstallDialog(false);
                      setReinstallLogs([]);
                    }
                  }}
                  className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  disabled={isReinstalling}
                >
                  ✕
                </button>
              </div>

              {isReinstalling ? (
                <div>
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Újratelepítés folyamatban...</p>
                  </div>
                  {reinstallLogs.length > 0 && (
                    <div className="mt-4 bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                      {reinstallLogs.map((log, index) => (
                        <div key={index} className="mb-1 text-gray-300">
                          {log}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {reinstallLogs.length > 0 ? (
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                      {reinstallLogs.map((log, index) => (
                        <div key={index} className="mb-1 text-gray-300">
                          {log}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">Nincs log üzenet</p>
                  )}
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => {
                        setShowReinstallDialog(false);
                        setReinstallLogs([]);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                    >
                      Bezárás
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

