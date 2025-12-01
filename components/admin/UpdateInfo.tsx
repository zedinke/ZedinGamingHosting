'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Download, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface UpdateInfoProps {
  locale?: string;
}

export function UpdateInfo({ locale = 'hu' }: UpdateInfoProps) {
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetch('/api/admin/system/update/status')
      .then((res) => res.json())
      .then((data) => {
        setUpdateInfo(data);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/admin/system/update', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        // Reload page after update
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error('Update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  if (!updateInfo) {
    return null;
  }

  const hasUpdate = updateInfo.hasUpdate || false;
  const currentVersion = updateInfo.currentVersion || 'Ismeretlen';
  const latestVersion = updateInfo.latestVersion || 'Ismeretlen';

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Rendszer frissítés</h2>
        {hasUpdate ? (
          <AlertCircle className="w-5 h-5 text-yellow-600" />
        ) : (
          <CheckCircle className="w-5 h-5 text-green-600" />
        )}
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Jelenlegi verzió</p>
          <p className="font-semibold text-gray-900">{currentVersion}</p>
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-1">Legújabb verzió</p>
          <p className="font-semibold text-gray-900">{latestVersion}</p>
        </div>

        {hasUpdate && (
          <div className="pt-4 border-t">
            <Button
              onClick={handleUpdate}
              variant="primary"
              isLoading={isUpdating}
              disabled={isUpdating}
            >
              <Download className="w-4 h-4 mr-2" />
              Frissítés telepítése
            </Button>
          </div>
        )}

        {!hasUpdate && (
          <div className="pt-4 border-t">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Frissítés ellenőrzése
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

