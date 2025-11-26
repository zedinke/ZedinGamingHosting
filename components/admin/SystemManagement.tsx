'use client';

import { useState, useEffect } from 'react';
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

  // Load initial progress on mount
  useEffect(() => {
    const loadInitialProgress = async () => {
      try {
        const response = await fetch(`/api/admin/system/update/status?t=${Date.now()}`, {
          cache: 'no-store',
        });
        if (response.ok) {
          const progress = await response.json();
          if (progress.status !== 'idle') {
            setUpdateProgress(progress);
            if (progress.status === 'in_progress' || progress.status === 'starting') {
              setIsUpdating(true);
            }
          }
        }
      } catch (error) {
        // Ignore
      }
    };
    loadInitialProgress();
  }, []);

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
      const maxPolls = 1200; // 20 perc maximum (1200 * 1 másodperc)
      
      const checkProgress = async () => {
        pollCount++;
        
        if (pollCount > maxPolls) {
          setIsUpdating(false);
          setUpdateProgress(null);
          toast.error('A frissítés túl sokáig tart, ellenőrizd a logokat');
          return;
        }

        try {
          const progressResponse = await fetch(`/api/admin/system/update/status?t=${Date.now()}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
          });
          
          if (!progressResponse.ok) {
            // Ha a fájl nem létezik, lehet hogy még nem indult el
            if (pollCount < 5) {
              console.log(`Progress fájl még nem létezik, várakozás... (poll: ${pollCount})`);
              setTimeout(checkProgress, 1000);
              return;
            }
            console.error('Progress fájl nem elérhető:', progressResponse.status);
            throw new Error(`Nem sikerült lekérni a frissítés állapotát`);
          }
          
          const progress = await progressResponse.json();
          
          console.log('Progress állapot:', progress.status, 'Progress:', progress.progress, '%');

          // Mindig frissítjük a progress-t
          setUpdateProgress(progress);

          if (progress.status === 'completed') {
            setIsUpdating(false);
            toast.success('Rendszer sikeresen frissítve!');
            setUpdateCheck(null);
            setTimeout(() => {
              window.location.reload();
            }, 2000);
            return;
          } else if (progress.status === 'error') {
            setIsUpdating(false);
            toast.error(progress.error || 'Frissítési hiba');
            return;
          } else if (progress.status === 'starting' || progress.status === 'in_progress') {
            // Folytatjuk a polling-ot
            setTimeout(checkProgress, 1000);
          } else if (progress.status === 'idle') {
            // Ha idle, lehet hogy még nem indult el
            if (pollCount < 5) {
              setTimeout(checkProgress, 1000);
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
      setTimeout(checkProgress, 500);
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Karbantartási Mód</h2>
            <p className="text-gray-700 text-sm">
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Rendszer Frissítés</h2>
        <div className="space-y-4">
          {lastUpdate && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                Utolsó frissítés:{' '}
                <span className="font-medium text-gray-900">
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

          {/* Progress megjelenítés - mindig mutatjuk, ha van progress vagy frissítés folyamatban */}
          {(isUpdating || updateProgress) && (
            <div className="space-y-4">
              {updateProgress ? (
                <UpdateProgress progress={updateProgress} />
              ) : (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Frissítés indítása...
                  </p>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-primary-600 h-3 rounded-full animate-pulse" style={{ width: '10%' }}></div>
                  </div>
                </div>
              )}
              {(updateProgress?.status === 'error' || updateProgress?.status === 'in_progress' || updateProgress?.status === 'starting') && (
                <button
                  onClick={async () => {
                    if (!confirm('Biztosan törölni szeretnéd a progress fájlt és újraindítani a frissítést?')) {
                      return;
                    }
                    try {
                      // Először töröljük a state-et, hogy azonnal eltűnjön a UI-ból
                      setIsUpdating(false);
                      setUpdateProgress(null);
                      
                      // Majd töröljük a fájlt
                      const response = await fetch(`/api/admin/system/update?t=${Date.now()}`, {
                        method: 'DELETE',
                        cache: 'no-store',
                      });
                      
                      if (response.ok) {
                        // Várjunk egy kicsit, hogy a fájl biztosan törlődött
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                        // Ellenőrizzük, hogy tényleg törlődött-e
                        const statusResponse = await fetch(`/api/admin/system/update/status?t=${Date.now()}`, {
                          cache: 'no-store',
                        });
                        if (statusResponse.ok) {
                          const statusData = await statusResponse.json();
                          if (statusData.status === 'idle') {
                            toast.success('Progress törölve, újra próbálhatod a frissítést');
                          } else {
                            // Ha még mindig van progress, akkor nem sikerült törölni
                            setUpdateProgress(statusData);
                            toast.error('A progress fájl nem törölhető');
                          }
                        } else {
                          toast.success('Progress törölve, újra próbálhatod a frissítést');
                        }
                      } else {
                        const errorData = await response.json();
                        toast.error(errorData.error || 'Hiba történt a progress törlése során');
                        // Ha hiba van, újra betöltjük a progress-t
                        const statusResponse = await fetch(`/api/admin/system/update/status?t=${Date.now()}`, {
                          cache: 'no-store',
                        });
                        if (statusResponse.ok) {
                          const statusData = await statusResponse.json();
                          if (statusData.status !== 'idle') {
                            setUpdateProgress(statusData);
                            if (statusData.status === 'in_progress' || statusData.status === 'starting') {
                              setIsUpdating(true);
                            }
                          }
                        }
                      }
                    } catch (error) {
                      console.error('Progress törlés hiba:', error);
                      toast.error('Hiba történt');
                      // Ha hiba van, újra betöltjük a progress-t
                      try {
                        const statusResponse = await fetch(`/api/admin/system/update/status?t=${Date.now()}`, {
                          cache: 'no-store',
                        });
                        if (statusResponse.ok) {
                          const statusData = await statusResponse.json();
                          if (statusData.status !== 'idle') {
                            setUpdateProgress(statusData);
                            if (statusData.status === 'in_progress' || statusData.status === 'starting') {
                              setIsUpdating(true);
                            }
                          }
                        }
                      } catch {
                        // Ignore
                      }
                    }
                  }}
                  className="w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold"
                >
                  Progress Törlése és Újraindítás
                </button>
              )}
            </div>
          )}
          
          {/* Progress törlés gomb - ha van progress fájl, de nincs aktív frissítés */}
          {updateProgress && (updateProgress.status === 'error' || updateProgress.status === 'completed') && !isUpdating && (
            <button
              onClick={async () => {
                try {
                  // Először töröljük a state-et, hogy azonnal eltűnjön a UI-ból
                  setUpdateProgress(null);
                  setIsUpdating(false);
                  
                  // Majd töröljük a fájlt
                  const response = await fetch(`/api/admin/system/update?t=${Date.now()}`, {
                    method: 'DELETE',
                    cache: 'no-store',
                  });
                  
                  if (response.ok) {
                    const result = await response.json();
                    // Várjunk egy kicsit, hogy a fájl biztosan törlődött
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Ellenőrizzük, hogy tényleg törlődött-e
                    const statusResponse = await fetch(`/api/admin/system/update/status?t=${Date.now()}`, {
                      cache: 'no-store',
                    });
                    if (statusResponse.ok) {
                      const statusData = await statusResponse.json();
                      if (statusData.status === 'idle') {
                        toast.success('Progress törölve');
                      } else {
                        // Ha még mindig van progress, akkor nem sikerült törölni
                        setUpdateProgress(statusData);
                        toast.error('A progress fájl nem törölhető');
                      }
                    } else {
                      toast.success('Progress törölve');
                    }
                  } else {
                    const errorData = await response.json();
                    toast.error(errorData.error || 'Hiba történt a progress törlése során');
                    // Ha hiba van, újra betöltjük a progress-t
                    const statusResponse = await fetch(`/api/admin/system/update/status?t=${Date.now()}`, {
                      cache: 'no-store',
                    });
                    if (statusResponse.ok) {
                      const statusData = await statusResponse.json();
                      if (statusData.status !== 'idle') {
                        setUpdateProgress(statusData);
                      }
                    }
                  }
                } catch (error) {
                  console.error('Progress törlés hiba:', error);
                  toast.error('Hiba történt');
                  // Ha hiba van, újra betöltjük a progress-t
                  try {
                    const statusResponse = await fetch(`/api/admin/system/update/status?t=${Date.now()}`, {
                      cache: 'no-store',
                    });
                    if (statusResponse.ok) {
                      const statusData = await statusResponse.json();
                      if (statusData.status !== 'idle') {
                        setUpdateProgress(statusData);
                      }
                    }
                  } catch {
                    // Ignore
                  }
                }
              }}
              className="w-full bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-semibold mb-3"
            >
              Régi Progress Törlése
            </button>
          )}

          {!isUpdating && !updateProgress && (
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

