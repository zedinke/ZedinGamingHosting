'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Key, Calendar, AlertCircle, CheckCircle } from 'lucide-react';

interface LicenseInfoProps {
  locale: string;
}

interface LicenseData {
  isActive: boolean;
  licenseKey: string | null;
  startDate: string | null;
  endDate: string | null;
  planName: string | null;
  daysRemaining: number | null;
}

export function LicenseInfo({ locale }: LicenseInfoProps) {
  const [licenseData, setLicenseData] = useState<LicenseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // License információk lekérése
    // Jelenleg nincs SystemLicense modell, ezért a SaaSOrder-t használjuk
    // TODO: Ha lesz SystemLicense modell, akkor azt használjuk
    fetch('/api/admin/license/info')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLicenseData(data.license);
        }
      })
      .catch((error) => {
        console.error('License info error:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Card padding="lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  if (!licenseData) {
    return null; // Nincs license info
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  const getStatusColor = (daysRemaining: number | null) => {
    if (daysRemaining === null) return 'text-gray-600';
    if (daysRemaining < 0) return 'text-red-600';
    if (daysRemaining < 7) return 'text-red-600';
    if (daysRemaining < 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusIcon = (daysRemaining: number | null) => {
    if (daysRemaining === null) return null;
    if (daysRemaining < 0) return <AlertCircle className="w-5 h-5 text-red-600" />;
    if (daysRemaining < 7) return <AlertCircle className="w-5 h-5 text-red-600" />;
    if (daysRemaining < 30) return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    return <CheckCircle className="w-5 h-5 text-green-600" />;
  };

  return (
    <Card padding="lg" className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <Key className="w-6 h-6 text-primary-600" />
        <h2 className="text-xl font-bold text-gray-900">License Információk</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <p className="text-sm text-gray-600 mb-1">Csomag</p>
          <p className="font-semibold text-gray-900">{licenseData.planName || '-'}</p>
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-1">Státusz</p>
          <div className="flex items-center gap-2">
            {getStatusIcon(licenseData.daysRemaining)}
            <span
              className={`font-semibold ${getStatusColor(licenseData.daysRemaining)}`}
            >
              {licenseData.isActive ? 'Aktív' : 'Inaktív'}
            </span>
          </div>
        </div>

        {licenseData.startDate && (
          <div>
            <p className="text-sm text-gray-600 mb-1">Kezdés</p>
            <p className="font-semibold text-gray-900">{formatDate(licenseData.startDate)}</p>
          </div>
        )}

        {licenseData.endDate && (
          <div>
            <p className="text-sm text-gray-600 mb-1">Lejárat</p>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <p className="font-semibold text-gray-900">{formatDate(licenseData.endDate)}</p>
            </div>
          </div>
        )}

        {licenseData.daysRemaining !== null && (
          <div className="md:col-span-2">
            <p className="text-sm text-gray-600 mb-1">Hátralévő napok</p>
            <p
              className={`text-2xl font-bold ${getStatusColor(licenseData.daysRemaining)}`}
            >
              {licenseData.daysRemaining > 0
                ? `${licenseData.daysRemaining} nap`
                : licenseData.daysRemaining === 0
                ? 'Ma jár le'
                : `${Math.abs(licenseData.daysRemaining)} napja lejárt`}
            </p>
          </div>
        )}

        {licenseData.licenseKey && (
          <div className="md:col-span-2">
            <p className="text-sm text-gray-600 mb-1">License Key</p>
            <code className="block bg-gray-100 px-4 py-2 rounded font-mono text-sm">
              {licenseData.licenseKey}
            </code>
          </div>
        )}
      </div>
    </Card>
  );
}

