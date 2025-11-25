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
  const [updateCheck, setUpdateCheck] = useState<{
    hasUpdate: boolean;
    checking: boolean;
    commitInfo: any;
  } | null>(null);

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

  const handleCheckForUpdates = async () => {
    setUpdateCheck({ hasUpdate: false, checking: true, commitInfo: null });
    try {
      const response = await fetch('/api/admin/system/update/check');
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || 'Hiba történt a frissítés ellenőrzése során');
        setUpdateCheck({ hasUpdate: false, checking: false, commitInfo: null });
        return;
      }

      setUpdateCheck({
        hasUpdate: data.hasUpdate,
        checking: false,
        commitInfo: data.commitInfo,
      });

      if (data.hasUpdate) {
        toast.success(`Van új frissítés! (${data.commitInfo?.count || 0} új commit)`);
      } else {
        toast.success('A rendszer naprakész, nincs új frissítés.');
      }
    } catch (error) {
      toast.error('Hiba történt a frissítés ellenőrzése során');
      setUpdateCheck({ hasUpdate: false, checking: false, commitInfo: null });
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
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Frissítési hiba');
      }

      toast.success('Frissítés elindítva, követés...');

      // Polling a progress követéséhez
      let pollCount = 0;
      const maxPolls = 600; // 10 perc maximum (600 * 1 másodperc)
      
      const checkProgress = async () => {
        pollCount++;
        
        if (pollCount > maxPolls) {
          setIsUpdating(false);
          setUpdateProgress(null);
          toast.error('A frissítés túl sokáig tart, ellenőrizd a logokat');
          return;
        }

        try {
          const progressResponse = await fetch(`/api/admin/system/update/status`, {
            cache: 'no-store',
          });
          
          if (!progressResponse.ok) {
            // Ha a fájl nem létezik, lehet hogy még nem indult el
            if (pollCount < 5) {
              setTimeout(checkProgress, 2000);
              return;
            }
            throw new Error('Nem sikerült lekérni a frissítés állapotát');
          }
          
          const progress = await progressResponse.json();

          // Mindig frissítjük a progress-t, még akkor is, ha idle
          setUpdateProgress(progress);

          if (progress.status === 'completed' || progress.status === 'error') {
            setIsUpdating(false);
            if (progress.status === 'completed') {
              toast.success('Rendszer sikeresen frissítve!');
              setUpdateCheck(null); // Reset update check
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            } else {
              toast.error(progress.error || 'Frissítési hiba');
            }
            return; // Ne folytassuk a polling-ot
          } else if (progress.status === 'starting' || progress.status === 'in_progress') {
            // Folytatjuk a polling-ot
            setTimeout(checkProgress, 1000);
          } else if (progress.status === 'idle') {
            // Ha idle, lehet hogy még nem indult el, várunk egy kicsit
            if (pollCount < 20) {
              // Növeljük a várakozást 20-ra, hogy legyen idő a fájl létrehozására
              setTimeout(checkProgress, 2000);
            } else {
              setIsUpdating(false);
              setUpdateProgress(null);
              toast.error('A frissítés nem indult el. Ellenőrizd a konzolt és a szerver logokat.');
            }
          } else {
            // Más állapot, újra próbáljuk
            setTimeout(checkProgress, 2000);
          }
        } catch (error: any) {
          console.error('Progress check error:', error);
          // Folytatjuk a polling-ot, lehet hogy csak átmeneti hiba
          if (pollCount < maxPolls) {
            setTimeout(checkProgress, 2000);
          } else {
            setIsUpdating(false);
            setUpdateProgress(null);
            toast.error('Hiba történt a frissítés követése során: ' + (error.message || 'Ismeretlen hiba'));
          }
        }
      };

      // Elindítjuk a progress követést
      setTimeout(checkProgress, 1000);
    } catch (error: any) {
      setIsUpdating(false);
      setUpdateProgress(null);
      toast.error(error.message || 'Hiba történt a frissítés során');
      console.error('Update start error:', error);
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

          {/* Frissítés ellenőrzés */}
          <div className="flex gap-3">
            <button
              onClick={handleCheckForUpdates}
              disabled={updateCheck?.checking || isUpdating}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
            >
              {updateCheck?.checking ? 'Ellenőrzés...' : 'Frissítések Ellenőrzése'}
            </button>
          </div>

          {/* Frissítés információ */}
          {updateCheck && !updateCheck.checking && (
            <div className={`p-4 rounded-lg border ${
              updateCheck.hasUpdate 
                ? 'bg-green-50 border-green-200' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              {updateCheck.hasUpdate ? (
                <div>
                  <p className="text-sm font-semibold text-green-800 mb-2">
                    ✅ Van új frissítés!
                  </p>
                  {updateCheck.commitInfo && (
                    <div className="text-xs text-green-700">
                      <p className="mb-1">
                        <strong>{updateCheck.commitInfo.count}</strong> új commit érhető el
                      </p>
                      {updateCheck.commitInfo.commits && updateCheck.commitInfo.commits.length > 0 && (
                        <ul className="list-disc list-inside space-y-1 mt-2">
                          {updateCheck.commitInfo.commits.slice(0, 5).map((commit: string, idx: number) => (
                            <li key={idx} className="font-mono text-xs">
                              {commit.substring(0, 60)}...
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-blue-800">
                  ℹ️ A rendszer naprakész, nincs új frissítés.
                </p>
              )}
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
            <div className="space-y-4">
              <UpdateProgress progress={updateProgress} />
              {(updateProgress.status === 'error' || updateProgress.status === 'in_progress') && (
                <button
                  onClick={async () => {
                    if (!confirm('Biztosan törölni szeretnéd a progress fájlt és újraindítani a frissítést?')) {
                      return;
                    }
                    try {
                      const response = await fetch('/api/admin/system/update/reset', {
                        method: 'POST',
                      });
                      if (response.ok) {
                        setIsUpdating(false);
                        setUpdateProgress(null);
                        toast.success('Progress törölve, újra próbálhatod a frissítést');
                      } else {
                        toast.error('Hiba történt a progress törlése során');
                      }
                    } catch (error) {
                      toast.error('Hiba történt');
                    }
                  }}
                  className="w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold"
                >
                  Progress Törlése és Újraindítás
                </button>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={handleSystemUpdate}
                disabled={isUpdating || maintenanceMode}
                className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {isUpdating ? 'Frissítés folyamatban...' : 'Rendszer Frissítése'}
              </button>
              
              {maintenanceMode && (
                <p className="text-sm text-yellow-600 text-center mt-2">
                  ⚠️ Kérjük, kapcsold ki a karbantartási módot a frissítés előtt
                </p>
              )}
              
              {updateCheck && !updateCheck.hasUpdate && !updateCheck.checking && (
                <p className="text-sm text-gray-600 text-center mt-2">
                  ℹ️ Nincs elérhető frissítés. Kattints a "Frissítések Ellenőrzése" gombra, hogy ellenőrizd újra.
                </p>
              )}
              
              {!updateCheck && (
                <p className="text-sm text-gray-500 text-center mt-2">
                  💡 Kattints a "Frissítések Ellenőrzése" gombra, hogy megnézd, van-e új frissítés.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

