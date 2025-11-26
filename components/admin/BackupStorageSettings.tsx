'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export function BackupStorageSettings() {
  const [storageType, setStorageType] = useState<'local' | 's3' | 'ftp'>('local');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/backup-storage');
      const data = await response.json();

      if (response.ok) {
        setStorageType(data.storageType || 'local');
      }
    } catch (error) {
      toast.error('Hiba történt a beállítások betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/backup-storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storageType }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Backup storage beállítások frissítve');
      } else {
        toast.error(data.error || 'Hiba történt');
      }
    } catch (error) {
      toast.error('Hiba történt a mentés során');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Betöltés...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-bold mb-4">Backup Storage Beállítások</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Storage Típus</label>
          <select
            value={storageType}
            onChange={(e) => setStorageType(e.target.value as any)}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="local">Lokális tárolás</option>
            <option value="s3">Amazon S3</option>
            <option value="ftp">FTP/SFTP</option>
          </select>
        </div>

        {storageType === 's3' && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">S3 Konfiguráció</h4>
            <p className="text-sm text-gray-600 mb-2">
              Környezeti változók beállítása szükséges:
            </p>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>AWS_ACCESS_KEY_ID</li>
              <li>AWS_SECRET_ACCESS_KEY</li>
              <li>AWS_REGION</li>
              <li>AWS_S3_BUCKET</li>
            </ul>
          </div>
        )}

        {storageType === 'ftp' && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">FTP Konfiguráció</h4>
            <p className="text-sm text-gray-600 mb-2">
              Környezeti változók beállítása szükséges:
            </p>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>FTP_HOST</li>
              <li>FTP_USER</li>
              <li>FTP_PASSWORD</li>
              <li>FTP_PORT (opcionális, alapértelmezett: 21)</li>
              <li>FTP_SECURE (opcionális, true/false)</li>
            </ul>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Mentés...' : 'Mentés'}
        </button>
      </div>
    </div>
  );
}

