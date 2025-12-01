'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { differenceInDays } from 'date-fns';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface LicenseInfo {
  valid: boolean;
  expired: boolean;
  expiringSoon: boolean;
  remainingDays: number;
  license?: {
    id: string;
    licenseKey: string;
    licenseType: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    maxUsers: number | null;
    maxServers: number | null;
  };
  error?: string;
}

export function LicenseInfo() {
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLicenseInfo();
  }, []);

  const fetchLicenseInfo = async () => {
    try {
      const response = await fetch('/api/admin/license/info');
      const data = await response.json();
      setLicense(data);
    } catch (error) {
      console.error('License info fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <p>License információk betöltése...</p>
      </Card>
    );
  }

  if (!license || !license.license) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          <h2 className="text-xl font-bold text-gray-900">License nincs aktiválva</h2>
        </div>
        <p className="text-gray-600 mb-4">
          A rendszer használatához aktiválni kell a license-t.
        </p>
        <Button
          variant="primary"
          onClick={() => window.location.href = '/admin/license'}
        >
          License aktiválása
        </Button>
      </Card>
    );
  }

  const startDate = new Date(license.license.startDate);
  const endDate = new Date(license.license.endDate);
  const remainingDays = license.remainingDays;
  const isExpired = license.expired;
  const isExpiringSoon = license.expiringSoon;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">License információk</h2>
        {isExpired ? (
          <Badge variant="danger">Lejárt</Badge>
        ) : license.license.isActive ? (
          <Badge variant="success">Aktív</Badge>
        ) : (
          <Badge variant="warning">Inaktív</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">License Key</p>
          <p className="font-mono text-sm font-semibold">{license.license.licenseKey}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Típus</p>
          <p className="font-semibold">{license.license.licenseType}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Érvényesség</p>
          <p className="font-semibold">
            {startDate.toLocaleDateString('hu-HU')} - {endDate.toLocaleDateString('hu-HU')}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Hátralévő napok</p>
          <p className={`font-semibold ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-green-600'}`}>
            {isExpired ? 'Lejárt' : `${remainingDays} nap`}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Max Felhasználók</p>
          <p className="font-semibold">{license.license.maxUsers === null ? 'Korlátlan' : license.license.maxUsers}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Max Szerverek</p>
          <p className="font-semibold">{license.license.maxServers === null ? 'Korlátlan' : license.license.maxServers}</p>
        </div>
      </div>

      {isExpiringSoon && !isExpired && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              A license {remainingDays} nap múlva lejár. Kérjük, újítsa meg időben.
            </p>
          </div>
        </div>
      )}

      {isExpired && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800">
              A license lejárt. Kérjük, aktiváljon egy új license-t a rendszer használatához.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

