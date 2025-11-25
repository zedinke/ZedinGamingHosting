'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useServerSentEvents } from '@/lib/use-server-sent-events';

interface SystemHealthProps {
  locale: string;
}

export function SystemHealth({ locale }: SystemHealthProps) {
  const [health, setHealth] = useState<any>(null);

  // Real-time health monitoring
  const { data: streamData, connected } = useServerSentEvents({
    url: '/api/admin/monitoring/stream',
    enabled: true,
    onMessage: (data) => {
      if (data.type === 'stats') {
        setHealth(data.data);
      }
    },
  });

  useEffect(() => {
    // Kezdeti adatok betöltése
    fetch('/api/admin/monitoring/health')
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch(console.error);
  }, []);

  if (!health) {
    return (
      <div className="card">
        <div className="text-center py-8 text-gray-500">Betöltés...</div>
      </div>
    );
  }

  const calculateHealthScore = () => {
    if (!health.machines || !health.agents) return 0;

    const machineHealth = health.machines.total > 0
      ? (health.machines.online / health.machines.total) * 100
      : 0;
    const agentHealth = health.agents.total > 0
      ? (health.agents.online / health.agents.total) * 100
      : 0;
    const serverHealth = health.servers.total > 0
      ? (health.servers.online / health.servers.total) * 100
      : 0;

    return Math.round((machineHealth + agentHealth + serverHealth) / 3);
  };

  const healthScore = calculateHealthScore();
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Rendszer egészség */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Rendszer Egészség</h2>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                connected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-gray-600">
              {connected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
        <div className="text-center py-8">
          <div className={`text-6xl font-bold mb-2 ${getHealthColor(healthScore)}`}>
            {healthScore}%
          </div>
          <div className="text-gray-600">Rendszer Egészség Pontszám</div>
        </div>
      </div>

      {/* Gyors statisztikák */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Szerver Gépek</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-2xl font-bold text-primary-600">
                {health.machines?.online || 0}
              </span>
              <span className="text-sm text-gray-600">
                / {health.machines?.total || 0} online
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full"
                style={{
                  width: `${
                    health.machines?.total > 0
                      ? (health.machines.online / health.machines.total) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Agentek</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-2xl font-bold text-primary-600">
                {health.agents?.online || 0}
              </span>
              <span className="text-sm text-gray-600">
                / {health.agents?.total || 0} online
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full"
                style={{
                  width: `${
                    health.agents?.total > 0
                      ? (health.agents.online / health.agents.total) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Szerverek</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-2xl font-bold text-primary-600">
                {health.servers?.online || 0}
              </span>
              <span className="text-sm text-gray-600">
                / {health.servers?.total || 0} online
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full"
                style={{
                  width: `${
                    health.servers?.total > 0
                      ? (health.servers.online / health.servers.total) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Gyors linkek */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href={`/${locale}/admin/machines`}
          className="card hover:shadow-lg transition-shadow p-4"
        >
          <div className="font-semibold mb-1">Szerver Gépek</div>
          <div className="text-sm text-gray-600">Kezelés →</div>
        </Link>
        <Link
          href={`/${locale}/admin/agents`}
          className="card hover:shadow-lg transition-shadow p-4"
        >
          <div className="font-semibold mb-1">Agentek</div>
          <div className="text-sm text-gray-600">Kezelés →</div>
        </Link>
        <Link
          href={`/${locale}/admin/tasks`}
          className="card hover:shadow-lg transition-shadow p-4"
        >
          <div className="font-semibold mb-1">Feladatok</div>
          <div className="text-sm text-gray-600">
            {health.tasks?.pending || 0} várakozó
          </div>
        </Link>
        <Link
          href={`/${locale}/admin/monitoring`}
          className="card hover:shadow-lg transition-shadow p-4"
        >
          <div className="font-semibold mb-1">Monitoring</div>
          <div className="text-sm text-gray-600">Részletek →</div>
        </Link>
      </div>
    </div>
  );
}

