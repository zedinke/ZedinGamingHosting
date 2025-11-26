'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ServerReportsProps {
  locale: string;
  initialPeriod?: string;
  initialGameType?: string;
}

export function ServerReports({
  locale,
  initialPeriod = '30',
  initialGameType = '',
}: ServerReportsProps) {
  const [period, setPeriod] = useState(initialPeriod);
  const [gameType, setGameType] = useState(initialGameType);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadReports();
  }, [period, gameType]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('period', period);
      if (gameType) params.set('gameType', gameType);

      const response = await fetch(`/api/admin/reports/servers?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        console.error('Reports error:', result.error);
        return;
      }

      setData(result);
    } catch (error) {
      console.error('Load reports error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8 text-gray-500">Betöltés...</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Szűrők */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Időszak (nap)
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="7">7 nap</option>
              <option value="30">30 nap</option>
              <option value="90">90 nap</option>
              <option value="365">1 év</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Játék típus
            </label>
            <select
              value={gameType}
              onChange={(e) => setGameType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Összes</option>
              <option value="MINECRAFT">Minecraft</option>
              <option value="ARK_EVOLVED">ARK: Survival Evolved</option>
              <option value="ARK_ASCENDED">ARK: Survival Ascended</option>
              <option value="CSGO">CS:GO</option>
              <option value="RUST">Rust</option>
              <option value="VALHEIM">Valheim</option>
              <option value="SEVEN_DAYS_TO_DIE">7 Days to Die</option>
            </select>
          </div>
          <button
            onClick={loadReports}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Frissítés
          </button>
        </div>
      </div>

      {/* Összefoglaló */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Összes Szerver</h3>
          <p className="text-3xl font-bold text-primary-600">{data.summary.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Online</h3>
          <p className="text-3xl font-bold text-green-600">{data.summary.online}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Offline</h3>
          <p className="text-3xl font-bold text-gray-600">{data.summary.offline}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Új ({period} nap)</h3>
          <p className="text-3xl font-bold text-blue-600">{data.summary.new}</p>
        </div>
      </div>

      {/* Játék típus szerint */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4">Játék Típus Szerint</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {data.byGame.map((item: any) => (
            <div key={item.gameType} className="bg-gray-50 p-4 rounded">
              <div className="font-medium">{item.gameType}</div>
              <div className="text-2xl font-bold text-primary-600 mt-1">
                {item._count.id}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Státusz szerint */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4">Státusz Szerint</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {data.byStatus.map((item: any) => (
            <div key={item.status} className="bg-gray-50 p-4 rounded">
              <div className="font-medium">{item.status}</div>
              <div className="text-2xl font-bold text-primary-600 mt-1">
                {item._count.id}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top felhasználók */}
      {data.topUsers && data.topUsers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold mb-4">Top 10 Felhasználó (Szerverek Száma)</h2>
          <div className="space-y-2">
            {data.topUsers.map((user: any, index: number) => (
              <div
                key={user.userId}
                className="flex justify-between items-center p-3 bg-gray-50 rounded"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">#{index + 1}</span>
                  <span className="font-medium">{user.userName}</span>
                </div>
                <span className="text-lg font-bold text-primary-600">{user.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Napi létrehozások grafikon */}
      {data.dailyCreations && data.dailyCreations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold mb-4">Napi Szerver Létrehozások</h2>
          <div className="space-y-2">
            {data.dailyCreations.map((day: any, index: number) => {
              const maxCount = Math.max(...data.dailyCreations.map((d: any) => d.count));
              const percentage = (day.count / maxCount) * 100;

              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString('hu-HU', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div
                      className="bg-primary-600 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${percentage}%` }}
                    >
                      <span className="text-xs text-white font-medium">{day.count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

