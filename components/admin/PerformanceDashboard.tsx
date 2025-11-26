'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface PerformanceMetrics {
  averageResponseTime: number;
  errorRate: number;
  slowestEndpoints: Array<{
    endpoint: string;
    method: string;
    avgDuration: number;
  }>;
}

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // 30 másodpercenként
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/system/performance');
      const data = await response.json();

      if (response.ok) {
        setMetrics(data.metrics);
      }
    } catch (error) {
      toast.error('Hiba történt a metrikák betöltése során');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !metrics) {
    return <div className="text-center py-8 text-gray-500">Betöltés...</div>;
  }

  if (!metrics) {
    return <div className="text-center py-8 text-gray-500">Nincs adat</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Átlagos Válaszidő</h3>
          <p className="text-3xl font-bold text-primary-600">
            {metrics.averageResponseTime.toFixed(2)}ms
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Hibaarány</h3>
          <p className="text-3xl font-bold text-red-600">
            {(metrics.errorRate * 100).toFixed(2)}%
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Lassú Endpointok</h3>
          <p className="text-3xl font-bold text-orange-600">
            {metrics.slowestEndpoints.length}
          </p>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-bold mb-4">Leglassabb Endpointok</h3>
        {metrics.slowestEndpoints.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Nincs adat</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Endpoint</th>
                  <th className="text-left py-2 px-4">Method</th>
                  <th className="text-right py-2 px-4">Átlagos Idő (ms)</th>
                </tr>
              </thead>
              <tbody>
                {metrics.slowestEndpoints.map((endpoint, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4 font-mono text-sm">{endpoint.endpoint}</td>
                    <td className="py-2 px-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {endpoint.method}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-right">
                      <span
                        className={
                          endpoint.avgDuration > 1000
                            ? 'text-red-600 font-semibold'
                            : endpoint.avgDuration > 500
                            ? 'text-orange-600'
                            : 'text-gray-600'
                        }
                      >
                        {endpoint.avgDuration.toFixed(2)}ms
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

