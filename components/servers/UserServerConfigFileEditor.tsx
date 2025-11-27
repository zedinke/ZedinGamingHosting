'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';

interface UserServerConfigFileEditorProps {
  serverId: string;
  gameType: string;
  ipAddress: string | null;
  port: number | null;
  maxPlayers: number;
}

export function UserServerConfigFileEditor({
  serverId,
  gameType,
  ipAddress,
  port,
  maxPlayers,
}: UserServerConfigFileEditorProps) {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [configPath, setConfigPath] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadConfigFile();
  }, [serverId]);

  const loadConfigFile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/servers/${serverId}/config-file`);
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt a konfigurációs fájl betöltése során');
        return;
      }

      setContent(data.content || '');
      setOriginalContent(data.content || '');
      setConfigPath(data.configPath || '');
      setHasChanges(false);
    } catch (error) {
      toast.error('Hiba történt a konfigurációs fájl betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!hasChanges) {
      toast.info('Nincs változtatás a mentéshez');
      return;
    }

    // IP, port és slot szám védelem - ezeket ne lehessen módosítani
    let protectedContent = content;

    // Játék specifikus védelem - IP, port és maxPlayers értékek helyreállítása
    // Ez játék típusonként eltérő lehet
    protectedContent = protectConfigFields(protectedContent, gameType, ipAddress, port, maxPlayers);

    setSaving(true);
    try {
      const response = await fetch(`/api/servers/${serverId}/config-file`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: protectedContent }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt a konfigurációs fájl mentése során');
        return;
      }

      toast.success('Konfigurációs fájl sikeresen mentve');
      setOriginalContent(protectedContent);
      setContent(protectedContent);
      setHasChanges(false);
    } catch (error) {
      toast.error('Hiba történt a konfigurációs fájl mentése során');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Biztosan visszaállítod az eredeti konfigurációt? Minden változtatás elveszik.')) {
      setContent(originalContent);
      setHasChanges(false);
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasChanges(newContent !== originalContent);
  };

  // IP, port és slot szám védelem - ezeket ne lehessen módosítani
  const protectConfigFields = (
    content: string,
    gameType: string,
    ipAddress: string | null,
    port: number | null,
    maxPlayers: number
  ): string => {
    let protected = content;

    // Játék specifikus védelem
    switch (gameType) {
      case 'MINECRAFT':
        // server-ip és server-port védelem
        if (ipAddress) {
          protected = protected.replace(/^server-ip=.*$/m, `server-ip=${ipAddress}`);
        }
        if (port) {
          protected = protected.replace(/^server-port=.*$/m, `server-port=${port}`);
        }
        protected = protected.replace(/^max-players=.*$/m, `max-players=${maxPlayers}`);
        break;

      case 'ARK_EVOLVED':
      case 'ARK_ASCENDED':
        // ServerIP és ServerPort védelem
        if (ipAddress) {
          protected = protected.replace(/^ServerIP=.*$/m, `ServerIP=${ipAddress}`);
        }
        if (port) {
          protected = protected.replace(/^ServerPort=.*$/m, `ServerPort=${port}`);
        }
        protected = protected.replace(/^MaxPlayers=.*$/m, `MaxPlayers=${maxPlayers}`);
        break;

      case 'RUST':
        // server.ip és server.port védelem
        if (ipAddress) {
          protected = protected.replace(/^server\.ip\s+".*"$/m, `server.ip "${ipAddress}"`);
        }
        if (port) {
          protected = protected.replace(/^server\.port\s+\d+$/m, `server.port ${port}`);
        }
        protected = protected.replace(/^server\.maxplayers\s+\d+$/m, `server.maxplayers ${maxPlayers}`);
        break;

      case 'PALWORLD':
        // PublicIP és PublicPort védelem
        if (ipAddress) {
          protected = protected.replace(/^PublicIP=.*$/m, `PublicIP=${ipAddress}`);
        }
        if (port) {
          protected = protected.replace(/^PublicPort=.*$/m, `PublicPort=${port}`);
        }
        protected = protected.replace(/^MaxPlayers=.*$/m, `MaxPlayers=${maxPlayers}`);
        break;

      case 'CSGO':
      case 'CS2':
        // ip és port védelem
        if (ipAddress) {
          protected = protected.replace(/^ip\s+".*"$/m, `ip "${ipAddress}"`);
        }
        if (port) {
          protected = protected.replace(/^hostport\s+\d+$/m, `hostport ${port}`);
        }
        protected = protected.replace(/^maxplayers\s+\d+$/m, `maxplayers ${maxPlayers}`);
        break;

      case 'SEVEN_DAYS_TO_DIE':
        // ServerPort védelem
        if (port) {
          protected = protected.replace(/<property\s+name="ServerPort"\s+value="[^"]*"\/>/g, `<property name="ServerPort" value="${port}"/>`);
        }
        protected = protected.replace(/<property\s+name="ServerMaxPlayerCount"\s+value="[^"]*"\/>/g, `<property name="ServerMaxPlayerCount" value="${maxPlayers}"/>`);
        break;

      case 'VALHEIM':
        // Port védelem a start script-ben
        if (port) {
          protected = protected.replace(/-port\s+\d+/g, `-port ${port}`);
        }
        break;

      case 'SATISFACTORY':
        // GamePort védelem
        if (port) {
          protected = protected.replace(/GamePort=\d+/g, `GamePort=${port}`);
        }
        protected = protected.replace(/MaxPlayers=\d+/g, `MaxPlayers=${maxPlayers}`);
        break;

      default:
        // Általános védelem - próbáljuk meg megtalálni az IP, port és maxPlayers mezőket
        if (ipAddress) {
          protected = protected.replace(/(?:ip|IP|server-ip|ServerIP|PublicIP)\s*[=:]\s*[^\s\n]+/gi, `IP=${ipAddress}`);
        }
        if (port) {
          protected = protected.replace(/(?:port|Port|server-port|ServerPort|PublicPort|hostport)\s*[=:]\s*\d+/gi, `Port=${port}`);
        }
        protected = protected.replace(/(?:max-players|MaxPlayers|maxplayers|server\.maxplayers)\s*[=:]\s*\d+/gi, `MaxPlayers=${maxPlayers}`);
    }

    return protected;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8 text-gray-500">Betöltés...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Konfigurációs Fájl Szerkesztése</h2>
          {configPath && (
            <p className="text-sm text-gray-600 mt-1">Fájl: {configPath}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleReset}
            variant="outline"
            disabled={!hasChanges || saving}
          >
            Visszaállítás
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            isLoading={saving}
          >
            {saving ? 'Mentés...' : 'Mentés'}
          </Button>
        </div>
      </div>

      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Figyelem:</strong> Az IP cím, port és slot szám (max játékosok) nem módosítható, mert ezek a csomaghoz kötöttek.
          Ezek az értékek automatikusan helyreállítódnak mentéskor.
        </p>
        <div className="mt-2 text-xs text-yellow-700">
          <p>Védett értékek:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>IP cím: {ipAddress || 'Nincs hozzárendelve'}</li>
            <li>Port: {port || 'Nincs hozzárendelve'}</li>
            <li>Max játékosok: {maxPlayers}</li>
          </ul>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Konfigurációs fájl tartalma
        </label>
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          className="w-full h-96 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white font-mono text-sm"
          placeholder="Konfigurációs fájl tartalma..."
          spellCheck={false}
        />
        {hasChanges && (
          <p className="text-sm text-orange-600">
            Vannak nem mentett változtatások
          </p>
        )}
      </div>

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Tipp:</strong> A konfigurációs fájl szerkesztése után a szerver újraindítása szükséges lehet a változtatások érvénybe léptetéséhez.
        </p>
      </div>
    </div>
  );
}

