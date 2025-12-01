'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Download, RefreshCw, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';

interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion: string;
  updateChannel: 'stable' | 'beta' | 'alpha';
  changelog?: string;
  downloadUrl?: string;
  releaseDate?: Date;
  requiresLicense: boolean;
  licenseValid: boolean;
}

export function UpdateInfo() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    fetchUpdateInfo();
  }, []);

  const fetchUpdateInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/updates/check');
      const data = await response.json();
      setUpdateInfo(data);
    } catch (error) {
      console.error('Update info fetch error:', error);
      toast.error('Hiba történt a frissítések ellenőrzése során');
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async () => {
    if (!updateInfo?.downloadUrl) {
      toast.error('Nincs elérhető frissítés');
      return;
    }

    if (!confirm('Biztosan telepíteni szeretnéd a frissítést? A rendszer újraindulhat.')) {
      return;
    }

    setInstalling(true);
    try {
      const response = await fetch('/api/admin/updates/install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          downloadUrl: updateInfo.downloadUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Frissítés telepítés sikertelen');
        return;
      }

      toast.success('Frissítés telepítése elindítva!');
      fetchUpdateInfo();
    } catch (error) {
      console.error('Update installation error:', error);
      toast.error('Hiba történt a frissítés telepítése során');
    } finally {
      setInstalling(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <p>Frissítések ellenőrzése...</p>
      </Card>
    );
  }

  if (!updateInfo) {
    return (
      <Card>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          <p className="text-gray-600">Nem sikerült ellenőrizni a frissítéseket</p>
        </div>
      </Card>
    );
  }

  if (!updateInfo.licenseValid) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h2 className="text-xl font-bold text-gray-900">Frissítések nem elérhetők</h2>
        </div>
        <p className="text-gray-600 mb-4">
          A frissítések ellenőrzéséhez érvényes license szükséges.
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

  const isUpdateAvailable = updateInfo.available && 
    updateInfo.currentVersion !== updateInfo.latestVersion;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Frissítések</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchUpdateInfo}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Ellenőrzés
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Jelenlegi verzió</p>
            <p className="font-semibold text-gray-900">{updateInfo.currentVersion}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Legújabb verzió</p>
            <p className="font-semibold text-gray-900">{updateInfo.latestVersion}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Frissítési csatorna</p>
            <Badge variant="info">{updateInfo.updateChannel}</Badge>
          </div>
        </div>

        {isUpdateAvailable ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-900">Új frissítés elérhető!</h3>
            </div>
            {updateInfo.releaseDate && (
              <p className="text-sm text-green-800 mb-2">
                Kiadás dátuma: {new Date(updateInfo.releaseDate).toLocaleDateString('hu-HU')}
              </p>
            )}
            {updateInfo.changelog && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-green-900 mb-2">Változások:</p>
                <div className="text-sm text-green-800 whitespace-pre-line">
                  {updateInfo.changelog}
                </div>
              </div>
            )}
            <Button
              variant="primary"
              onClick={handleInstall}
              isLoading={installing}
              disabled={installing}
            >
              <Download className="w-4 h-4 mr-2" />
              Frissítés telepítése
            </Button>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-blue-800">
                A rendszer naprakész. Nincs elérhető frissítés.
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

