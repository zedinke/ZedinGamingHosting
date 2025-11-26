'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { GameType } from '@prisma/client';

interface UserServerConfigEditorProps {
  serverId: string;
  gameType: GameType;
  maxPlayers: number;
  initialConfig?: any;
}

export function UserServerConfigEditor({
  serverId,
  gameType,
  maxPlayers,
  initialConfig,
}: UserServerConfigEditorProps) {
  const [config, setConfig] = useState<any>(initialConfig || {});
  const [defaults, setDefaults] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/servers/${serverId}/config`);
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      setConfig(data.config || {});
      setDefaults(data.defaults || {});
    } catch (error) {
      toast.error('Hiba történt a konfiguráció betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/servers/${serverId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configuration: config }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      toast.success('Konfiguráció sikeresen mentve');
    } catch (error) {
      toast.error('Hiba történt a konfiguráció mentése során');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Biztosan visszaállítod az alapértelmezett konfigurációt?')) {
      setConfig(defaults);
    }
  };

  const updateConfig = (key: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  const getFieldLabel = (key: string): string => {
    const labels: Record<string, string> = {
      // Minecraft
      'server-name': 'Szerver Név',
      difficulty: 'Nehézség',
      gamemode: 'Játékmód',
      'max-players': 'Max Játékosok',
      'view-distance': 'Látótávolság',
      'online-mode': 'Online Mód',
      pvp: 'PvP Engedélyezve',
      'spawn-protection': 'Spawn Védelem',
      'white-list': 'Whitelist',
      motd: 'Üzenet a Napról',
      // ARK
      ServerName: 'Szerver Név',
      MaxPlayers: 'Max Játékosok',
      DifficultyOffset: 'Nehézség Offset',
      HarvestAmountMultiplier: 'Gyűjtés Szorzó',
      TamingSpeedMultiplier: 'Idomítás Sebesség Szorzó',
      XPMultiplier: 'XP Szorzó',
      PvP: 'PvP Engedélyezve',
      ServerAdminPassword: 'Admin Jelszó',
      ServerPassword: 'Szerver Jelszó',
      // Rust
      hostname: 'Szerver Név',
      maxplayers: 'Max Játékosok',
      seed: 'Világ Seed',
      worldsize: 'Világ Méret',
      saveinterval: 'Mentés Intervallum (másodperc)',
      serverurl: 'Szerver URL',
      serverdescription: 'Szerver Leírás',
      // Valheim
      name: 'Szerver Név',
      world: 'Világ Név',
      password: 'Jelszó',
      public: 'Nyilvános Szerver',
      // 7 Days to Die
      ServerPort: 'Port',
      ServerMaxPlayerCount: 'Max Játékosok',
      GameDifficulty: 'Nehézség',
      GameWorld: 'Világ',
      ServerDescription: 'Leírás',
      // Palworld
      AdminPassword: 'Admin Jelszó',
      PublicPort: 'Nyilvános Port',
      PublicIP: 'Nyilvános IP',
      Region: 'Régió',
      // CS:GO / CS2
      sv_region: 'Régió',
      sv_password: 'Jelszó',
      rcon_password: 'RCON Jelszó',
      sv_lan: 'LAN Mód',
    };
    return labels[key] || key;
  };

  const getFieldType = (key: string, defaultValue: any): 'text' | 'number' | 'boolean' | 'select' => {
    if (typeof defaultValue === 'boolean') return 'boolean';
    if (typeof defaultValue === 'number') return 'number';
    
    // Speciális esetek
    if (key === 'difficulty' || key === 'gamemode') return 'select';
    if (key === 'GameDifficulty') return 'select';
    if (key === 'public' || key === 'sv_lan' || key === 'PvPEnabled' || key === 'PvP') return 'boolean';
    
    return 'text';
  };

  const getSelectOptions = (key: string): Array<{ value: string; label: string }> => {
    if (key === 'difficulty') {
      return [
        { value: 'peaceful', label: 'Békés' },
        { value: 'easy', label: 'Könnyű' },
        { value: 'normal', label: 'Normál' },
        { value: 'hard', label: 'Nehéz' },
      ];
    }
    if (key === 'gamemode') {
      return [
        { value: 'survival', label: 'Túlélés' },
        { value: 'creative', label: 'Kreatív' },
        { value: 'adventure', label: 'Kaland' },
        { value: 'spectator', label: 'Néző' },
      ];
    }
    if (key === 'GameDifficulty') {
      return [
        { value: '0', label: 'Újonc' },
        { value: '1', label: 'Normál' },
        { value: '2', label: 'Veterán' },
        { value: '3', label: 'Túlélő' },
        { value: '4', label: 'Insane' },
        { value: '5', label: 'Nightmare' },
      ];
    }
    return [];
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
        <h2 className="text-xl font-bold text-gray-900">Szerver Beállítások</h2>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
          >
            Alapértelmezett
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {saving ? 'Mentés...' : 'Mentés'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(defaults).map(([key, defaultValue]) => {
          const fieldType = getFieldType(key, defaultValue);
          const label = getFieldLabel(key);

          return (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              {fieldType === 'boolean' ? (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config[key] ?? defaultValue}
                    onChange={(e) => updateConfig(key, e.target.checked)}
                    className="rounded"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    {config[key] ?? defaultValue ? 'Igen' : 'Nem'}
                  </span>
                </label>
              ) : fieldType === 'select' ? (
                <select
                  value={config[key] ?? defaultValue}
                  onChange={(e) => updateConfig(key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                >
                  {getSelectOptions(key).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : fieldType === 'number' ? (
                <input
                  type="number"
                  value={config[key] ?? defaultValue}
                  onChange={(e) => updateConfig(key, parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                />
              ) : (
                <input
                  type={key.toLowerCase().includes('password') ? 'password' : 'text'}
                  value={config[key] ?? defaultValue}
                  onChange={(e) => updateConfig(key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-400"
                  placeholder={label}
                />
              )}
            </div>
          );
        })}

        {Object.keys(defaults).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nincs elérhető konfiguráció ehhez a játék típushoz
          </div>
        )}
      </div>
    </div>
  );
}

