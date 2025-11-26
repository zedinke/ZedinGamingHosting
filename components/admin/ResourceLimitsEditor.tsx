'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface ResourceLimits {
  cpu: { max: number; min: number };
  ram: { max: number; min: number };
  disk: { max: number; min: number };
}

interface ResourceLimitsEditorProps {
  serverId: string;
}

export function ResourceLimitsEditor({ serverId }: ResourceLimitsEditorProps) {
  const [limits, setLimits] = useState<ResourceLimits>({
    cpu: { max: 100, min: 0 },
    ram: { max: 4096, min: 512 },
    disk: { max: 10240, min: 1024 },
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadLimits();
  }, []);

  const loadLimits = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/servers/${serverId}/resource-limits`);
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      setLimits(data.limits || limits);
    } catch (error) {
      toast.error('Hiba történt az erőforrás limitok betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/servers/${serverId}/resource-limits`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limits }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      toast.success('Erőforrás limitok sikeresen mentve');
    } catch (error) {
      toast.error('Hiba történt az erőforrás limitok mentése során');
    } finally {
      setSaving(false);
    }
  };

  const updateLimit = (resource: 'cpu' | 'ram' | 'disk', type: 'min' | 'max', value: number) => {
    setLimits((prev) => ({
      ...prev,
      [resource]: {
        ...prev[resource],
        [type]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8 text-gray-500">Betöltés...</div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Erőforrás Limitok</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {saving ? 'Mentés...' : 'Mentés'}
        </button>
      </div>

      <div className="space-y-6">
        {/* CPU Limitok */}
        <div>
          <h3 className="text-lg font-semibold mb-3">CPU Limitok</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum CPU (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={limits.cpu.min}
                onChange={(e) => updateLimit('cpu', 'min', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum CPU (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={limits.cpu.max}
                onChange={(e) => updateLimit('cpu', 'max', parseInt(e.target.value) || 100)}
                className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
              />
            </div>
          </div>
        </div>

        {/* RAM Limitok */}
        <div>
          <h3 className="text-lg font-semibold mb-3">RAM Limitok</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum RAM (MB)
              </label>
              <input
                type="number"
                min="256"
                value={limits.ram.min}
                onChange={(e) => updateLimit('ram', 'min', parseInt(e.target.value) || 256)}
                className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum RAM (MB)
              </label>
              <input
                type="number"
                min="512"
                value={limits.ram.max}
                onChange={(e) => updateLimit('ram', 'max', parseInt(e.target.value) || 512)}
                className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Minimum: {Math.round(limits.ram.min / 1024)} GB, Maximum: {Math.round(limits.ram.max / 1024)} GB
          </p>
        </div>

        {/* Disk Limitok */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Disk Limitok</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Disk (MB)
              </label>
              <input
                type="number"
                min="1024"
                value={limits.disk.min}
                onChange={(e) => updateLimit('disk', 'min', parseInt(e.target.value) || 1024)}
                className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Disk (MB)
              </label>
              <input
                type="number"
                min="2048"
                value={limits.disk.max}
                onChange={(e) => updateLimit('disk', 'max', parseInt(e.target.value) || 2048)}
                className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Minimum: {Math.round(limits.disk.min / 1024)} GB, Maximum: {Math.round(limits.disk.max / 1024)} GB
          </p>
        </div>
      </div>
    </div>
  );
}

