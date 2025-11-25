'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { AuditAction } from '@/lib/audit-log';

interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface AuditLogsViewerProps {
  locale: string;
  initialUserId?: string;
  initialAction?: string;
  initialResourceType?: string;
  initialPage?: number;
}

export function AuditLogsViewer({
  locale,
  initialUserId,
  initialAction,
  initialResourceType,
  initialPage = 1,
}: AuditLogsViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    userId: initialUserId || '',
    action: initialAction || '',
    resourceType: initialResourceType || '',
    page: initialPage,
  });

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.userId) params.set('userId', filters.userId);
      if (filters.action) params.set('action', filters.action);
      if (filters.resourceType) params.set('resourceType', filters.resourceType);
      params.set('limit', '50');
      params.set('offset', String((filters.page - 1) * 50));

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      setLogs(data.logs || []);
    } catch (error) {
      toast.error('Hiba történt az audit logok betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-800';
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-800';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800';
    if (action.includes('LOGIN')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Szűrők */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Szűrők</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Felhasználó ID
            </label>
            <input
              type="text"
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Felhasználó ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Művelet
            </label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Összes</option>
              {Object.values(AuditAction).map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Erőforrás Típus
            </label>
            <input
              type="text"
              value={filters.resourceType}
              onChange={(e) => setFilters({ ...filters, resourceType: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="User, Server, etc."
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={loadLogs}
              disabled={loading}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Betöltés...' : 'Frissítés'}
            </button>
          </div>
        </div>
      </div>

      {/* Audit logok táblázata */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">Időpont</th>
              <th className="text-left p-3">Felhasználó</th>
              <th className="text-left p-3">Művelet</th>
              <th className="text-left p-3">Erőforrás</th>
              <th className="text-left p-3">IP Cím</th>
              <th className="text-left p-3">Részletek</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  {loading ? 'Betöltés...' : 'Nincs audit log'}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-sm">
                    {new Date(log.createdAt).toLocaleString('hu-HU')}
                  </td>
                  <td className="p-3">
                    {log.user ? (
                      <div>
                        <div className="font-medium">{log.user.name || log.user.email}</div>
                        <div className="text-xs text-gray-500">{log.user.email}</div>
                      </div>
                    ) : (
                      <span className="text-gray-500">System</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${getActionColor(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="text-sm">
                      <div className="font-medium">{log.resourceType}</div>
                      {log.resourceId && (
                        <div className="text-xs text-gray-500">{log.resourceId}</div>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-sm text-gray-600">{log.ipAddress || '-'}</td>
                  <td className="p-3">
                    {log.details && Object.keys(log.details).length > 0 ? (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-primary-600 hover:underline">
                          Részletek
                        </summary>
                        <pre className="mt-2 bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagináció */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
          disabled={filters.page === 1 || loading}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Előző
        </button>
        <span className="px-4 py-2">Oldal {filters.page}</span>
        <button
          onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
          disabled={logs.length < 50 || loading}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Következő
        </button>
      </div>
    </div>
  );
}

