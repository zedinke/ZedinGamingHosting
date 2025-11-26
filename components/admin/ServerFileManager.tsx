'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface FileItem {
  name: string;
  type: 'file' | 'directory';
  size: number;
  modified: string;
}

interface ServerFileManagerProps {
  serverId: string;
  locale: string;
}

export function ServerFileManager({ serverId, locale }: ServerFileManagerProps) {
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadFiles();
  }, [currentPath]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/servers/${serverId}/files?path=${encodeURIComponent(currentPath)}`
      );
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      setFiles(data.files || []);
    } catch (error) {
      toast.error('Hiba történt a fájlok betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = async (file: FileItem) => {
    if (file.type === 'directory') {
      setCurrentPath(`${currentPath}${file.name}/`);
    } else {
      // Fájl megnyitása szerkesztéshez
      setSelectedFile(file);
      setIsEditing(true);
      // TODO: Fájl tartalmának betöltése
      setFileContent('// Fájl tartalma betöltése...');
    }
  };

  const handleSaveFile = async () => {
    if (!selectedFile) return;

    try {
      const response = await fetch(`/api/admin/servers/${serverId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'write',
          path: `${currentPath}${selectedFile.name}`,
          content: fileContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      toast.success('Fájl sikeresen mentve');
      setIsEditing(false);
      setSelectedFile(null);
    } catch (error) {
      toast.error('Hiba történt a fájl mentése során');
    }
  };

  const handleDelete = async (file: FileItem) => {
    if (!confirm(`Biztosan törölni szeretnéd a(z) ${file.name} fájlt/könyvtárat?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/servers/${serverId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          path: `${currentPath}${file.name}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      toast.success('Fájl sikeresen törölve');
      loadFiles();
    } catch (error) {
      toast.error('Hiba történt a fájl törlése során');
    }
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
      {/* Navigáció */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            const parts = currentPath.split('/').filter(Boolean);
            if (parts.length > 0) {
              parts.pop();
              setCurrentPath('/' + parts.join('/') + '/');
            } else {
              setCurrentPath('/');
            }
          }}
          disabled={currentPath === '/'}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Vissza
        </button>
        <div className="flex-1 px-3 py-1 bg-gray-100 rounded font-mono text-sm">
          {currentPath}
        </div>
        <button
          onClick={loadFiles}
          className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          Frissítés
        </button>
      </div>

      {/* Fájlok listája */}
      {isEditing && selectedFile ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Fájl szerkesztése: {selectedFile.name}</h3>
            <div className="flex gap-2">
              <button
                onClick={handleSaveFile}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Mentés
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSelectedFile(null);
                }}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Mégse
              </button>
            </div>
          </div>
          <textarea
            value={fileContent}
            onChange={(e) => setFileContent(e.target.value)}
            className="w-full h-96 font-mono text-sm p-4 border rounded"
            placeholder="Fájl tartalma..."
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold mb-4">Fájlok</h3>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Betöltés...</div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nincs fájl ebben a könyvtárban</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Név</th>
                  <th className="text-left p-3">Típus</th>
                  <th className="text-left p-3">Méret</th>
                  <th className="text-left p-3">Módosítva</th>
                  <th className="text-left p-3">Műveletek</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <button
                        onClick={() => handleFileClick(file)}
                        className="text-primary-600 hover:underline flex items-center gap-2"
                      >
                        {file.type === 'directory' ? '📁' : '📄'} {file.name}
                      </button>
                    </td>
                    <td className="p-3 text-sm">
                      {file.type === 'directory' ? 'Könyvtár' : 'Fájl'}
                    </td>
                    <td className="p-3 text-sm">{formatSize(file.size)}</td>
                    <td className="p-3 text-sm text-gray-600">
                      {new Date(file.modified).toLocaleString('hu-HU')}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleDelete(file)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Törlés
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

