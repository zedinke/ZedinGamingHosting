'use client';

import { useState, useEffect } from 'react';
import { ServerStatus, GameType } from '@prisma/client';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { UserServerConfigEditor } from './UserServerConfigEditor';
import { UserServerConfigFileEditor } from './UserServerConfigFileEditor';
import { ServerSavesManager } from './ServerSavesManager';
import { ARKASAServerConfigManager } from './ARKASAServerConfigManager';
import { ServerUpdateButton } from './ServerUpdateButton';
import { CronJobManager } from './CronJobManager';
import { SFTPInfo } from './SFTPInfo';
import { UserServerBackupManager } from './UserServerBackupManager';
import { UserGameConsoleManager } from './UserGameConsoleManager';
// import RustModStore from '@/components/games/RustModStore';

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
  createdAt: Date;
  subscription: {
    id: string;
    status: string;
    currentPeriodEnd: Date | null;
    invoices: Array<{
      id: string;
      amount: number;
      currency: string;
      status: string;
      invoiceNumber: string;
      createdAt: Date;
    }>;
  } | null;
}

interface UserServerDetailProps {
  server: Server;
  locale: string;
}

export function UserServerDetail({ server, locale }: UserServerDetailProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState(server.status);
  const [activeTab, setActiveTab] = useState<'info' | 'console' | 'config' | 'config-file' | 'cron' | 'sftp' | 'backup' | 'mods'>('info');
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);
  const [installProgress, setInstallProgress] = useState<any>(null);
  const [serverData, setServerData] = useState<Server>(server);

  // Telepítési állapot ellenőrzése és szerver adatok frissítése
  useEffect(() => {
    const checkInstallStatus = async () => {
      try {
        const response = await fetch(`/api/servers/${server.id}/install-status`);
        const data = await response.json();
        
        if (response.ok && data.success) {
          setIsInstalled(data.isInstalled);
          setInstallProgress(data.installProgress);
          
          // Ha nincs telepítve, redirect a dashboard-ra
          if (!data.isInstalled) {
            router.push(`/${locale}/dashboard`);
            return;
          }
        } else {
          // Ha nincs telepítve, redirect a dashboard-ra
          setIsInstalled(false);
          router.push(`/${locale}/dashboard`);
          return;
        }

        // Szerver adatok frissítése (port, stb.)
        const serverResponse = await fetch(`/api/servers/${server.id}`);
        if (serverResponse.ok) {
          const serverData = await serverResponse.json();
          if (serverData.server) {
            setServerData(serverData.server);
          }
        }
      } catch (error) {
        console.error('Install status check error:', error);
        setIsInstalled(false);
        router.push(`/${locale}/dashboard`);
      }
    };

    checkInstallStatus();

    // Automatikus frissítés, ha telepítés folyamatban van
    const interval = setInterval(() => {
      if (isInstalled === false || (installProgress && installProgress.status === 'installing')) {
        checkInstallStatus();
      } else if (isInstalled === true) {
        // Ha telepítve van, frissítsük a szerver adatokat (port, subscription, invoice, stb.)
        fetch(`/api/servers/${server.id}`)
          .then(res => res.json())
          .then(data => {
            if (data.server) {
              setServerData(data.server);
            }
          })
          .catch(err => console.error('Server data fetch error:', err));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [server.id, locale, router, isInstalled, installProgress]);
  
  // Fizetési státusz ellenőrzése külön polling-ot is indítunk, hogy gyorsabban frissüljön
  useEffect(() => {
    if (!isInstalled || isInstalled === null) return;
    
    const paymentCheckInterval = setInterval(() => {
      // Frissítsük a szerver adatokat, hogy a fizetési státusz is frissüljön
      fetch(`/api/servers/${server.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.server) {
            setServerData(data.server);
          }
        })
        .catch(err => console.error('Payment status check error:', err));
    }, 5000); // 5 másodpercenként ellenőrizzük a fizetési státuszt
    
    return () => clearInterval(paymentCheckInterval);
  }, [server.id, isInstalled]);

  // Szerver státusz automatikus frissítése 5 másodpercenként (zavarásmentesen)
  useEffect(() => {
    if (!isInstalled || isInstalled === null) return;
    
    const statusCheckInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/servers/${server.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.server && data.server.status) {
            // Csak akkor frissítjük, ha változott, hogy ne legyen zavaró
            setServerStatus(prevStatus => {
              if (prevStatus !== data.server.status) {
                return data.server.status;
              }
              return prevStatus;
            });
            // Frissítjük a serverData-t is, hogy a státusz mindenhol naprakész legyen
            setServerData(prevData => ({
              ...prevData,
              status: data.server.status,
            }));
          }
        }
      } catch (error) {
        console.error('Server status check error:', error);
        // Nem jelenítünk hibát, hogy ne legyen zavaró
      }
    }, 5000); // 5 másodpercenként frissítjük a státuszt
    
    return () => clearInterval(statusCheckInterval);
  }, [server.id, isInstalled]);

  const handleServerAction = async (action: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/servers/${server.id}/${action}`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Hiba történt');
        return;
      }

      toast.success('Művelet sikeresen végrehajtva');
      setServerStatus(result.status);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
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
    const labels: Partial<Record<GameType, string>> = {
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

  // Ha még nem ellenőriztük a telepítési állapotot, vagy nincs telepítve, mutassuk a telepítési üzenetet
  if (isInstalled === null) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Telepítési állapot ellenőrzése...</p>
        </div>
      </div>
    );
  }

  if (isInstalled === false) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Szerver telepítés alatt</h2>
          <p className="text-gray-600 mb-4">
            {installProgress?.status === 'installing' 
              ? `Telepítés folyamatban... (${installProgress.progress || 0}%)`
              : 'A szerver telepítése még nem fejeződött be. Kérjük, várjon...'}
          </p>
          {installProgress?.message && (
            <p className="text-sm text-gray-500 mb-4">{installProgress.message}</p>
          )}
          <a
            href={`/${locale}/dashboard`}
            className="text-primary-600 hover:text-primary-700 font-medium inline-block"
          >
            ← Vissza a dashboard-hoz
          </a>
        </div>
      </div>
    );
  }

  // Fizetési státusz ellenőrzése
  const isPaid = serverData.subscription && 
    (serverData.subscription.status === 'ACTIVE' || serverData.subscription.status === 'TRIALING') &&
    (!serverData.subscription.invoices || serverData.subscription.invoices.length === 0 || 
     serverData.subscription.invoices[0]?.status === 'PAID');

  // Ha nincs kifizetve, mutassuk a fizetési figyelmeztetést
  if (!isPaid) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Szerver nincs kifizetve</h2>
          <p className="text-gray-600 mb-4">
            A szerver használatához kérjük, fizesse ki a számlát.
          </p>
          {serverData.subscription?.invoices && serverData.subscription.invoices.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">
                Legutóbbi számla: {serverData.subscription.invoices[0].invoiceNumber}
              </p>
              <p className="text-sm text-gray-500">
                Státusz: <span className="font-semibold">{serverData.subscription.invoices[0].status}</span>
              </p>
            </div>
          )}
          <a
            href={`/${locale}/dashboard/billing`}
            className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 font-medium"
          >
            Fizetés
          </a>
          <div className="mt-4">
            <a
              href={`/${locale}/dashboard`}
              className="text-primary-600 hover:text-primary-700 font-medium inline-block"
            >
              ← Vissza a dashboard-hoz
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex gap-4 px-6">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-3 border-b-2 font-medium transition-colors ${
                activeTab === 'info'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Információk
            </button>
            <button
              onClick={() => setActiveTab('console')}
              className={`px-4 py-3 border-b-2 font-medium transition-colors ${
                activeTab === 'console'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Konzol
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`px-4 py-3 border-b-2 font-medium transition-colors ${
                activeTab === 'config'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Beállítások
            </button>
            <button
              onClick={() => setActiveTab('config-file')}
              className={`px-4 py-3 border-b-2 font-medium transition-colors ${
                activeTab === 'config-file'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Konfigurációs Fájl
            </button>
            <button
              onClick={() => setActiveTab('cron')}
              className={`px-4 py-3 border-b-2 font-medium transition-colors ${
                activeTab === 'cron'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Időzített Feladatok
            </button>
            <button
              onClick={() => setActiveTab('sftp')}
              className={`px-4 py-3 border-b-2 font-medium transition-colors ${
                activeTab === 'sftp'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              SFTP Hozzáférés
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`px-4 py-3 border-b-2 font-medium transition-colors ${
                activeTab === 'backup'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Backup Mentések
            </button>
            {server.gameType === 'RUST' && (
              <button
                onClick={() => setActiveTab('mods')}
                className={`px-4 py-3 border-b-2 font-medium transition-colors ${
                  activeTab === 'mods'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Modulok
              </button>
            )}
          </div>
        </div>
      </div>

      {activeTab === 'info' && (
        <>
          {/* Szerver információk */}
          <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Szerver Információk</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-700">Név:</dt>
              <dd className="font-medium text-gray-900">{server.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-700">Játék:</dt>
              <dd className="text-gray-900">{getGameTypeLabel(server.gameType)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-700">Státusz:</dt>
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
            <div className="flex justify-between">
              <dt className="text-gray-700">IP Cím:</dt>
              <dd className="text-gray-900">{serverData.ipAddress || server.ipAddress || 'Nincs hozzárendelve'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-700">Port:</dt>
              <dd className="text-gray-900">
                {server.gameType === 'SATISFACTORY' 
                  ? (() => {
                      // Satisfactory-nál a port már a megrendelés után generálódik és megjelenik
                      // A port mező a QueryPort-ot tartalmazza (4 számjegyű port)
                      const hasPort = (serverData.port !== null && serverData.port !== undefined) || (server.port !== null && server.port !== undefined);
                      
                      if (hasPort) {
                        return serverData.port || server.port; // Satisfactory-nál a port mező az adatbázisban a QueryPort-ot tartalmazza
                      } else {
                        return (
                          <span className="text-gray-500 italic text-sm">
                            Port generálás alatt...
                          </span>
                        );
                      }
                    })()
                  : (serverData.port || server.port || '-')}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-700">Max Játékosok:</dt>
              <dd className="text-gray-900">{server.maxPlayers}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-700">Létrehozva:</dt>
              <dd className="text-gray-900">{new Date(server.createdAt).toLocaleDateString('hu-HU')}</dd>
            </div>
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
              {serverStatus === 'STARTING' ? 'Indítás...' : 'Indítás'}
            </button>
            <button
              onClick={() => handleServerAction('stop')}
              disabled={isLoading || serverStatus === 'OFFLINE' || serverStatus === 'STOPPING'}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {serverStatus === 'STOPPING' ? 'Leállítás...' : 'Leállítás'}
            </button>
            <button
              onClick={() => handleServerAction('restart')}
              disabled={isLoading || serverStatus !== 'ONLINE'}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Újraindítás
            </button>
          </div>
          
          {/* Frissítés gomb */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <ServerUpdateButton 
              serverId={server.id} 
              locale={locale}
              gameType={server.gameType}
            />
          </div>
        </div>
      </div>

      {/* Előfizetés információk */}
      {server.subscription && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Előfizetés</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-700">Státusz:</span>
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
            {server.subscription.currentPeriodEnd && (
              <div className="flex justify-between">
                <span className="text-gray-700">Következő számlázás:</span>
                <span className="text-gray-900">
                  {new Date(server.subscription.currentPeriodEnd).toLocaleDateString('hu-HU')}
                </span>
              </div>
            )}
            {server.subscription.invoices.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Legutóbbi számlák</h3>
                <div className="space-y-2">
                  {server.subscription.invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div>
                        <span className="font-medium">{invoice.invoiceNumber}</span>
                        <span className="ml-2 text-sm text-gray-600">
                          {new Date(invoice.createdAt).toLocaleDateString('hu-HU')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">
                          {new Intl.NumberFormat('hu-HU', {
                            style: 'currency',
                            currency: invoice.currency,
                          }).format(invoice.amount)}
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
                        <a
                          href={`/${locale}/dashboard/billing/invoices/${invoice.id}`}
                          className="text-primary-600 hover:underline text-sm"
                        >
                          Részletek
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Erőforrás használat */}
      {server.resourceUsage && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Erőforrás Használat</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {server.resourceUsage.cpu && (
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">CPU</span>
                  <span className="text-sm font-semibold">{server.resourceUsage.cpu}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${server.resourceUsage.cpu}%` }}
                  />
                </div>
              </div>
            )}
            {server.resourceUsage.ram && (
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">RAM</span>
                  <span className="text-sm font-semibold">{server.resourceUsage.ram}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${server.resourceUsage.ram}%` }}
                  />
                </div>
              </div>
            )}
            {server.resourceUsage.disk && (
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Disk</span>
                  <span className="text-sm font-semibold">{server.resourceUsage.disk}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${server.resourceUsage.disk}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
        </>
      )}

      {activeTab === 'console' && (
        <div className="space-y-6">
          <UserGameConsoleManager serverId={server.id} gameType={server.gameType} />
        </div>
      )}

      {activeTab === 'config' && (
        <div className="space-y-6">
          {server.gameType === 'ARK_ASCENDED' ? (
            <ARKASAServerConfigManager
              serverId={server.id}
              ipAddress={serverData.ipAddress || server.ipAddress}
              port={serverData.port || server.port}
              queryPort={(serverData.port || server.port) ? (serverData.port || server.port)! + 1 : 27015}
              maxPlayers={server.maxPlayers}
            />
          ) : (
            <>
              <UserServerConfigEditor
                serverId={server.id}
                gameType={server.gameType}
                maxPlayers={server.maxPlayers}
                initialConfig={server.configuration}
              />
              {server.gameType === 'THE_FOREST' && (
                <ServerSavesManager
                  serverId={server.id}
                  gameType={server.gameType}
                />
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'config-file' && (
        <div className="space-y-6">
          <UserServerConfigFileEditor
            serverId={server.id}
            gameType={server.gameType}
            ipAddress={serverData.ipAddress || server.ipAddress}
            port={serverData.port || server.port}
            maxPlayers={server.maxPlayers}
          />
        </div>
      )}

      {activeTab === 'cron' && (
        <div className="space-y-6">
          <CronJobManager serverId={server.id} locale={locale} />
        </div>
      )}

      {activeTab === 'sftp' && (
        <div className="space-y-6">
          <SFTPInfo serverId={server.id} locale={locale} />
        </div>
      )}

      {activeTab === 'backup' && (
        <div className="space-y-6">
          <UserServerBackupManager serverId={server.id} locale={locale} />
        </div>
      )}

      {activeTab === 'mods' && server.gameType === 'RUST' && (
        <div className="space-y-6">
          {/* <RustModStore serverId={server.id} serverName={server.name} /> */}
          <p className="text-muted-foreground">Mod store coming soon...</p>
        </div>
      )}
    </div>
  );
}

