'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Server, Play, Square, RefreshCw, Settings, Loader2 } from 'lucide-react';

interface Server {
  id: string;
  name: string;
  gameType: string;
  maxPlayers: number;
  ipAddress: string | null;
  port: number | null;
  status: string;
}

interface ServerInstallStatus {
  [serverId: string]: {
    installStatus: 'not_installed' | 'installing' | 'completed' | 'error';
    installProgress: any;
    isInstalled: boolean;
  };
}

interface ServerListCardProps {
  servers: Server[];
  locale: string;
}

export function ServerListCard({ servers, locale }: ServerListCardProps) {
  const [installStatuses, setInstallStatuses] = useState<ServerInstallStatus>({});

  // Telepítési állapotok lekérése
  useEffect(() => {
    const fetchInstallStatuses = async () => {
      const statuses: ServerInstallStatus = {};
      
      for (const server of servers) {
        try {
          const response = await fetch(`/api/servers/${server.id}/install-status`);
          const data = await response.json();
          
          if (response.ok && data.success) {
            statuses[server.id] = {
              installStatus: data.installStatus,
              installProgress: data.installProgress,
              isInstalled: data.isInstalled,
            };
          } else {
            // Ha nincs telepítve, akkor not_installed
            statuses[server.id] = {
              installStatus: 'not_installed',
              installProgress: null,
              isInstalled: false,
            };
          }
        } catch (error) {
          statuses[server.id] = {
            installStatus: 'not_installed',
            installProgress: null,
            isInstalled: false,
          };
        }
      }
      
      setInstallStatuses(statuses);
    };

    fetchInstallStatuses();

    // Automatikus frissítés minden 3 másodpercben, ha van telepítés folyamatban
    let intervalId: NodeJS.Timeout | null = null;
    
    const startPolling = () => {
      intervalId = setInterval(() => {
        fetchInstallStatuses().then(() => {
          // Ellenőrizzük, hogy van-e még telepítés folyamatban
          setInstallStatuses((prev) => {
            const hasInstalling = Object.values(prev).some(
              (status) => status.installStatus === 'installing'
            );
            
            // Ha nincs telepítés folyamatban, akkor nem kell tovább frissíteni
            if (!hasInstalling && intervalId) {
              clearInterval(intervalId);
              intervalId = null;
            }
            
            return prev;
          });
        });
      }, 3000);
    };

    // Kezdetben mindig indítjuk a polling-ot
    startPolling();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [servers]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return <Badge variant="success">Online</Badge>;
      case 'OFFLINE':
        return <Badge variant="default">Offline</Badge>;
      case 'STARTING':
        return <Badge variant="warning">Indítás...</Badge>;
      case 'STOPPING':
        return <Badge variant="warning">Leállítás...</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getInstallStatusBadge = (serverId: string) => {
    const status = installStatuses[serverId];
    if (!status) {
      return null;
    }

    switch (status.installStatus) {
      case 'installing':
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Telepítés...
          </Badge>
        );
      case 'error':
        return <Badge variant="error">Telepítési hiba</Badge>;
      case 'not_installed':
        return <Badge variant="default">Telepítés szükséges</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Szervereim</h2>
          <p className="text-gray-600 text-sm">
            {servers.length} {servers.length === 1 ? 'szerver' : 'szerver'}
          </p>
        </div>
        <Link href={`/${locale}/servers/new`}>
          <Button size="sm" className="bg-primary-600 text-white hover:bg-primary-700">
            <Server className="w-4 h-4 mr-2" />
            Új szerver
          </Button>
        </Link>
      </div>

      {servers.length === 0 ? (
        <div className="text-center py-12">
          <Server className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Még nincs szervered</p>
          <Link href={`/${locale}/pricing`}>
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              Tekintsd meg az árazást
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {servers.map((server) => (
            <div
              key={server.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all bg-gray-50"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg text-gray-900">{server.name}</h3>
                    {getStatusBadge(server.status)}
                    {getInstallStatusBadge(server.id)}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Server className="w-4 h-4" />
                      {server.gameType}
                    </span>
                    <span>👥 {server.maxPlayers} játékos</span>
                    {server.ipAddress && server.port && (
                      <span>🌐 {server.ipAddress}:{server.port}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                {installStatuses[server.id]?.isInstalled ? (
                  <Link href={`/${locale}/dashboard/servers/${server.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Settings className="w-4 h-4 mr-2" />
                      Kezelés
                    </Button>
                  </Link>
                ) : (
                  <div className="flex-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full cursor-not-allowed opacity-60"
                      disabled
                    >
                      {installStatuses[server.id]?.installStatus === 'installing' ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Telepítés...
                        </>
                      ) : (
                        <>
                          <Loader2 className="w-4 h-4 mr-2" />
                          Telepítés
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

