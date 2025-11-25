'use client';

import { useState } from 'react';
import { ServerStatus, GameType } from '@prisma/client';
import toast from 'react-hot-toast';
import { ServerFileManager } from './ServerFileManager';
import { ServerConsole } from './ServerConsole';
import { ServerBackupManager } from './ServerBackupManager';
import { ServerResourceMonitor } from './ServerResourceMonitor';
import { ServerConfigEditor } from './ServerConfigEditor';
import { ServerLogsViewer } from './ServerLogsViewer';
import { ServerMetrics } from './ServerMetrics';
import { ResourceLimitsEditor } from './ResourceLimitsEditor';
import { ServerScaling } from './ServerScaling';

interface Server {
  id: string;
  name: string;
  gameType: GameType;
  status: ServerStatus;
  ipAddress: string | null;
  port: number | null;
  maxPlayers: number;
  configuration: any;
  resourceUsage: any;
  machineId: string | null;
  agentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  subscription: {
    id: string;
    status: string;
    invoices: Array<{
      id: string;
      amount: number;
      currency: string;
      status: string;
      createdAt: Date;
    }>;
  } | null;
  machine: {
    id: string;
    name: string;
    ipAddress: string;
    status: string;
  } | null;
  agent: {
    id: string;
    agentId: string;
    status: string;
    lastHeartbeat: Date | null;
  } | null;
}

interface ServerDetailProps {
  server: Server;
  locale: string;
}

export function ServerDetail({ server, locale }: ServerDetailProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState(server.status);
  const [activeTab, setActiveTab] = useState<'files' | 'console' | 'backup' | 'config' | 'logs' | 'limits'>('files');

  const handleServerAction = async (action: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/servers/${server.id}/${action}`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Hiba történt');
        return;
      }

      toast.success('Művelet sikeresen végrehajtva');
      setServerStatus(result.status);
      // Oldal frissítése
      window.location.reload();
    } catch (error) {
      toast.error('Hiba történt');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeColor = (status: ServerStatus) => {
    switch (status) {
      case 'ONLINE':
        return 'bg-green-100 text-green-800';
      case 'OFFLINE':
        return 'bg-gray-100 text-gray-800';
      case 'STARTING':
        return 'bg-yellow-100 text-yellow-800';
      case 'STOPPING':
        return 'bg-orange-100 text-orange-800';
      case 'RESTARTING':
        return 'bg-blue-100 text-blue-800';
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getGameTypeLabel = (gameType: GameType) => {
    const labels: Record<GameType, string> = {
      ARK: 'ARK: Survival Evolved',
      MINECRAFT: 'Minecraft',
      CSGO: 'Counter-Strike: Global Offensive',
      RUST: 'Rust',
      VALHEIM: 'Valheim',
      SEVEN_DAYS_TO_DIE: '7 Days to Die',
      OTHER: 'Egyéb',
    };
    return labels[gameType] || gameType;
  };

  return (
    <div className="space-y-6">
      {/* Alapinformációk */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Alapinformációk</h2>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm text-gray-600">Név</dt>
              <dd className="font-medium">{server.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Játék</dt>
              <dd>{getGameTypeLabel(server.gameType)}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Státusz</dt>
              <dd>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(
                    serverStatus
                  )}`}
                >
                  {serverStatus}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">IP Cím</dt>
              <dd>{server.ipAddress || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Port</dt>
              <dd>{server.port || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Max Játékosok</dt>
              <dd>{server.maxPlayers}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Tulajdonos</dt>
              <dd>
                <a
                  href={`/${locale}/admin/users/${server.user.id}`}
                  className="text-primary-600 hover:underline"
                >
                  {server.user.name || server.user.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Létrehozva</dt>
              <dd>{new Date(server.createdAt).toLocaleString('hu-HU')}</dd>
            </div>
            {server.machine && (
              <div>
                <dt className="text-sm text-gray-600">Szerver Gép</dt>
                <dd>
                  <a
                    href={`/${locale}/admin/machines/${server.machine.id}`}
                    className="text-primary-600 hover:underline"
                  >
                    {server.machine.name} ({server.machine.ipAddress})
                  </a>
                </dd>
              </div>
            )}
            {server.agent && (
              <div>
                <dt className="text-sm text-gray-600">Agent</dt>
                <dd>
                  <span className="font-mono text-sm">{server.agent.agentId}</span>
                  {server.agent.lastHeartbeat && (
                    <span className="text-xs text-gray-500 ml-2">
                      (utolsó: {new Date(server.agent.lastHeartbeat).toLocaleString('hu-HU')})
                    </span>
                  )}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Szerver műveletek */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Szerver Műveletek</h2>
          <div className="space-y-2">
            <button
              onClick={() => handleServerAction('start')}
              disabled={isLoading || serverStatus === 'ONLINE' || serverStatus === 'STARTING'}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Indítás
            </button>
            <button
              onClick={() => handleServerAction('stop')}
              disabled={isLoading || serverStatus === 'OFFLINE' || serverStatus === 'STOPPING'}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Leállítás
            </button>
            <button
              onClick={() => handleServerAction('restart')}
              disabled={isLoading || serverStatus !== 'ONLINE'}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Újraindítás
            </button>
          </div>
        </div>
      </div>

      {/* Előfizetés információk */}
      {server.subscription && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Előfizetés</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Státusz:</span>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  server.subscription.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {server.subscription.status}
              </span>
            </div>
            {server.subscription.invoices.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Legutóbbi számlák</h3>
                <div className="space-y-2">
                  {server.subscription.invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex justify-between items-center p-2 bg-gray-50 rounded"
                    >
                      <span>
                        {new Intl.NumberFormat('hu-HU', {
                          style: 'currency',
                          currency: invoice.currency,
                        }).format(invoice.amount)}
                      </span>
                      <span className="text-sm text-gray-600">
                        {new Date(invoice.createdAt).toLocaleDateString('hu-HU')}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          invoice.status === 'PAID'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Konfiguráció */}
      {server.configuration && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Konfiguráció</h2>
          <pre className="bg-gray-50 p-4 rounded overflow-x-auto text-sm">
            {JSON.stringify(server.configuration, null, 2)}
          </pre>
        </div>
      )}

      {/* Fájlkezelő és Konzol */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Szerver Kezelés</h2>
        <div className="border-b mb-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('files')}
              className={`px-4 py-2 border-b-2 ${
                activeTab === 'files'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Fájlkezelő
            </button>
            <button
              onClick={() => setActiveTab('console')}
              className={`px-4 py-2 border-b-2 ${
                activeTab === 'console'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Konzol
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`px-4 py-2 border-b-2 ${
                activeTab === 'backup'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Backup
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`px-4 py-2 border-b-2 ${
                activeTab === 'config'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Konfiguráció
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 border-b-2 ${
                activeTab === 'logs'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Logok
            </button>
            <button
              onClick={() => setActiveTab('limits')}
              className={`px-4 py-2 border-b-2 ${
                activeTab === 'limits'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Erőforrás Limitok
            </button>
          </div>
        </div>
        {activeTab === 'files' && <ServerFileManager serverId={server.id} locale={locale} />}
        {activeTab === 'console' && <ServerConsole serverId={server.id} locale={locale} />}
        {activeTab === 'backup' && <ServerBackupManager serverId={server.id} locale={locale} />}
        {activeTab === 'config' && (
          <ServerConfigEditor
            serverId={server.id}
            gameType={server.gameType}
            maxPlayers={server.maxPlayers}
            initialConfig={server.configuration}
          />
        )}
        {activeTab === 'logs' && <ServerLogsViewer serverId={server.id} autoRefresh={true} />}
        {activeTab === 'limits' && <ResourceLimitsEditor serverId={server.id} />}
      </div>

      {/* Erőforrás használat - Real-time monitoring */}
      <ServerResourceMonitor
        serverId={server.id}
        initialResourceUsage={server.resourceUsage}
      />

      {/* Teljesítmény metrikák */}
      <ServerMetrics serverId={server.id} period={24} interval={1} />

      {/* Automatikus skálázás */}
      <ServerScaling serverId={server.id} locale={locale} />
    </div>
  );
}

