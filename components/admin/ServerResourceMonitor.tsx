'use client';

import { useState, useEffect } from 'react';

interface ResourceUsage {
  cpu?: {
    usage: number;
    cores: number;
  };
  ram?: {
    used: number;
    total: number;
  };
  disk?: {
    used: number;
    total: number;
  };
}

interface ServerResourceMonitorProps {
  serverId: string;
  initialResourceUsage?: ResourceUsage;
}

export function ServerResourceMonitor({
  serverId,
  initialResourceUsage,
}: ServerResourceMonitorProps) {
  const [resourceUsage, setResourceUsage] = useState<ResourceUsage | null>(
    initialResourceUsage || null
  );
  const [loading, setLoading] = useState(false);

  const loadResourceUsage = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/servers/${serverId}/resources`);
      const data = await response.json();

      if (!response.ok) {
        console.error('Hiba történt az erőforrás adatok betöltése során:', data.error);
        return;
      }

      setResourceUsage(data.resourceUsage);
    } catch (error) {
      console.error('Hiba történt az erőforrás adatok betöltése során:', error);
    } finally {
      setLoading(false);
    }
  };

  // Csak első betöltéskor töltjük be az adatokat, ha nincs initialResourceUsage
  useEffect(() => {
    if (!initialResourceUsage && !resourceUsage) {
      loadResourceUsage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId]);

  if (!resourceUsage) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Erőforrás Használat</h3>
        <div className="text-center py-8 text-gray-500">
          Nincs elérhető erőforrás információ
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">Erőforrás Használat</h3>
        <button
          onClick={loadResourceUsage}
          disabled={loading}
          className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-sm"
        >
          {loading ? 'Betöltés...' : 'Frissítés'}
        </button>
      </div>
      <div className="space-y-4">
        {resourceUsage.cpu && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-900">CPU</span>
              <span className="text-sm text-gray-700">
                {resourceUsage.cpu.usage.toFixed(1)}% / {resourceUsage.cpu.cores} core
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ease-out ${
                  resourceUsage.cpu.usage > 80
                    ? 'bg-red-600'
                    : resourceUsage.cpu.usage > 50
                    ? 'bg-yellow-600'
                    : 'bg-primary-600'
                }`}
                style={{ width: `${Math.min(resourceUsage.cpu.usage, 100)}%` }}
              />
            </div>
          </div>
        )}
        {resourceUsage.ram && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-900">RAM</span>
              <span className="text-sm text-gray-700">
                {Math.round(resourceUsage.ram.used / 1024 / 1024 / 1024)} GB /{' '}
                {Math.round(resourceUsage.ram.total / 1024 / 1024 / 1024)} GB (
                {((resourceUsage.ram.used / resourceUsage.ram.total) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ease-out ${
                  (resourceUsage.ram.used / resourceUsage.ram.total) * 100 > 80
                    ? 'bg-red-600'
                    : (resourceUsage.ram.used / resourceUsage.ram.total) * 100 > 50
                    ? 'bg-yellow-600'
                    : 'bg-primary-600'
                }`}
                style={{
                  width: `${(resourceUsage.ram.used / resourceUsage.ram.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
        {resourceUsage.disk && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-900">Disk</span>
              <span className="text-sm text-gray-700">
                {Math.round(resourceUsage.disk.used / 1024 / 1024 / 1024)} GB /{' '}
                {Math.round(resourceUsage.disk.total / 1024 / 1024 / 1024)} GB (
                {((resourceUsage.disk.used / resourceUsage.disk.total) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ease-out ${
                  (resourceUsage.disk.used / resourceUsage.disk.total) * 100 > 80
                    ? 'bg-red-600'
                    : (resourceUsage.disk.used / resourceUsage.disk.total) * 100 > 50
                    ? 'bg-yellow-600'
                    : 'bg-primary-600'
                }`}
                style={{
                  width: `${(resourceUsage.disk.used / resourceUsage.disk.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

