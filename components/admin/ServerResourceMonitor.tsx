'use client';

import { useState } from 'react';
import { useServerSentEvents } from '@/lib/use-server-sent-events';

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

  // Real-time erőforrás monitoring SSE stream
  const { data: streamData, connected } = useServerSentEvents({
    url: `/api/admin/servers/${serverId}/resources/stream`,
    enabled: true,
    onMessage: (data) => {
      if (data.type === 'resources') {
        setResourceUsage(data.data.resourceUsage);
      }
    },
  });

  if (!resourceUsage) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold mb-4">Erőforrás Használat</h3>
        <div className="text-center py-8 text-gray-500">
          Nincs elérhető erőforrás információ
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Erőforrás Használat</h3>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-xs text-gray-600">
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>
      <div className="space-y-4">
        {resourceUsage.cpu && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">CPU</span>
              <span className="text-sm text-gray-600">
                {resourceUsage.cpu.usage.toFixed(1)}% / {resourceUsage.cpu.cores} core
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
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
              <span className="text-sm font-medium">RAM</span>
              <span className="text-sm text-gray-600">
                {Math.round(resourceUsage.ram.used / 1024 / 1024 / 1024)} GB /{' '}
                {Math.round(resourceUsage.ram.total / 1024 / 1024 / 1024)} GB (
                {((resourceUsage.ram.used / resourceUsage.ram.total) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
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
              <span className="text-sm font-medium">Disk</span>
              <span className="text-sm text-gray-600">
                {Math.round(resourceUsage.disk.used / 1024 / 1024 / 1024)} GB /{' '}
                {Math.round(resourceUsage.disk.total / 1024 / 1024 / 1024)} GB (
                {((resourceUsage.disk.used / resourceUsage.disk.total) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
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

