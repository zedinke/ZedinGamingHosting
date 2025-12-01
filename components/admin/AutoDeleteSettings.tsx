'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Save, RefreshCw, AlertCircle, Clock } from 'lucide-react';

interface AutoDeleteSettings {
  enabled: boolean;
  deleteAfterDays: number;
  deleteAfterHours: number;
  deleteAfterMinutes: number;
  totalMinutes: number;
}

interface AutoDeleteSettingsProps {
  locale: string;
}

export function AutoDeleteSettings({ locale }: AutoDeleteSettingsProps) {
  const [settings, setSettings] = useState<AutoDeleteSettings>({
    enabled: false,
    deleteAfterDays: 0,
    deleteAfterHours: 0,
    deleteAfterMinutes: 0,
    totalMinutes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/system/auto-delete-settings');
      const data = await response.json();

      if (data.success && data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching auto delete settings:', error);
      toast.error('Hiba történt a beállítások betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (settings.enabled) {
      const totalMinutes =
        settings.deleteAfterDays * 24 * 60 +
        settings.deleteAfterHours * 60 +
        settings.deleteAfterMinutes;

      if (totalMinutes < 5) {
        toast.error('Az automatikus törlés minimum 5 perc lehet');
        return;
      }
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/system/auto-delete-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: settings.enabled,
          deleteAfterDays: settings.deleteAfterDays,
          deleteAfterHours: settings.deleteAfterHours,
          deleteAfterMinutes: settings.deleteAfterMinutes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt a beállítások mentése során');
        return;
      }

      if (data.success) {
        setSettings(data.settings);
        toast.success('Beállítások sikeresen mentve');
      }
    } catch (error) {
      console.error('Error saving auto delete settings:', error);
      toast.error('Hiba történt a beállítások mentése során');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (
      !confirm(
        'Biztosan manuálisan el szeretnéd indítani az automatikus törlést? Ez azonnal törölni fogja az összes nem fizetett szervert, amely meghaladja a beállított időt.'
      )
    ) {
      return;
    }

    setTesting(true);
    try {
      const response = await fetch('/api/admin/system/auto-delete/trigger', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt az automatikus törlés indítása során');
        return;
      }

      if (data.success) {
        toast.success(
          `Automatikus törlés sikeresen lefutott. ${data.deletedCount || 0} szerver törölve.`
        );
      }
    } catch (error) {
      console.error('Error triggering auto delete:', error);
      toast.error('Hiba történt az automatikus törlés indítása során');
    } finally {
      setTesting(false);
    }
  };

  const totalMinutes =
    settings.deleteAfterDays * 24 * 60 +
    settings.deleteAfterHours * 60 +
    settings.deleteAfterMinutes;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Beállítások betöltése...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Automatikus Szerver Törlés</h2>
          <p className="text-gray-700 text-sm">
            A nem fizetett szerverek automatikus törlése az admin által beállított idő után.
            Minimum 5 perc, ellenőrzés 5 percenként történik.
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
        </label>
      </div>

      {settings.enabled && (
        <>
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800 mb-1">
                  ⚠️ Figyelem: Az automatikus törlés aktív!
                </p>
                <p className="text-sm text-yellow-700">
                  A nem fizetett szerverek automatikusan törlődnek{' '}
                  {totalMinutes >= 1440
                    ? `${Math.floor(totalMinutes / 1440)} nap`
                    : totalMinutes >= 60
                    ? `${Math.floor(totalMinutes / 60)} óra`
                    : `${totalMinutes} perc`}{' '}
                  ({totalMinutes} perc) után.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Napok */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Napok
                </label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={settings.deleteAfterDays}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      deleteAfterDays: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0"
                />
              </div>

              {/* Órák */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Órák
                </label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={settings.deleteAfterHours}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      deleteAfterHours: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0"
                />
              </div>

              {/* Percek */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Percek
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={settings.deleteAfterMinutes}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      deleteAfterMinutes: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Összesített idő */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Összesített idő:</span>
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {totalMinutes >= 1440
                  ? `${Math.floor(totalMinutes / 1440)} nap ${Math.floor((totalMinutes % 1440) / 60)} óra ${totalMinutes % 60} perc`
                  : totalMinutes >= 60
                  ? `${Math.floor(totalMinutes / 60)} óra ${totalMinutes % 60} perc`
                  : `${totalMinutes} perc`}{' '}
                ({totalMinutes} perc összesen)
              </div>
            </div>

            {totalMinutes < 5 && settings.enabled && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  ⚠️ Az automatikus törlés minimum 5 perc lehet
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Információk */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800 mb-2">
          <strong>Hogyan működik?</strong>
        </p>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>A rendszer 5 percenként automatikusan ellenőrzi a nem fizetett szervereket</li>
          <li>Azok a szerverek törlődnek, amelyek nem fizettek és a beállított időt meghaladták</li>
          <li>Minden törlés előtt értesítést küldünk a felhasználónak emailben</li>
          <li>Az SFTP felhasználók is automatikusan törlődnek</li>
          <li>Az automatikus törlés csak akkor működik, ha be van kapcsolva</li>
        </ul>
      </div>

      {/* Gombok */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving || (settings.enabled && totalMinutes < 5)}
          className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Mentés...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Mentés</span>
            </>
          )}
        </button>

        {settings.enabled && (
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            title="Manuális automatikus törlés futtatása most"
          >
            {testing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Futtatás...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Most Futtat</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

