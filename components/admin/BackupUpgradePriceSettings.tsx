'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Save, DollarSign } from 'lucide-react';

interface BackupUpgradePriceSettingsProps {
  locale: string;
}

export function BackupUpgradePriceSettings({
  locale,
}: BackupUpgradePriceSettingsProps) {
  const [price, setPrice] = useState<number>(5000);
  const [currency, setCurrency] = useState<string>('HUF');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPrice();
  }, []);

  const fetchPrice = async () => {
    try {
      const response = await fetch('/api/admin/system/backup-upgrade-price');
      const data = await response.json();

      if (data.success) {
        setPrice(data.price || 5000);
        setCurrency(data.currency || 'HUF');
      }
    } catch (error) {
      console.error('Error fetching backup upgrade price:', error);
      toast.error('Hiba történt az ár betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (price < 0) {
      toast.error('Az ár nem lehet negatív');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/system/backup-upgrade-price', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price,
          currency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt az ár mentése során');
        return;
      }

      toast.success('Backup bővítés ára sikeresen mentve');
    } catch (error) {
      console.error('Error saving backup upgrade price:', error);
      toast.error('Hiba történt az ár mentése során');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Betöltés...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 mb-6">
        <div className="p-3 bg-blue-100 rounded-lg">
          <DollarSign className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Backup Bővítés Ára
          </h2>
          <p className="text-gray-700 text-sm">
            Állítsd be az árat a backup bővítéshez (+1 backup +1GB tárhely).
            Ez az ár jelenik meg a felhasználók számára, amikor bővítést szeretnének vásárolni.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ár
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="5000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pénznem
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="HUF">HUF (Forint)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="USD">USD (Dollár)</option>
              <option value="GBP">GBP (Font)</option>
            </select>
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 mb-2">
            <strong>Bővítés tartalma:</strong>
          </p>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>+1 backup mentés</li>
            <li>+1 GB tárhely</li>
          </ul>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Bővítés ára:</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {new Intl.NumberFormat('hu-HU', {
                  style: 'currency',
                  currency: currency,
                }).format(price)}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || price < 0}
          className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
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
      </div>
    </div>
  );
}

