'use client';

import { useState, useRef, useEffect } from 'react';
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
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time erőforrás monitoring SSE stream
  const { data: streamData, connected } = useServerSentEvents({
    url: `/api/admin/servers/${serverId}/resources/stream`,
    enabled: true,
    onMessage: (data) => {
      if (data.type === 'resources') {
        // Debounce: csak 500ms után frissítjük, hogy ne ugráljon
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
        updateTimeoutRef.current = setTimeout(() => {
          setResourceUsage(data.data.resourceUsage);
        }, 500);
      }
    },
  });

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

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

