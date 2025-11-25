'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: { status: 'ok' | 'error'; latency?: number };
    cache: { status: 'ok' | 'error'; size: number };
    performance: { status: 'ok' | 'warning' | 'error'; avgResponseTime: number; errorRate: number };
  };
  timestamp: string;
}

export function SystemHealthDashboard() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 30000); // 30 másodpercenként
    return () => clearInterval(interval);
  }, []);

  const loadHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/system/health');
      const data = await response.json();

      if (response.ok) {
        setHealth(data.health);
      }
    } catch (error) {
      toast.error('Hiba történt a health check betöltése során');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !health) {
    return <div className="text-center py-8 text-gray-500">Betöltés...</div>;
  }

  if (!health) {
    return <div className="text-center py-8 text-gray-500">Nincs adat</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'ok':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'degraded':
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'unhealthy':
      case 'error':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Rendszer Egészség</h3>
          <span
            className={`px-4 py-2 rounded-lg border font-semibold ${getStatusColor(
              health.status
            )}`}
          >
            {health.status === 'healthy'
              ? '✅ Egészséges'
              : health.status === 'degraded'
              ? '⚠️ Csökkent teljesítmény'
              : '❌ Nem egészséges'}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          Utolsó ellenőrzés: {new Date(health.timestamp).toLocaleString('hu-HU')}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className={`card border-2 ${getStatusColor(health.checks.database.status)}`}>
          <h4 className="font-semibold mb-2">Adatbázis</h4>
          <p className="text-2xl font-bold">
            {health.checks.database.status === 'ok' ? '✅ OK' : '❌ Hiba'}
          </p>
          {health.checks.database.latency && (
            <p className="text-sm text-gray-600 mt-2">
              Latencia: {health.checks.database.latency}ms
            </p>
          )}
        </div>

        <div className={`card border-2 ${getStatusColor(health.checks.cache.status)}`}>
          <h4 className="font-semibold mb-2">Cache</h4>
          <p className="text-2xl font-bold">
            {health.checks.cache.status === 'ok' ? '✅ OK' : '❌ Hiba'}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Méret: {health.checks.cache.size} bejegyzés
          </p>
        </div>

        <div className={`card border-2 ${getStatusColor(health.checks.performance.status)}`}>
          <h4 className="font-semibold mb-2">Teljesítmény</h4>
          <p className="text-2xl font-bold">
            {health.checks.performance.status === 'ok'
              ? '✅ OK'
              : health.checks.performance.status === 'warning'
              ? '⚠️ Figyelmeztetés'
              : '❌ Hiba'}
          </p>
          <div className="text-sm text-gray-600 mt-2 space-y-1">
            <p>Átlag: {health.checks.performance.avgResponseTime.toFixed(2)}ms</p>
            <p>Hibaarány: {(health.checks.performance.errorRate * 100).toFixed(2)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

