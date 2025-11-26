'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Server, Play, Square, RefreshCw, Settings } from 'lucide-react';

interface Server {
  id: string;
  name: string;
  gameType: string;
  maxPlayers: number;
  ipAddress: string | null;
  port: number | null;
  status: string;
}

interface ServerListCardProps {
  servers: Server[];
  locale: string;
}

export function ServerListCard({ servers, locale }: ServerListCardProps) {
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
                <Link href={`/${locale}/dashboard/servers/${server.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Kezelés
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

