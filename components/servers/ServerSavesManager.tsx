'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { GameType } from '@prisma/client';

interface ServerSavesManagerProps {
  serverId: string;
  gameType: GameType;
}

interface SaveFile {
  name: string;
  path: string;
  size: number;
  modified: string;
}

export function ServerSavesManager({ serverId, gameType }: ServerSavesManagerProps) {
  const [files, setFiles] = useState<SaveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (gameType === 'THE_FOREST') {
      loadSaves();
    }
  }, [serverId, gameType]);

  const loadSaves = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/servers/${serverId}/saves`);
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      setFiles(data.files || []);
    } catch (error) {
      toast.error('Hiba történt a mentési fájlok betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/servers/${serverId}/saves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'backup' }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      toast.success('Backup sikeresen létrehozva');
      loadSaves();
    } catch (error) {
      toast.error('Hiba történt a backup létrehozása során');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileName: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/servers/${serverId}/saves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'download', fileName }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      // Base64 decode és fájl letöltése
      const binaryString = atob(data.content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Fájl sikeresen letöltve');
    } catch (error) {
      toast.error('Hiba történt a fájl letöltése során');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Válassz ki egy fájlt');
      return;
    }

    setUploading(true);
    try {
      // Fájl olvasása base64-re
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const fileContent = (e.target?.result as string).split(',')[1] || e.target?.result as string;
          
          const response = await fetch(`/api/servers/${serverId}/saves`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'upload',
              fileContent,
              targetFileName: selectedFile.name,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            toast.error(data.error || 'Hiba történt');
            return;
          }

          toast.success('Fájl sikeresen feltöltve');
          setSelectedFile(null);
          loadSaves();
        } catch (error) {
          toast.error('Hiba történt a fájl feltöltése során');
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      toast.error('Hiba történt a fájl feltöltése során');
      setUploading(false);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (gameType !== 'THE_FOREST') {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Mentési Fájlok</h2>
        <div className="flex gap-2">
          <button
            onClick={handleBackup}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {loading ? 'Folyamatban...' : 'Backup'}
          </button>
          <button
            onClick={loadSaves}
            disabled={loading}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            Frissítés
          </button>
        </div>
      </div>

      {/* Feltöltés */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Fájl Feltöltése</h3>
        <div className="flex gap-2">
          <input
            type="file"
            onChange={handleFileSelect}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            accept=".sav,.dat"
          />
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {uploading ? 'Feltöltés...' : 'Feltöltés'}
          </button>
        </div>
        {selectedFile && (
          <p className="mt-2 text-sm text-gray-600">Kiválasztott fájl: {selectedFile.name}</p>
        )}
      </div>

      {/* Fájlok listája */}
      {loading && files.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Betöltés...</div>
      ) : files.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Nincsenek mentési fájlok</div>
      ) : (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100"
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900">{file.name}</div>
                <div className="text-sm text-gray-600">
                  {formatSize(file.size)} • {new Date(file.modified).toLocaleString('hu-HU')}
                </div>
              </div>
              <button
                onClick={() => handleDownload(file.name)}
                disabled={loading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Letöltés
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

