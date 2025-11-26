'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface ServerConfigEditorProps {
  serverId: string;
  gameType: string;
  maxPlayers: number;
  initialConfig?: any;
}

export function ServerConfigEditor({
  serverId,
  gameType,
  maxPlayers,
  initialConfig,
}: ServerConfigEditorProps) {
  const [config, setConfig] = useState<any>(initialConfig || {});
  const [defaults, setDefaults] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/servers/${serverId}/config`);
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      setConfig(data.config || {});
      setDefaults(data.defaults || {});
    } catch (error) {
      toast.error('Hiba történt a konfiguráció betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/servers/${serverId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configuration: config }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      toast.success('Konfiguráció sikeresen mentve');
    } catch (error) {
      toast.error('Hiba történt a konfiguráció mentése során');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Biztosan visszaállítod az alapértelmezett konfigurációt?')) {
      setConfig(defaults);
    }
  };

  const updateConfig = (key: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [key]: value,
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
        <h2 className="text-xl font-bold">Szerver Konfiguráció</h2>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm"
          >
            Alapértelmezett
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {saving ? 'Mentés...' : 'Mentés'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(defaults).map(([key, defaultValue]) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {key}
            </label>
            {typeof defaultValue === 'boolean' ? (
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config[key] ?? defaultValue}
                  onChange={(e) => updateConfig(key, e.target.checked)}
                  className="rounded"
                />
                <span className="ml-2 text-sm text-gray-600">
                  {config[key] ?? defaultValue ? 'Igen' : 'Nem'}
                </span>
              </label>
            ) : typeof defaultValue === 'number' ? (
              <input
                type="number"
                value={config[key] ?? defaultValue}
                onChange={(e) => updateConfig(key, parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            ) : (
              <input
                type="text"
                value={config[key] ?? defaultValue}
                onChange={(e) => updateConfig(key, e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            )}
          </div>
        ))}

        {Object.keys(defaults).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nincs elérhető konfiguráció ehhez a játék típushoz
          </div>
        )}
      </div>

      {/* JSON szerkesztő (haladó) */}
      <div className="mt-6 pt-6 border-t">
        <details>
          <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
            Haladó: JSON szerkesztő
          </summary>
          <textarea
            value={JSON.stringify(config, null, 2)}
            onChange={(e) => {
              try {
                setConfig(JSON.parse(e.target.value));
              } catch (error) {
                // Invalid JSON, ignore
              }
            }}
            className="w-full h-64 px-3 py-2 border rounded-lg font-mono text-sm"
            placeholder="JSON konfiguráció..."
          />
        </details>
      </div>
    </div>
  );
}

