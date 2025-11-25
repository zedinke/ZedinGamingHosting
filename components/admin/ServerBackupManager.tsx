'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Backup {
  id: string;
  name: string;
  size: number;
  createdAt: string;
  type: 'manual' | 'automatic';
}

interface ServerBackupManagerProps {
  serverId: string;
  locale: string;
}

export function ServerBackupManager({ serverId, locale }: ServerBackupManagerProps) {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [backupName, setBackupName] = useState('');

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/servers/${serverId}/backup`);
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      setBackups(data.backups || []);
    } catch (error) {
      toast.error('Hiba történt a backupok betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch(`/api/admin/servers/${serverId}/backup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: backupName || undefined,
          type: 'manual',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      toast.success('Backup létrehozása elindítva');
      setBackupName('');
      setTimeout(loadBackups, 2000); // 2 másodperc után frissítés
    } catch (error) {
      toast.error('Hiba történt a backup létrehozása során');
    } finally {
      setCreating(false);
    }
  };

  const handleDownloadBackup = async (backup: Backup) => {
    // TODO: Backup letöltési logika
    toast.info('Backup letöltés hamarosan elérhető');
  };

  const handleDeleteBackup = async (backup: Backup) => {
    if (!confirm(`Biztosan törölni szeretnéd a(z) ${backup.name} backupot?`)) {
      return;
    }

    // TODO: Backup törlési logika
    toast.info('Backup törlés hamarosan elérhető');
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Backup létrehozása */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">Új Backup Létrehozása</h3>
        <form onSubmit={handleCreateBackup} className="flex gap-2">
          <input
            type="text"
            value={backupName}
            onChange={(e) => setBackupName(e.target.value)}
            placeholder="Backup név (opcionális)"
            className="flex-1 px-4 py-2 border rounded-lg"
            disabled={creating}
          />
          <button
            type="submit"
            disabled={creating}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Létrehozás...' : 'Backup Létrehozása'}
          </button>
        </form>
      </div>

      {/* Backupok listája */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Backupok</h3>
          <button
            onClick={loadBackups}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
          >
            Frissítés
          </button>
        </div>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Betöltés...</div>
        ) : backups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Nincs backup</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Név</th>
                <th className="text-left p-3">Típus</th>
                <th className="text-left p-3">Méret</th>
                <th className="text-left p-3">Létrehozva</th>
                <th className="text-left p-3">Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((backup) => (
                <tr key={backup.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{backup.name}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        backup.type === 'automatic'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {backup.type === 'automatic' ? 'Automatikus' : 'Manuális'}
                    </span>
                  </td>
                  <td className="p-3 text-sm">{formatSize(backup.size)}</td>
                  <td className="p-3 text-sm text-gray-600">
                    {new Date(backup.createdAt).toLocaleString('hu-HU')}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownloadBackup(backup)}
                        className="text-primary-600 hover:underline text-sm"
                      >
                        Letöltés
                      </button>
                      <button
                        onClick={() => handleDeleteBackup(backup)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Törlés
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

