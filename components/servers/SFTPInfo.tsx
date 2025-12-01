'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Copy, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Check, 
  Download,
  Server,
  Lock,
  Folder,
  AlertCircle
} from 'lucide-react';

interface SFTPInfo {
  host: string;
  port: number;
  username: string;
  path: string;
  password?: string; // Csak újrageneráláskor jelenik meg
  warning?: string;
  note?: string;
}

interface SFTPInfoProps {
  serverId: string;
  locale: string;
}

export function SFTPInfo({ serverId, locale }: SFTPInfoProps) {
  const [sftpData, setSftpData] = useState<SFTPInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    fetchSFTPInfo();
  }, [serverId]);

  const fetchSFTPInfo = async () => {
    try {
      const response = await fetch(`/api/servers/${serverId}/sftp`);
      const data = await response.json();

      if (data.success && data.sftp) {
        setSftpData(data.sftp);
      } else if (data.error) {
        // Ha nincs SFTP hozzáférés, akkor üres státusz
        setSftpData(null);
      }
    } catch (error) {
      console.error('Error fetching SFTP info:', error);
      setSftpData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success('Másolva a vágólapra!');
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Nem sikerült másolni');
    }
  };

  const handleRegeneratePassword = async () => {
    if (!confirm('Biztosan újragenerálni szeretnéd az SFTP jelszót? A régi jelszó nem lesz többé elérhető!')) {
      return;
    }

    setRegenerating(true);
    try {
      const response = await fetch(`/api/servers/${serverId}/sftp`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt a jelszó újragenerálása során');
        return;
      }

      if (data.success && data.sftp) {
        setSftpData(data.sftp);
        setShowPassword(true); // Automatikusan mutassuk az új jelszót
        toast.success('SFTP jelszó sikeresen újragenerálva! Mentsd el biztonságos helyre!', {
          duration: 6000,
        });
      }
    } catch (error) {
      console.error('Error regenerating password:', error);
      toast.error('Hiba történt a jelszó újragenerálása során');
    } finally {
      setRegenerating(false);
    }
  };

  const handleExportJSON = () => {
    if (!sftpData) return;

    const exportData = {
      host: sftpData.host,
      port: sftpData.port,
      username: sftpData.username,
      path: sftpData.path,
      password: sftpData.password || '*** (nincs elérhető)',
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sftp-credentials-${serverId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('SFTP információk exportálva JSON formátumban');
  };

  const CopyButton = ({ text, fieldName }: { text: string; fieldName: string }) => (
    <button
      onClick={() => handleCopy(text, fieldName)}
      className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
      title="Másolás"
    >
      {copiedField === fieldName ? (
        <Check className="w-4 h-4 text-green-600" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">SFTP információk betöltése...</p>
        </div>
      </div>
    );
  }

  if (!sftpData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">SFTP hozzáférés nincs beállítva</h3>
          <p className="text-gray-600">
            Az SFTP hozzáférés automatikusan létrejön, amikor a szerver telepítve van.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fő SFTP információk */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">SFTP Hozzáférés</h2>
            <p className="text-gray-600 mt-1">Fájlok kezelése SFTP protokollon keresztül</p>
          </div>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Exportálás JSON formátumban"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Export</span>
          </button>
        </div>

        {/* Figyelmeztetés, ha új jelszó lett generálva */}
        {sftpData.warning && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">{sftpData.warning}</p>
              </div>
            </div>
          </div>
        )}

        {/* SFTP kapcsolati adatok */}
        <div className="space-y-4">
          {/* Host */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3 flex-1">
              <Server className="w-5 h-5 text-gray-500" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Host (Szerver címe)</label>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-gray-900">{sftpData.host}</code>
                  <CopyButton text={sftpData.host} fieldName="host" />
                </div>
              </div>
            </div>
          </div>

          {/* Port */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3 flex-1">
              <Server className="w-5 h-5 text-gray-500" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-gray-900">{sftpData.port}</code>
                  <CopyButton text={sftpData.port.toString()} fieldName="port" />
                </div>
              </div>
            </div>
          </div>

          {/* Username */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3 flex-1">
              <Lock className="w-5 h-5 text-gray-500" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Felhasználónév</label>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-gray-900">{sftpData.username}</code>
                  <CopyButton text={sftpData.username} fieldName="username" />
                </div>
              </div>
            </div>
          </div>

          {/* Path */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3 flex-1">
              <Folder className="w-5 h-5 text-gray-500" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Távoli könyvtár</label>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-gray-900">{sftpData.path}</code>
                  <CopyButton text={sftpData.path} fieldName="path" />
                </div>
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3 flex-1">
              <Lock className="w-5 h-5 text-gray-500" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Jelszó</label>
                {sftpData.password ? (
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-gray-900">
                      {showPassword ? sftpData.password : '••••••••••••••••••••'}
                    </code>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title={showPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <CopyButton text={sftpData.password} fieldName="password" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 italic">
                      {sftpData.note || 'A jelszó megtekintéséhez használd a jelszó újragenerálás funkciót'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Jelszó újragenerálás */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={handleRegeneratePassword}
            disabled={regenerating}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {regenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Újragenerálás...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Jelszó újragenerálása</span>
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            ⚠️ Figyelem: Az új jelszó csak egyszer jelenik meg. Mentsd el biztonságos helyre!
          </p>
        </div>
      </div>

      {/* Használati útmutató */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Használati útmutató</h3>
        <div className="space-y-3 text-sm text-blue-800">
          <div>
            <p className="font-medium mb-1">FileZilla (Windows/Mac/Linux):</p>
            <ol className="list-decimal list-inside ml-2 space-y-1">
              <li>Nyisd meg a FileZilla alkalmazást</li>
              <li>Kattints a "Fájl" → "Szerverkezelő" menüre</li>
              <li>Add hozzá az új szervert a fenti adatokkal</li>
              <li>Protokoll: SFTP - SSH File Transfer Protocol</li>
              <li>Kapcsolódás típusa: Normál</li>
            </ol>
          </div>
          <div>
            <p className="font-medium mb-1">WinSCP (Windows):</p>
            <ol className="list-decimal list-inside ml-2 space-y-1">
              <li>Nyisd meg a WinSCP alkalmazást</li>
              <li>Add meg a host címet és portot</li>
              <li>Felhasználónév és jelszó megadása</li>
              <li>Fájl protokoll: SFTP</li>
            </ol>
          </div>
          <div>
            <p className="font-medium mb-1">Terminál (Linux/Mac):</p>
            <code className="block bg-blue-100 p-2 rounded mt-1 font-mono text-xs">
              sftp -P {sftpData.port} {sftpData.username}@{sftpData.host}
            </code>
          </div>
        </div>
      </div>

      {/* Biztonsági megjegyzések */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Biztonsági megjegyzések</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-primary-600 mt-1">•</span>
            <span>Az SFTP felhasználó csak a saját szerver könyvtárához férhet hozzá (chroot jail)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 mt-1">•</span>
            <span>A jelszót ne oszd meg másokkal, és mentsd el biztonságos helyre</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 mt-1">•</span>
            <span>Ha gyanús tevékenységet észlelsz, azonnal változtasd meg a jelszót</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 mt-1">•</span>
            <span>Ne használj közösségi WiFi hálózatokat SFTP kapcsolathoz</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

