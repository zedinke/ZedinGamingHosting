'use client';

import { useState } from 'react';
import { ServerStatus, GameType } from '@prisma/client';
import toast from 'react-hot-toast';

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
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState(server.status);

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
      {/* Szerver információk */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Szerver Információk</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-600">Név:</dt>
              <dd className="font-medium">{server.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Játék:</dt>
              <dd>{getGameTypeLabel(server.gameType)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Státusz:</dt>
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
              <dt className="text-gray-600">IP Cím:</dt>
              <dd>{server.ipAddress || 'Nincs hozzárendelve'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Port:</dt>
              <dd>{server.port || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Max Játékosok:</dt>
              <dd>{server.maxPlayers}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Létrehozva:</dt>
              <dd>{new Date(server.createdAt).toLocaleDateString('hu-HU')}</dd>
            </div>
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
        </div>
      </div>

      {/* Előfizetés információk */}
      {server.subscription && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Előfizetés</h2>
          <div className="space-y-3">
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
            {server.subscription.currentPeriodEnd && (
              <div className="flex justify-between">
                <span className="text-gray-600">Következő számlázás:</span>
                <span>
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
                      className="flex justify-between items-center p-2 bg-gray-50 rounded"
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
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Erőforrás Használat</h2>
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
    </div>
  );
}

