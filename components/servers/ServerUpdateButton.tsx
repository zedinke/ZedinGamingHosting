'use client';

import { useState, useEffect } from 'react';
import { Loader2, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface ServerUpdateButtonProps {
  serverId: string;
  locale: string;
  gameType: string;
}

interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string | null;
  availableVersion: string | null;
  gameType?: string;
}

export function ServerUpdateButton({ serverId, locale, gameType }: ServerUpdateButtonProps) {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Frissítés ellenőrzése 5 percenként
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const response = await fetch(`/api/servers/${serverId}/update-check`);
        if (response.ok) {
          const data = await response.json();
          setUpdateInfo(data);
        } else {
          // Ha hiba van, akkor is beállítjuk, hogy ne legyen frissítés
          setUpdateInfo({ hasUpdate: false, currentVersion: null, availableVersion: null });
        }
      } catch (error) {
        console.error('Update check error:', error);
        setUpdateInfo({ hasUpdate: false, currentVersion: null, availableVersion: null });
      } finally {
        setIsChecking(false);
      }
    };

    // Azonnal ellenőrzés
    checkForUpdates();

    // 5 percenként (300000 ms) ellenőrzés
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [serverId]);

  const handleUpdate = async () => {
    if (!updateInfo?.hasUpdate) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/servers/${serverId}/update`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Frissítés sikertelen');
        return;
      }

      toast.success('Frissítés elindítva! A szerver újraindul.');
      
      // Frissítjük az információkat
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      toast.error('Hiba történt a frissítés során');
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Frissítés ellenőrzése...</span>
      </div>
    );
  }

  if (!updateInfo) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900 mb-1">Szerver verzió</div>
          <div className="text-xs text-gray-600 space-y-1">
            {updateInfo.currentVersion ? (
              <div>Jelenlegi: <span className="font-mono font-semibold">{updateInfo.currentVersion}</span></div>
            ) : (
              <div className="text-gray-400">Jelenlegi verzió: Ismeretlen</div>
            )}
            {updateInfo.availableVersion ? (
              <div>Elérhető: <span className="font-mono font-semibold">{updateInfo.availableVersion}</span></div>
            ) : (
              <div className="text-gray-400">Elérhető verzió: Ismeretlen</div>
            )}
          </div>
        </div>
        <button
          onClick={handleUpdate}
          disabled={!updateInfo.hasUpdate || isLoading}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            updateInfo.hasUpdate
              ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Frissítés...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>{updateInfo.hasUpdate ? 'Frissítés' : 'Nincs frissítés'}</span>
            </>
          )}
        </button>
      </div>
      {updateInfo.hasUpdate && (
        <p className="text-xs text-blue-600">
          ⚠️ A frissítés során a szerver újraindul és leállhat néhány percig.
        </p>
      )}
    </div>
  );
}



