'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface ServerMetricsProps {
  serverId: string;
  period?: number;
  interval?: number;
}

export function ServerMetrics({
  serverId,
  period = 24,
  interval = 1,
}: ServerMetricsProps) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'cpu' | 'ram' | 'disk' | 'network' | 'players'>('cpu');

  useEffect(() => {
    loadMetrics();
  }, [serverId, period, interval]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/servers/${serverId}/metrics?period=${period}&interval=${interval}`
      );
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      setMetrics(data.metrics);
    } catch (error) {
      toast.error('Hiba történt a metrikák betöltése során');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !metrics) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8 text-gray-500">Betöltés...</div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const getMetricData = () => {
    switch (selectedMetric) {
      case 'cpu':
        return metrics.cpu;
      case 'ram':
        return metrics.ram;
      case 'disk':
        return metrics.disk;
      case 'network':
        return metrics.network;
      case 'players':
        return metrics.players;
      default:
        return [];
    }
  };

  const getMetricLabel = () => {
    switch (selectedMetric) {
      case 'cpu':
        return 'CPU Használat (%)';
      case 'ram':
        return 'RAM Használat (GB)';
      case 'disk':
        return 'Disk Használat (GB)';
      case 'network':
        return 'Hálózat (MB)';
      case 'players':
        return 'Játékosok';
      default:
        return '';
    }
  };

  const getMaxValue = () => {
    const data = getMetricData();
    if (selectedMetric === 'network') {
      return Math.max(...data.map((d: any) => Math.max(d.in || 0, d.out || 0)));
    }
    if (selectedMetric === 'players') {
      return Math.max(...data.map((d: any) => d.max || 0));
    }
    return Math.max(...data.map((d: any) => d.value || 0));
  };

  const data = getMetricData();
  const maxValue = getMaxValue();

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Teljesítmény Metrikák</h2>
        <button
          onClick={loadMetrics}
          disabled={loading}
          className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-sm"
        >
          {loading ? 'Betöltés...' : 'Frissítés'}
        </button>
      </div>

      {/* Metrika választó */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(['cpu', 'ram', 'disk', 'network', 'players'] as const).map((metric) => (
          <button
            key={metric}
            onClick={() => setSelectedMetric(metric)}
            className={`px-4 py-2 rounded-lg text-sm ${
              selectedMetric === metric
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {metric.charAt(0).toUpperCase() + metric.slice(1)}
          </button>
        ))}
      </div>

      {/* Grafikon */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-4">{getMetricLabel()}</h3>
        <div className="space-y-2">
          {data.map((point: any, index: number) => {
            const percentage = maxValue > 0 ? ((point.value || point.online || point.in || 0) / maxValue) * 100 : 0;
            const time = new Date(point.timestamp).toLocaleTimeString('hu-HU', {
              hour: '2-digit',
              minute: '2-digit',
            });

            if (selectedMetric === 'network') {
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-20 text-xs text-gray-600">{time}</div>
                  <div className="flex-1 flex gap-1">
                    <div
                      className="bg-blue-500 h-4 rounded"
                      style={{ width: `${((point.in || 0) / maxValue) * 100}%` }}
                      title={`In: ${(point.in || 0).toFixed(2)} MB`}
                    />
                    <div
                      className="bg-green-500 h-4 rounded"
                      style={{ width: `${((point.out || 0) / maxValue) * 100}%` }}
                      title={`Out: ${(point.out || 0).toFixed(2)} MB`}
                    />
                  </div>
                  <div className="text-xs text-gray-600 w-24 text-right">
                    {(point.in || 0).toFixed(1)} / {(point.out || 0).toFixed(1)} MB
                  </div>
                </div>
              );
            }

            if (selectedMetric === 'players') {
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-20 text-xs text-gray-600">{time}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                    <div
                      className="bg-primary-600 h-4 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${percentage}%` }}
                    >
                      <span className="text-xs text-white font-medium">{point.online}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 w-16 text-right">
                    {point.online} / {point.max}
                  </div>
                </div>
              );
            }

            return (
              <div key={index} className="flex items-center gap-3">
                <div className="w-20 text-xs text-gray-600">{time}</div>
                <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                  <div
                    className={`h-4 rounded-full ${
                      percentage > 80 ? 'bg-red-500' : percentage > 50 ? 'bg-yellow-500' : 'bg-primary-600'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="text-xs text-gray-600 w-16 text-right">
                  {selectedMetric === 'cpu'
                    ? `${(point.value || 0).toFixed(1)}%`
                    : `${(point.value || 0).toFixed(1)} ${selectedMetric === 'ram' || selectedMetric === 'disk' ? 'GB' : ''}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

