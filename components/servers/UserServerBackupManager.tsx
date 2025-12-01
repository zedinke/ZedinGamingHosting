'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Download,
  Upload,
  Trash2,
  Plus,
  HardDrive,
  FileArchive,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ShoppingCart,
} from 'lucide-react';

interface Backup {
  id: string;
  name: string;
  size: number;
  createdAt: string;
  type: 'manual' | 'automatic';
}

interface BackupLimits {
  backupCountLimit: number;
  backupStorageLimitGB: number;
  backupCountUsed: number;
  backupStorageUsedGB: number;
}

interface BackupUpgradePrice {
  price: number;
  currency: string;
}

interface UserServerBackupManagerProps {
  serverId: string;
  locale: string;
}

export function UserServerBackupManager({
  serverId,
  locale,
}: UserServerBackupManagerProps) {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [backupName, setBackupName] = useState('');
  const [limits, setLimits] = useState<BackupLimits | null>(null);
  const [upgradePrice, setUpgradePrice] = useState<BackupUpgradePrice | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadBackups();
    loadLimits();
    loadUpgradePrice();
  }, [serverId]);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/servers/${serverId}/backup`);
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      setBackups(data.backups || []);
      if (data.limits) {
        setLimits(data.limits);
      }
    } catch (error) {
      toast.error('Hiba történt a backupok betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const loadLimits = async () => {
    try {
      const response = await fetch(`/api/servers/${serverId}/backup/limits`);
      const data = await response.json();

      if (response.ok && data.limits) {
        setLimits(data.limits);
      }
    } catch (error) {
      console.error('Error loading backup limits:', error);
    }
  };

  const loadUpgradePrice = async () => {
    try {
      const response = await fetch('/api/admin/system/backup-upgrade-price');
      const data = await response.json();

      if (response.ok && data.price !== undefined) {
        setUpgradePrice({ price: data.price, currency: data.currency || 'HUF' });
      }
    } catch (error) {
      console.error('Error loading upgrade price:', error);
    }
  };

  const handleCreateBackup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!limits) {
      toast.error('Backup limit információk betöltése...');
      return;
    }

    // Limit ellenőrzés
    if (limits.backupCountUsed >= limits.backupCountLimit) {
      toast.error(
        `Elérted a maximális backup számot (${limits.backupCountLimit} db). Bővítsd a backup csomagodat!`
      );
      setShowUpgradeModal(true);
      return;
    }

    setCreating(true);

    try {
      const response = await fetch(`/api/servers/${serverId}/backup`, {
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
      setTimeout(() => {
        loadBackups();
        loadLimits();
      }, 2000);
    } catch (error) {
      toast.error('Hiba történt a backup létrehozása során');
    } finally {
      setCreating(false);
    }
  };

  const handleDownloadBackup = async (backup: Backup) => {
    try {
      toast.loading('Backup letöltése...', { id: 'download' });
      const response = await fetch(`/api/servers/${serverId}/backup/${backup.id}/download`);

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Hiba történt', { id: 'download' });
        return;
      }

      // Fájl letöltése
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = backup.name || `backup-${backup.id}.tar.gz`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Backup letöltése sikeres', { id: 'download' });
    } catch (error) {
      toast.error('Hiba történt a backup letöltése során', { id: 'download' });
    }
  };

  const handleUploadBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!limits) {
      toast.error('Backup limit információk betöltése...');
      return;
    }

    // Fájlméret ellenőrzés (GB-ban)
    const fileSizeGB = file.size / (1024 * 1024 * 1024);
    const availableStorageGB = limits.backupStorageLimitGB - limits.backupStorageUsedGB;

    if (fileSizeGB > availableStorageGB) {
      toast.error(
        `Nincs elég tárhely! Szabad tárhely: ${availableStorageGB.toFixed(2)} GB, fájl méret: ${fileSizeGB.toFixed(2)} GB`
      );
      return;
    }

    // Limit ellenőrzés
    if (limits.backupCountUsed >= limits.backupCountLimit) {
      toast.error(
        `Elérted a maximális backup számot (${limits.backupCountLimit} db). Bővítsd a backup csomagodat!`
      );
      setShowUpgradeModal(true);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (backupName) {
        formData.append('name', backupName);
      }

      toast.loading('Backup feltöltése...', { id: 'upload' });

      const response = await fetch(`/api/servers/${serverId}/backup/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt', { id: 'upload' });
        return;
      }

      toast.success('Backup sikeresen feltöltve', { id: 'upload' });
      setBackupName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setTimeout(() => {
        loadBackups();
        loadLimits();
      }, 1000);
    } catch (error) {
      toast.error('Hiba történt a backup feltöltése során', { id: 'upload' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteBackup = async (backup: Backup) => {
    if (
      !confirm(
        `Biztosan törölni szeretnéd a(z) "${backup.name || backup.id}" backupot?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/servers/${serverId}/backup/${backup.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      toast.success('Backup sikeresen törölve');
      loadBackups();
      loadLimits();
    } catch (error) {
      toast.error('Hiba történt a backup törlése során');
    }
  };

  const handlePurchaseUpgrade = async () => {
    if (!upgradePrice) {
      toast.error('Ár információ betöltése...');
      return;
    }

    setPurchasing(true);

    try {
      const response = await fetch(`/api/servers/${serverId}/backup/upgrade`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt a bővítés vásárlása során');
        return;
      }

      if (data.checkoutUrl) {
        // Redirect a fizetési oldalra
        window.location.href = data.checkoutUrl;
      } else {
        toast.success('Backup bővítés sikeresen megvásárolva');
        setShowUpgradeModal(false);
        loadLimits();
      }
    } catch (error) {
      toast.error('Hiba történt a bővítés vásárlása során');
    } finally {
      setPurchasing(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatGB = (gb: number) => {
    return `${gb.toFixed(2)} GB`;
  };

  const getStoragePercentage = () => {
    if (!limits) return 0;
    return (limits.backupStorageUsedGB / limits.backupStorageLimitGB) * 100;
  };

  const getStorageColor = () => {
    const percentage = getStoragePercentage();
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-primary-600';
  };

  return (
    <div className="space-y-6">
      {/* Limit információk kártya */}
      {limits && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-blue-600" />
              Backup Tárhely
            </h3>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <ShoppingCart className="w-4 h-4" />
              Bővítés
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Backup száma */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Backup száma</span>
                <FileArchive className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  {limits.backupCountUsed}
                </span>
                <span className="text-gray-500">/ {limits.backupCountLimit}</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    limits.backupCountUsed >= limits.backupCountLimit
                      ? 'bg-red-500'
                      : (limits.backupCountUsed / limits.backupCountLimit) * 100 >= 80
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{
                    width: `${Math.min((limits.backupCountUsed / limits.backupCountLimit) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Tárhely */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Tárhely</span>
                <HardDrive className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  {formatGB(limits.backupStorageUsedGB)}
                </span>
                <span className="text-gray-500">/ {formatGB(limits.backupStorageLimitGB)}</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getStorageColor()}`}
                  style={{
                    width: `${Math.min(getStoragePercentage(), 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Figyelmeztetések */}
          {limits.backupCountUsed >= limits.backupCountLimit && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  Elérted a maximális backup számot
                </p>
                <p className="text-sm text-yellow-700">
                  Törölj egy régi backupot, vagy bővítsd a csomagodat további backupokhoz.
                </p>
              </div>
            </div>
          )}

          {getStoragePercentage() >= 90 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Tárhely majdnem tele</p>
                <p className="text-sm text-red-700">
                  {formatGB(
                    limits.backupStorageLimitGB - limits.backupStorageUsedGB
                  )}{' '}
                  szabad tárhely maradt. Törölj régi backupokat vagy bővítsd a tárhelyedet.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Backup létrehozása */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary-600" />
          Új Backup Létrehozása
        </h3>
        <form onSubmit={handleCreateBackup} className="space-y-4">
          <input
            type="text"
            value={backupName}
            onChange={(e) => setBackupName(e.target.value)}
            placeholder="Backup név (opcionális)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            disabled={creating}
          />
          <button
            type="submit"
            disabled={creating || !limits}
            className="w-full px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
          >
            {creating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Létrehozás...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Backup Létrehozása
              </>
            )}
          </button>
        </form>
      </div>

      {/* Backup feltöltése */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary-600" />
          Backup Feltöltése
        </h3>
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".tar.gz,.zip,.tar"
            onChange={handleUploadBackup}
            disabled={uploading}
            className="hidden"
            id="backup-upload-input"
          />
          <label
            htmlFor="backup-upload-input"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-primary-600">Kattints a feltöltéshez</span> vagy
              húzd ide a fájlt
            </p>
            <p className="text-xs text-gray-500 mt-1">Támogatott formátumok: .tar.gz, .zip, .tar</p>
          </label>
          {uploading && (
            <div className="text-center">
              <RefreshCw className="w-6 h-6 animate-spin text-primary-600 mx-auto" />
              <p className="text-sm text-gray-600 mt-2">Feltöltés folyamatban...</p>
            </div>
          )}
        </div>
      </div>

      {/* Backupok listája */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <FileArchive className="w-5 h-5 text-gray-600" />
            Backupok ({backups.length})
          </h3>
          <button
            onClick={loadBackups}
            disabled={loading}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Frissítés
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Betöltés...</p>
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-12">
            <FileArchive className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Nincs még backup</p>
            <p className="text-sm text-gray-500 mt-1">
              Hozz létre vagy tölts fel egy backupot a kezdéshez
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Név</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Típus</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Méret</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Létrehozva</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">
                    Műveletek
                  </th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup) => (
                  <tr
                    key={backup.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <FileArchive className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {backup.name || `backup-${backup.id}`}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          backup.type === 'automatic'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {backup.type === 'automatic' ? 'Automatikus' : 'Manuális'}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-700">{formatSize(backup.size)}</td>
                    <td className="p-3 text-sm text-gray-600">
                      {new Date(backup.createdAt).toLocaleString('hu-HU')}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownloadBackup(backup)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Letöltés"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBackup(backup)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Törlés"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bővítési modal */}
      {showUpgradeModal && upgradePrice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-primary-600" />
              Backup Bővítés
            </h3>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Bővítés tartalma:</strong>
                </p>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>+1 backup mentés</li>
                  <li>+1 GB tárhely</li>
                </ul>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-lg font-semibold text-gray-900">Ár:</span>
                <span className="text-2xl font-bold text-primary-600">
                  {new Intl.NumberFormat('hu-HU', {
                    style: 'currency',
                    currency: upgradePrice.currency,
                  }).format(upgradePrice.price)}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Mégse
                </button>
                <button
                  onClick={handlePurchaseUpgrade}
                  disabled={purchasing}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                >
                  {purchasing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Fizetés...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      Megvásárolás
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

