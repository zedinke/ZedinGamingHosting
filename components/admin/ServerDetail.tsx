'use client';

import { useState } from 'react';
import { ServerStatus, GameType, SubscriptionStatus } from '@prisma/client';
import toast from 'react-hot-toast';
import { ServerFileManager } from './ServerFileManager';
import { ServerConsole } from './ServerConsole';
import { ServerBackupManager } from './ServerBackupManager';
import { ServerResourceMonitor } from './ServerResourceMonitor';
import { ServerConfigEditor } from './ServerConfigEditor';
import { ServerLogsViewer } from './ServerLogsViewer';
import { GameServerStartupLogs } from './GameServerStartupLogs';
import { ServerMetrics } from './ServerMetrics';
import { ResourceLimitsEditor } from './ResourceLimitsEditor';
import { ServerScaling } from './ServerScaling';
import { ServerMigration } from './ServerMigration';
import { ServerDeleteDialog } from './ServerDeleteDialog';

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
  const [activeTab, setActiveTab] = useState<'files' | 'console' | 'backup' | 'config' | 'logs' | 'startup-logs' | 'limits'>('files');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [verifyResults, setVerifyResults] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(server.subscription?.status || null);

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
    const labels: Record<string, string> = {
      ARK_EVOLVED: 'ARK: Survival Evolved',
      ARK_ASCENDED: 'ARK: Survival Ascended',
      MINECRAFT: 'Minecraft',
      RUST: 'Rust',
      VALHEIM: 'Valheim',
      SEVEN_DAYS_TO_DIE: '7 Days to Die',
      CONAN_EXILES: 'Conan Exiles',
      DAYZ: 'DayZ',
      PROJECT_ZOMBOID: 'Project Zomboid',
      PALWORLD: 'Palworld',
      ENSHROUDED: 'Enshrouded',
      SONS_OF_THE_FOREST: 'Sons of the Forest',
      THE_FOREST: 'The Forest',
      GROUNDED: 'Grounded',
      V_RISING: 'V Rising',
      DONT_STARVE_TOGETHER: "Don't Starve Together",
      OTHER: 'Egyéb',
    };
    return labels[gameType] || gameType;
  };

  return (
    <div className="space-y-6">
      {/* Alapinformációk */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Alapinformációk</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-700 mb-1">Név</dt>
              <dd className="font-medium text-gray-900">{server.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700 mb-1">Játék</dt>
              <dd className="text-gray-900">{getGameTypeLabel(server.gameType)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700 mb-1">Státusz</dt>
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
              <dt className="text-sm font-medium text-gray-700 mb-1">IP Cím</dt>
              <dd className="text-gray-900">{server.ipAddress || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700 mb-1">Port</dt>
              <dd className="text-gray-900">{server.port || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700 mb-1">Max Játékosok</dt>
              <dd className="text-gray-900">{server.maxPlayers}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700 mb-1">Tulajdonos</dt>
              <dd>
                <a
                  href={`/${locale}/admin/users/${server.user.id}`}
                  className="text-primary-600 hover:underline font-medium text-gray-900"
                >
                  {server.user.name || server.user.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700 mb-1">Létrehozva</dt>
              <dd className="text-gray-900">{new Date(server.createdAt).toLocaleString('hu-HU')}</dd>
            </div>
            {server.machine && (
              <div>
                <dt className="text-sm font-medium text-gray-700 mb-1">Szerver Gép</dt>
                <dd>
                  <a
                    href={`/${locale}/admin/machines/${server.machine.id}`}
                    className="text-primary-600 hover:underline font-medium text-gray-900"
                  >
                    {server.machine.name} ({server.machine.ipAddress})
                  </a>
                </dd>
              </div>
            )}
            {server.agent && (
              <div>
                <dt className="text-sm font-medium text-gray-700 mb-1">Agent</dt>
                <dd>
                  <span className="font-mono text-sm text-gray-900">{server.agent.agentId}</span>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Szerver Műveletek</h2>
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
            <div className="pt-4 border-t border-gray-200 mt-4 space-y-2">
              <button
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    const response = await fetch(`/api/admin/servers/${server.id}/sync-status`, {
                      method: 'POST',
                    });
                    const result = await response.json();
                    if (response.ok) {
                      toast.success(result.message || 'Státusz szinkronizálva');
                      setServerStatus(result.newStatus);
                      setTimeout(() => window.location.reload(), 1000);
                    } else {
                      toast.error(result.error || 'Hiba történt');
                    }
                  } catch (error) {
                    toast.error('Hiba történt');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
                className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Státusz Szinkronizálása
              </button>
              <button
                onClick={async () => {
                  if (!confirm('Biztosan újratelepíted a szervert? Ez újra letölti a játék fájlokat és újragenerálja a konfigurációt. Ez néhány percig eltarthat.')) {
                    return;
                  }

                  setIsLoading(true);
                  try {
                    const response = await fetch(`/api/admin/servers/${server.id}/reinstall`, {
                      method: 'POST',
                    });
                    const result = await response.json();
                    if (response.ok) {
                      toast.success(result.message || 'Szerver újratelepítve');
                      setServerStatus('OFFLINE');
                      setTimeout(() => window.location.reload(), 2000);
                    } else {
                      toast.error(result.error || 'Hiba történt');
                    }
                  } catch (error) {
                    toast.error('Hiba történt');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Szerver Újratelepítése
              </button>
              <button
                onClick={async () => {
                  if (!confirm('Biztosan újratelepíted a systemd service fájlt? A szerver leáll, majd újrageneráljuk a service fájlt.')) {
                    return;
                  }

                  setIsLoading(true);
                  try {
                    const response = await fetch(`/api/admin/servers/${server.id}/reinstall-service`, {
                      method: 'POST',
                    });
                    const result = await response.json();
                    if (response.ok) {
                      toast.success(result.message || 'Service újratelepítve');
                      setServerStatus(result.newStatus);
                      setTimeout(() => window.location.reload(), 2000);
                    } else {
                      toast.error(result.error || 'Hiba történt');
                    }
                  } catch (error) {
                    toast.error('Hiba történt');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Service Újratelepítése
              </button>
              <button
                onClick={async () => {
                  setIsVerifying(true);
                  setShowVerifyDialog(true);
                  try {
                    const response = await fetch(`/api/admin/servers/${server.id}/verify-installation`, {
                      method: 'POST',
                    });
                    const result = await response.json();
                    if (response.ok) {
                      setVerifyResults(result);
                      if (result.hasErrors) {
                        toast.error('Telepítési hibák találhatók - nézd meg az ellenőrzési eredményeket');
                      } else if (result.hasWarnings) {
                        toast('Telepítési figyelmeztetések találhatók', {
                          icon: '⚠️',
                          duration: 4000,
                        });
                      } else {
                        toast.success('Telepítés ellenőrzése sikeres - minden rendben');
                      }
                    } else {
                      toast.error(result.error || 'Hiba történt');
                      setVerifyResults(null);
                    }
                  } catch (error) {
                    toast.error('Hiba történt');
                    setVerifyResults(null);
                  } finally {
                    setIsVerifying(false);
                  }
                }}
                disabled={isLoading || isVerifying}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? 'Ellenőrzés...' : 'Telepítés Ellenőrzése'}
              </button>
            </div>
            <div className="pt-4 border-t border-gray-200 mt-4">
              <button
                onClick={() => setShowDeleteDialog(true)}
                disabled={isLoading}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Szerver Törlése
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Előfizetés információk */}
      {server.subscription && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Előfizetés</h2>
            <div className="flex gap-2">
              <select
                value={subscriptionStatus || ''}
                onChange={async (e) => {
                  const newStatus = e.target.value as SubscriptionStatus;
                  if (!confirm(`Biztosan megváltoztatod az előfizetés státuszát ${server.subscription?.status}-ről ${newStatus}-re?`)) {
                    return;
                  }

                  setIsLoading(true);
                  try {
                    const response = await fetch(`/api/admin/subscriptions/${server.subscription?.id}/status`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ status: newStatus }),
                    });

                    const result = await response.json();

                    if (!response.ok) {
                      toast.error(result.error || 'Hiba történt');
                      return;
                    }

                    setSubscriptionStatus(newStatus);
                    toast.success('Előfizetés státusza sikeresen frissítve');
                    setTimeout(() => window.location.reload(), 1000);
                  } catch (error) {
                    toast.error('Hiba történt');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="ACTIVE">ACTIVE (Aktív)</option>
                <option value="CANCELED">CANCELED (Törölve)</option>
                <option value="PAST_DUE">PAST_DUE (Lejárt)</option>
                <option value="UNPAID">UNPAID (Fizetetlen)</option>
                <option value="TRIALING">TRIALING (Próba)</option>
              </select>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Státusz:</span>
              <span
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  subscriptionStatus === 'ACTIVE'
                    ? 'bg-green-100 text-green-800'
                    : subscriptionStatus === 'UNPAID' || subscriptionStatus === 'PAST_DUE'
                    ? 'bg-yellow-100 text-yellow-800'
                    : subscriptionStatus === 'CANCELED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {subscriptionStatus}
              </span>
            </div>
            {server.subscription.invoices.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-900 mb-2">Legutóbbi számlák</h3>
                <div className="space-y-2">
                  {server.subscription.invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <span className="font-medium text-gray-900">
                        {new Intl.NumberFormat('hu-HU', {
                          style: 'currency',
                          currency: invoice.currency,
                        }).format(invoice.amount)}
                      </span>
                      <span className="text-sm text-gray-600">
                        {new Date(invoice.createdAt).toLocaleDateString('hu-HU')}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Konfiguráció</h2>
          <pre className="bg-gray-50 p-4 rounded overflow-x-auto text-sm text-gray-900 border border-gray-200">
            {JSON.stringify(server.configuration, null, 2)}
          </pre>
        </div>
      )}

      {/* Fájlkezelő és Konzol */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Szerver Kezelés</h2>
        <div className="border-b border-gray-200 mb-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('files')}
              className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                activeTab === 'files'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Fájlkezelő
            </button>
            <button
              onClick={() => setActiveTab('console')}
              className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                activeTab === 'console'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Konzol
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                activeTab === 'backup'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Backup
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                activeTab === 'config'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Konfiguráció
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                activeTab === 'logs'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Játék Logok
            </button>
            <button
              onClick={() => setActiveTab('startup-logs')}
              className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                activeTab === 'startup-logs'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Indítási Logok
            </button>
            <button
              onClick={() => setActiveTab('limits')}
              className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                activeTab === 'limits'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
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
        {activeTab === 'startup-logs' && <GameServerStartupLogs serverId={server.id} autoRefresh={true} />}
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

      {/* Szerver Migráció */}
      <ServerMigration
        serverId={server.id}
        currentMachineId={server.machineId}
        locale={locale}
      />

      {/* Törlés Dialog */}
      {showDeleteDialog && (
        <ServerDeleteDialog
          serverId={server.id}
          serverName={server.name}
          locale={locale}
          onClose={() => setShowDeleteDialog(false)}
          onDeleted={() => {
            // Átirányítás a szerverek listájára
            window.location.href = `/${locale}/admin/servers`;
          }}
        />
      )}

      {/* Telepítés ellenőrzési dialógus */}
      {showVerifyDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Telepítés Ellenőrzése</h2>
                <button
                  onClick={() => {
                    setShowVerifyDialog(false);
                    setVerifyResults(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {isVerifying ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Ellenőrzés folyamatban...</p>
                </div>
              ) : verifyResults ? (
                <div>
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{verifyResults.summary.total}</div>
                        <div className="text-sm text-gray-600">Összes</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{verifyResults.summary.ok}</div>
                        <div className="text-sm text-gray-600">Rendben</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">{verifyResults.summary.warnings}</div>
                        <div className="text-sm text-gray-600">Figyelmeztetés</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">{verifyResults.summary.errors}</div>
                        <div className="text-sm text-gray-600">Hiba</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {verifyResults.results.map((result: any, index: number) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          result.status === 'ok'
                            ? 'bg-green-50 border-green-200'
                            : result.status === 'warning'
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-start">
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                            result.status === 'ok'
                              ? 'bg-green-500'
                              : result.status === 'warning'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}>
                            {result.status === 'ok' ? '✓' : result.status === 'warning' ? '⚠' : '✗'}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{result.check}</div>
                            <div className={`text-sm mt-1 ${
                              result.status === 'ok'
                                ? 'text-green-700'
                                : result.status === 'warning'
                                ? 'text-yellow-700'
                                : 'text-red-700'
                            }`}>
                              {result.message}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {verifyResults.hasErrors && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        <strong>Figyelem:</strong> Telepítési hibák találhatók. A szerver valószínűleg nem fog elindulni. 
                        Ellenőrizd az "Indítási Logok" tab-ot további részletekért.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nincs ellenőrzési eredmény
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowVerifyDialog(false);
                    setVerifyResults(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Bezárás
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

