'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';

interface ResourceUpgradeSettings {
  pricePerVCpu: number;
  pricePerRamGB: number;
  currency: string;
}

export function ResourceUpgradeSettings() {
  const [settings, setSettings] = useState<ResourceUpgradeSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/resource-upgrade-settings');
      const data = await response.json();

      if (response.ok && data.settings) {
        setSettings(data.settings);
      } else {
        // Ha nincs beállítás, használjuk az alapértelmezett értékeket
        setSettings({
          pricePerVCpu: 0,
          pricePerRamGB: 0,
          currency: 'HUF',
        });
      }
    } catch (error) {
      toast.error('Hiba történt a beállítások betöltése során');
      setSettings({
        pricePerVCpu: 0,
        pricePerRamGB: 0,
        currency: 'HUF',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    // Validáció
    if (settings.pricePerVCpu < 0 || settings.pricePerRamGB < 0) {
      toast.error('Az árak nem lehetnek negatívak');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/resource-upgrade-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Bővítési árak sikeresen mentve');
      } else {
        toast.error(data.error || 'Hiba történt a mentés során');
      }
    } catch (error) {
      toast.error('Hiba történt a mentés során');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof ResourceUpgradeSettings, value: number | string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [field]: value,
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8 text-gray-700 font-medium">Betöltés...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8 text-gray-700 font-medium">Betöltés...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Erőforrás Bővítési Árak</h2>
        <p className="text-sm text-gray-700 mb-6 font-medium">
          Itt állíthatod be, hogy mennyibe kerüljön a vCPU és RAM bővítés rendeléskor.
          Ezek az árak havonta vonatkoznak a bővített erőforrásokra.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Ár vCPU számonként (havonta) *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={settings.pricePerVCpu}
                onChange={(e) => handleChange('pricePerVCpu', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white font-medium"
                min="0"
                step="0.01"
                required
              />
              <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                {settings.currency}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1 font-medium">
              Pl. ha 1000 HUF, akkor 1 vCPU bővítés 1000 HUF/hó
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Ár RAM GB-onként (havonta) *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={settings.pricePerRamGB}
                onChange={(e) => handleChange('pricePerRamGB', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white font-medium"
                min="0"
                step="0.01"
                required
              />
              <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                {settings.currency}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1 font-medium">
              Pl. ha 500 HUF, akkor 1 GB RAM bővítés 500 HUF/hó
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Pénznem *</label>
            <select
              value={settings.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white font-medium"
            >
              <option value="HUF">HUF - Magyar Forint</option>
              <option value="EUR">EUR - Euro</option>
              <option value="USD">USD - US Dollar</option>
            </select>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
          <p className="text-sm text-blue-900 font-semibold">
            <strong className="font-bold">Példa:</strong> Ha a vCPU ára 1000 HUF és a RAM ára 500 HUF/GB, akkor:
            <br />
            • 2 vCPU bővítés = 2 × 1000 = 2000 HUF/hó
            <br />
            • 4 GB RAM bővítés = 4 × 500 = 2000 HUF/hó
            <br />
            • Összesen: 4000 HUF/hó extra költség
          </p>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Mentés...' : 'Beállítások mentése'}
          </Button>
        </div>
      </div>
    </div>
  );
}

