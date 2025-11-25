'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { UpdateProgress } from './UpdateProgress';

interface SystemManagementProps {
  maintenanceMode: boolean;
  lastUpdate: string | null;
  locale: string;
}

export function SystemManagement({
  maintenanceMode: initialMaintenanceMode,
  lastUpdate,
  locale,
}: SystemManagementProps) {
  const [maintenanceMode, setMaintenanceMode] = useState(initialMaintenanceMode);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<any>(null);

  const handleMaintenanceToggle = async () => {
    try {
      const response = await fetch(`/api/admin/system/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: !maintenanceMode,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Hiba történt');
        return;
      }

      setMaintenanceMode(!maintenanceMode);
      toast.success(
        !maintenanceMode
          ? 'Karbantartási mód bekapcsolva'
          : 'Karbantartási mód kikapcsolva'
      );
    } catch (error) {
      toast.error('Hiba történt');
    }
  };

  const handleSystemUpdate = async () => {
    if (
      !confirm(
        'Biztosan frissíteni szeretnéd a rendszert? Ez néhány percig eltarthat.'
      )
    ) {
      return;
    }

    setIsUpdating(true);
    setUpdateProgress({
      status: 'starting',
      message: 'Frissítés indítása...',
      progress: 0,
    });

    try {
      // WebSocket vagy polling használata a progress követéséhez
      const response = await fetch(`/api/admin/system/update`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Frissítési hiba');
      }

      // Polling a progress követéséhez
      const checkProgress = async () => {
        try {
          const progressResponse = await fetch(`/api/admin/system/update/status`);
          const progress = await progressResponse.json();

          setUpdateProgress(progress);

          if (progress.status === 'completed' || progress.status === 'error') {
            setIsUpdating(false);
            if (progress.status === 'completed') {
              toast.success('Rendszer sikeresen frissítve!');
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            } else {
              toast.error(progress.error || 'Frissítési hiba');
            }
          } else {
            // Folytatjuk a polling-ot
            setTimeout(checkProgress, 1000);
          }
        } catch (error) {
          setIsUpdating(false);
          toast.error('Hiba történt a frissítés követése során');
        }
      };

      // Elindítjuk a progress követést
      setTimeout(checkProgress, 500);
    } catch (error: any) {
      setIsUpdating(false);
      setUpdateProgress(null);
      toast.error(error.message || 'Hiba történt a frissítés során');
    }
  };

  return (
    <div className="space-y-6">
      {/* Karbantartási mód */}
      <div className="card">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold mb-2">Karbantartási Mód</h2>
            <p className="text-gray-600 text-sm">
              Ha be van kapcsolva, csak az adminok férhetnek hozzá az oldalhoz.
              A felhasználók egy karbantartási üzenetet látnak.
            </p>
            {maintenanceMode && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  ⚠️ A karbantartási mód jelenleg aktív
                </p>
              </div>
            )}
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={handleMaintenanceToggle}
              className="sr-only peer"
              disabled={isUpdating}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
      </div>

      {/* Rendszer frissítés */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Rendszer Frissítés</h2>
        <div className="space-y-4">
          {lastUpdate && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Utolsó frissítés:{' '}
                <span className="font-medium">
                  {new Date(lastUpdate).toLocaleString('hu-HU')}
                </span>
              </p>
            </div>
          )}

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">
              <strong>Mit csinál a frissítés?</strong>
            </p>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Letölti a legújabb változásokat a Git repository-ból</li>
              <li>Telepíti az új függőségeket</li>
              <li>Frissíti az adatbázis struktúrát (adatvesztés nélkül)</li>
              <li>Újra buildeli a Docker konténereket</li>
              <li>Újraindítja a szolgáltatásokat</li>
            </ul>
          </div>

          {isUpdating && updateProgress ? (
            <UpdateProgress progress={updateProgress} />
          ) : (
            <button
              onClick={handleSystemUpdate}
              disabled={isUpdating || maintenanceMode}
              className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isUpdating ? 'Frissítés folyamatban...' : 'Rendszer Frissítése'}
            </button>
          )}

          {maintenanceMode && (
            <p className="text-sm text-gray-600 text-center">
              Kérjük, kapcsold ki a karbantartási módot a frissítés előtt
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

