'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ServerStatus, GameType } from '@prisma/client';

interface Server {
  id: string;
  name: string;
  gameType: GameType;
  status: ServerStatus;
  ipAddress: string | null;
  port: number | null;
  maxPlayers: number;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  subscription: {
    id: string;
    status: string;
  } | null;
}

interface ServerManagementProps {
  servers: Server[];
  currentPage: number;
  totalPages: number;
  locale: string;
  statusFilter?: string;
}

export function ServerManagement({
  servers,
  currentPage,
  totalPages,
  locale,
  statusFilter,
}: ServerManagementProps) {
  const [search, setSearch] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    window.location.href = `/${locale}/admin/servers?${params.toString()}`;
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
    <div className="space-y-4">
      {/* Keresés és szűrők */}
      <div className="flex gap-2 flex-wrap">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[300px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Keresés szerver név vagy felhasználó alapján..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
          />
          <button
            type="submit"
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm hover:shadow-md"
          >
            Keresés
          </button>
        </form>
        
        {/* Státusz szűrők */}
        <div className="flex gap-2">
          <Link
            href={`/${locale}/admin/servers`}
            className={`px-4 py-2 rounded-lg text-sm ${
              !statusFilter
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Összes
          </Link>
          {['ONLINE', 'OFFLINE', 'STARTING', 'ERROR'].map((status) => (
            <Link
              key={status}
              href={`/${locale}/admin/servers?status=${status}`}
              className={`px-4 py-2 rounded-lg text-sm ${
                statusFilter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status}
            </Link>
          ))}
        </div>
      </div>

      {/* Szerverek táblázata */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-gray-700">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left p-3 font-semibold text-gray-900">Név</th>
              <th className="text-left p-3 font-semibold text-gray-900">Játék</th>
              <th className="text-left p-3 font-semibold text-gray-900">Tulajdonos</th>
              <th className="text-left p-3 font-semibold text-gray-900">Státusz</th>
              <th className="text-left p-3 font-semibold text-gray-900">IP:Port</th>
              <th className="text-left p-3 font-semibold text-gray-900">Játékosok</th>
              <th className="text-left p-3 font-semibold text-gray-900">Előfizetés</th>
              <th className="text-left p-3 font-semibold text-gray-900">Létrehozva</th>
              <th className="text-left p-3 font-semibold text-gray-900">Műveletek</th>
            </tr>
          </thead>
          <tbody>
            {servers.map((server) => (
              <tr key={server.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="p-3 font-medium text-gray-800">{server.name}</td>
                <td className="p-3">
                  <span className="text-sm">{getGameTypeLabel(server.gameType)}</span>
                </td>
                <td className="p-3">
                  <Link
                    href={`/${locale}/admin/users/${server.user.id}`}
                    className="text-primary-600 hover:underline"
                  >
                    {server.user.name || server.user.email}
                  </Link>
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(
                      server.status
                    )}`}
                  >
                    {server.status}
                  </span>
                </td>
                <td className="p-3 text-sm text-gray-700">
                  {server.ipAddress && server.port
                    ? `${server.ipAddress}:${server.port}`
                    : '-'}
                </td>
                <td className="p-3 text-gray-800">{server.maxPlayers}</td>
                <td className="p-3">
                  {server.subscription ? (
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        server.subscription.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {server.subscription.status}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">Nincs</span>
                  )}
                </td>
                <td className="p-3 text-sm text-gray-700">
                  {new Date(server.createdAt).toLocaleDateString('hu-HU')}
                </td>
                <td className="p-3">
                  <Link
                    href={`/${locale}/admin/servers/${server.id}`}
                    className="text-primary-600 hover:underline text-sm"
                  >
                    Kezelés
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagináció */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {currentPage > 1 && (
            <Link
              href={`/${locale}/admin/servers?page=${currentPage - 1}${statusFilter ? `&status=${statusFilter}` : ''}`}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
            >
              Előző
            </Link>
          )}
          <span className="px-4 py-2 text-gray-700">
            Oldal {currentPage} / {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`/${locale}/admin/servers?page=${currentPage + 1}${statusFilter ? `&status=${statusFilter}` : ''}`}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
            >
              Következő
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

