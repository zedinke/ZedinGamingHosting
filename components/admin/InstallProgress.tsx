'use client';

import { useState, useEffect, useRef } from 'react';

interface InstallProgressProps {
  serverId: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export function InstallProgress({ serverId, onComplete, onError }: InstallProgressProps) {
  const [progress, setProgress] = useState({
    status: 'starting',
    message: 'Telepítés indítása...',
    progress: 0,
    log: '',
    error: null as string | null,
  });
  
  const logEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Polling a progress endpoint-ról
    const fetchProgress = async () => {
      try {
        const response = await fetch(`/api/admin/servers/${serverId}/install-progress`);
        const data = await response.json();
        
        if (response.ok) {
          setProgress({
            status: data.status || 'in_progress',
            message: data.message || 'Telepítés folyamatban...',
            progress: data.progress || 0,
            log: data.log || '',
            error: data.error || null,
          });

          // Auto-scroll to bottom
          if (logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }

          // Ha befejeződött vagy hiba van, állítsuk le a polling-ot
          if (data.status === 'completed') {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            if (onComplete) {
              setTimeout(() => onComplete(), 2000);
            }
          } else if (data.status === 'error') {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            if (onError) {
              onError(data.error || 'Ismeretlen hiba');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
      }
    };

    // Először azonnal lekérjük
    fetchProgress();
    
    // Aztán 1 másodpercenként
    intervalRef.current = setInterval(fetchProgress, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [serverId, onComplete, onError]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'starting':
      case 'in_progress':
        return 'bg-blue-600';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'error':
        return '✗';
      default:
        return '⟳';
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {progress.message}
          </span>
          <span className="text-sm text-gray-600">
            {Math.round(progress.progress)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${getStatusColor(
              progress.status
            )} flex items-center justify-center`}
            style={{ width: `${progress.progress}%` }}
          >
            {progress.status === 'in_progress' && (
              <div className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
            )}
          </div>
        </div>
      </div>

      {/* Live Terminal */}
      <div className="p-4 bg-gray-900 text-green-400 rounded-lg font-mono text-xs max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-2 sticky top-0 bg-gray-900 pb-2 border-b border-gray-700">
          <span className="text-green-300 font-semibold">Telepítési Log (Élő):</span>
          {progress.status === 'in_progress' || progress.status === 'starting' ? (
            <span className="text-green-400 animate-pulse">●</span>
          ) : progress.status === 'completed' ? (
            <span className="text-green-500">✓</span>
          ) : (
            <span className="text-red-500">✗</span>
          )}
        </div>
        <pre className="whitespace-pre-wrap break-words">
          {progress.log || 'Várakozás a logokra...'}
        </pre>
        <div ref={logEndRef} />
      </div>

      {/* Error message */}
      {progress.status === 'error' && progress.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-semibold mb-1">Hiba történt:</p>
          <p className="text-red-700 text-sm">{progress.error}</p>
        </div>
      )}

      {/* Success message */}
      {progress.status === 'completed' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-semibold">
            ✓ Telepítés sikeresen befejezve!
          </p>
          <p className="text-green-700 text-sm mt-1">
            Az oldal hamarosan újratöltődik...
          </p>
        </div>
      )}
    </div>
  );
}

