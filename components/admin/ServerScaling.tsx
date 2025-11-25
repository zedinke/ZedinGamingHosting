'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface ServerScalingProps {
  serverId: string;
  locale: string;
}

export function ServerScaling({ serverId, locale }: ServerScalingProps) {
  const [checking, setChecking] = useState(false);
  const [scaling, setScaling] = useState(false);
  const [result, setResult] = useState<{ action: string; reason: string } | null>(null);

  const handleCheck = async () => {
    setChecking(true);
    try {
      const response = await fetch(`/api/admin/servers/${serverId}/scaling`);
      const data = await response.json();

      if (response.ok) {
        setResult(data);
        if (data.action !== 'none') {
          toast.info(`Skálázás ajánlott: ${data.reason}`);
        } else {
          toast.success('Erőforrás használat normális');
        }
      } else {
        toast.error(data.error || 'Hiba történt');
      }
    } catch (error) {
      toast.error('Hiba történt az ellenőrzés során');
    } finally {
      setChecking(false);
    }
  };

  const handleScale = async (action: 'scale_up' | 'scale_down') => {
    if (!confirm(`Biztosan ${action === 'scale_up' ? 'fel' : 'le'} szeretnéd skálázni a szervert?`)) {
      return;
    }

    setScaling(true);
    try {
      const response = await fetch(`/api/admin/servers/${serverId}/scaling`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Skálázás sikeres');
        setResult(null);
      } else {
        toast.error(data.error || 'Hiba történt');
      }
    } catch (error) {
      toast.error('Hiba történt a skálázás során');
    } finally {
      setScaling(false);
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-bold mb-4">Automatikus Skálázás</h3>

      <div className="space-y-4">
        <button
          onClick={handleCheck}
          disabled={checking}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {checking ? 'Ellenőrzés...' : 'Skálázási Ellenőrzés'}
        </button>

        {result && (
          <div className={`p-4 rounded-lg ${
            result.action === 'scale_up' ? 'bg-orange-50 border border-orange-200' :
            result.action === 'scale_down' ? 'bg-blue-50 border border-blue-200' :
            'bg-green-50 border border-green-200'
          }`}>
            <p className="font-semibold mb-1">
              {result.action === 'scale_up' ? '⬆️ Skálázás felfelé ajánlott' :
               result.action === 'scale_down' ? '⬇️ Skálázás lefelé ajánlott' :
               '✅ Erőforrás használat normális'}
            </p>
            <p className="text-sm text-gray-600">{result.reason}</p>

            {result.action !== 'none' && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleScale(result.action as 'scale_up' | 'scale_down')}
                  disabled={scaling}
                  className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-sm"
                >
                  {scaling ? 'Skálázás...' : 'Skálázás Végrehajtása'}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">Manuális Skálázás</h4>
          <div className="flex gap-2">
            <button
              onClick={() => handleScale('scale_up')}
              disabled={scaling}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
            >
              ⬆️ Fel Skálázás
            </button>
            <button
              onClick={() => handleScale('scale_down')}
              disabled={scaling}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 text-sm"
            >
              ⬇️ Le Skálázás
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

