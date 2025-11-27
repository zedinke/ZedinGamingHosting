'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';

interface InvoiceSettings {
  companyName: string;
  companyTaxNumber: string;
  companyVatNumber: string;
  companyAddress: string;
  companyCity: string;
  companyZipCode: string;
  companyCountry: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  bankName: string;
  bankAccountNumber: string;
  bankSwift: string;
  invoicePrefix: string;
  invoiceNumberFormat: string;
  defaultVatRate: number;
  defaultCurrency: string;
  invoiceFooter: string;
  invoiceTerms: string;
}

export function InvoiceSettings() {
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/invoice-settings');
      const data = await response.json();

      if (response.ok && data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      toast.error('Hiba történt a beállítások betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/invoice-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Számla beállítások sikeresen mentve');
      } else {
        toast.error(data.error || 'Hiba történt a mentés során');
      }
    } catch (error) {
      toast.error('Hiba történt a mentés során');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof InvoiceSettings, value: string | number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [field]: value,
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-700 font-medium">Betöltés...</div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-700 mb-4 font-medium">Nincs beállítás</p>
        <Button onClick={() => setSettings(getDefaultSettings())}>
          Alapértelmezett beállítások létrehozása
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Céginformációk</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">Cégnév *</label>
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white font-medium"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">Adószám *</label>
            <input
              type="text"
              value={settings.companyTaxNumber}
              onChange={(e) => handleChange('companyTaxNumber', e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white font-medium"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">ÁFA szám *</label>
            <input
              type="text"
              value={settings.companyVatNumber}
              onChange={(e) => handleChange('companyVatNumber', e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white font-medium"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">Cím *</label>
            <input
              type="text"
              value={settings.companyAddress}
              onChange={(e) => handleChange('companyAddress', e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white font-medium"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">Város *</label>
            <input
              type="text"
              value={settings.companyCity}
              onChange={(e) => handleChange('companyCity', e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white font-medium"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">Irányítószám *</label>
            <input
              type="text"
              value={settings.companyZipCode}
              onChange={(e) => handleChange('companyZipCode', e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white font-medium"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">Ország</label>
            <input
              type="text"
              value={settings.companyCountry}
              onChange={(e) => handleChange('companyCountry', e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">Telefon</label>
            <input
              type="text"
              value={settings.companyPhone}
              onChange={(e) => handleChange('companyPhone', e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">Email *</label>
            <input
              type="email"
              value={settings.companyEmail}
              onChange={(e) => handleChange('companyEmail', e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white font-medium"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">Weboldal</label>
            <input
              type="url"
              value={settings.companyWebsite}
              onChange={(e) => handleChange('companyWebsite', e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white font-medium"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Bank információk</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">Bank neve *</label>
            <input
              type="text"
              value={settings.bankName}
              onChange={(e) => handleChange('bankName', e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white font-medium"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">Számlaszám (IBAN) *</label>
            <input
              type="text"
              value={settings.bankAccountNumber}
              onChange={(e) => handleChange('bankAccountNumber', e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white font-medium"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">SWIFT/BIC kód</label>
            <input
              type="text"
              value={settings.bankSwift}
              onChange={(e) => handleChange('bankSwift', e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white font-medium"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Számlázási beállítások</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">Számla előtag</label>
            <input
              type="text"
              value={settings.invoicePrefix}
              onChange={(e) => handleChange('invoicePrefix', e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">Számla szám formátum</label>
            <input
              type="text"
              value={settings.invoiceNumberFormat}
              onChange={(e) => handleChange('invoiceNumberFormat', e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white font-medium"
              placeholder="YYYYMMDD-XXXX"
            />
            <p className="text-xs text-gray-600 mt-1 font-medium">
              YYYY=év, MM=hónap, DD=nap, XXXX=sorszám
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">Alapértelmezett ÁFA kulcs (%)</label>
            <input
              type="number"
              value={settings.defaultVatRate}
              onChange={(e) => handleChange('defaultVatRate', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white font-medium"
              min="0"
              max="100"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">Alapértelmezett pénznem</label>
            <select
              value={settings.defaultCurrency}
              onChange={(e) => handleChange('defaultCurrency', e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white font-medium"
            >
              <option value="HUF">HUF - Magyar Forint</option>
              <option value="EUR">EUR - Euro</option>
              <option value="USD">USD - US Dollar</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Egyéb beállítások</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">Számla lábléc</label>
            <textarea
              value={settings.invoiceFooter}
              onChange={(e) => handleChange('invoiceFooter', e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white font-medium"
              rows={3}
              placeholder="Pl. Köszönjük vásárlását!"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">Fizetési feltételek</label>
            <textarea
              value={settings.invoiceTerms}
              onChange={(e) => handleChange('invoiceTerms', e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white font-medium"
              rows={2}
              placeholder="Pl. Fizetési határidő: 8 nap"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Mentés...' : 'Beállítások mentése'}
        </Button>
      </div>
    </div>
  );
}

function getDefaultSettings(): InvoiceSettings {
  return {
    companyName: '',
    companyTaxNumber: '',
    companyVatNumber: '',
    companyAddress: '',
    companyCity: '',
    companyZipCode: '',
    companyCountry: 'Magyarország',
    companyPhone: '',
    companyEmail: '',
    companyWebsite: '',
    bankName: '',
    bankAccountNumber: '',
    bankSwift: '',
    invoicePrefix: 'INV',
    invoiceNumberFormat: 'YYYYMMDD-XXXX',
    defaultVatRate: 27,
    defaultCurrency: 'HUF',
    invoiceFooter: '',
    invoiceTerms: 'Fizetési határidő: 8 nap',
  };
}

