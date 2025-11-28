'use client';

/**
 * ARK Survival Ascended specifikus konfigurációs kezelő
 * Kezeli a GameUserSettings.ini és Game.ini fájlokat
 */

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Download, Upload, Save, FileText, Edit2, Settings } from 'lucide-react';

interface ARKASAServerConfigManagerProps {
  serverId: string;
  ipAddress: string | null;
  port: number | null;
  queryPort: number | null;
  maxPlayers: number;
}

type ConfigFileType = 'GameUserSettings' | 'Game';

interface ConfigValue {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean';
  category: string;
  description: string;
  section?: string;
}

export function ARKASAServerConfigManager({
  serverId,
  ipAddress,
  port,
  queryPort,
  maxPlayers,
}: ARKASAServerConfigManagerProps) {
  const [activeFile, setActiveFile] = useState<ConfigFileType>('GameUserSettings');
  const [editMode, setEditMode] = useState<'form' | 'editor'>('form');
  const [gameUserSettings, setGameUserSettings] = useState<Record<string, any>>({});
  const [gameIni, setGameIni] = useState<Record<string, any>>({});
  const [rawContent, setRawContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadConfig();
  }, [serverId, activeFile, editMode]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const configType = activeFile === 'GameUserSettings' ? 'gameusersettings' : 'game';
      const response = await fetch(`/api/servers/${serverId}/ark-config/${configType}`);
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt a konfiguráció betöltése során');
        return;
      }

      // Always load both raw content and parsed values
      setRawContent(data.content || '');
      if (activeFile === 'GameUserSettings') {
        setGameUserSettings(data.values || {});
      } else {
        setGameIni(data.values || {});
      }
      setHasChanges(false);
    } catch (error) {
      toast.error('Hiba történt a konfiguráció betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const configType = activeFile === 'GameUserSettings' ? 'gameusersettings' : 'game';
      const content = editMode === 'form' 
        ? generateConfigFromValues()
        : rawContent;

      const response = await fetch(`/api/servers/${serverId}/ark-config/${configType}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt a mentés során');
        return;
      }

      toast.success('Konfiguráció sikeresen mentve');
      setHasChanges(false);
    } catch (error) {
      toast.error('Hiba történt a mentés során');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    try {
      const configType = activeFile === 'GameUserSettings' ? 'gameusersettings' : 'game';
      const response = await fetch(`/api/servers/${serverId}/ark-config/${configType}/download`);
      
      if (!response.ok) {
        toast.error('Hiba történt a letöltés során');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = activeFile === 'GameUserSettings' ? 'GameUserSettings.ini' : 'Game.ini';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Fájl sikeresen letöltve');
    } catch (error) {
      toast.error('Hiba történt a letöltés során');
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      setRawContent(content);
      setEditMode('editor');
      setHasChanges(true);
      toast.success('Fájl sikeresen feltöltve');
    };
    reader.readAsText(file);
  };

  const generateConfigFromValues = (): string => {
    if (activeFile === 'GameUserSettings') {
      return generateGameUserSettings(gameUserSettings);
    } else {
      return generateGameIni(gameIni);
    }
  };

  const generateGameUserSettings = (values: Record<string, any>): string => {
    let content = '';
    
    // Helper function to get value with fallback
    const getValue = (key: string, defaultValue: any) => {
      return values[key] ?? values[`SessionSettings.${key}`] ?? values[`/Script/ShooterGame.ShooterGameUserSettings.${key}`] ?? defaultValue;
    };
    
    // ShooterGameUserSettings section
    content += '[/Script/ShooterGame.ShooterGameUserSettings]\n';
    content += `MasterAudioVolume=${getValue('MasterAudioVolume', 1.0)}\n`;
    content += `MusicAudioVolume=${getValue('MusicAudioVolume', 1.0)}\n`;
    content += `SFXAudioVolume=${getValue('SFXAudioVolume', 1.0)}\n`;
    content += `VoiceAudioVolume=${getValue('VoiceAudioVolume', 1.0)}\n`;
    content += `UIScaling=${getValue('UIScaling', 1.0)}\n`;
    content += `UIScaleSlider=${getValue('UIScaleSlider', 1.0)}\n`;
    const bFirstRun = getValue('bFirstRun', false);
    content += `bFirstRun=${bFirstRun === true || bFirstRun === 'True' ? 'True' : 'False'}\n`;
    const bShowChatbox = getValue('bShowChatbox', true);
    content += `bShowChatbox=${bShowChatbox === true || bShowChatbox === 'True' ? 'True' : 'False'}\n`;
    content += '\n';

    // SessionSettings section
    content += '[SessionSettings]\n';
    content += `SessionName=${getValue('SessionName', 'My Ark Server')}\n`;
    content += `Port=${port || 7777}\n`;
    content += `QueryPort=${queryPort || 27015}\n`;
    content += `ServerPassword=${getValue('ServerPassword', '')}\n`;
    content += `AdminPassword=${getValue('AdminPassword', 'changeme123')}\n`;
    content += `MaxPlayers=${maxPlayers}\n`;
    const serverPVE = getValue('ServerPVE', false);
    content += `ServerPVE=${serverPVE === true || serverPVE === 'True' ? 'True' : 'False'}\n`;
    content += '\n';

    // ShooterGameMode section (if there are item overrides)
    const itemOverrides = getValue('ConfigOverrideItemMaxQuantity', null);
    if (itemOverrides) {
      content += '[/Script/ShooterGame.ShooterGameMode]\n';
      if (Array.isArray(itemOverrides)) {
        itemOverrides.forEach((override: any) => {
          if (override.itemClass && override.quantity) {
            content += `ConfigOverrideItemMaxQuantity=(ItemClassString="${override.itemClass}",Quantity=${override.quantity})\n`;
          }
        });
      } else {
        content += `ConfigOverrideItemMaxQuantity=(ItemClassString="PrimalItemResource_Amarberry_C",Quantity=${itemOverrides})\n`;
      }
    }

    return content;
  };

  const generateGameIni = (values: Record<string, any>): string => {
    let content = '';
    
    content += '[/Script/ShooterGame.ShooterGameMode]\n';
    
    // Item quantity overrides
    const itemOverrides = values['ItemOverrides'] || values['/Script/ShooterGame.ShooterGameMode.ItemOverrides'] || [];
    if (Array.isArray(itemOverrides) && itemOverrides.length > 0) {
      itemOverrides.forEach((override: any) => {
        if (override && override.itemClass && override.quantity !== undefined) {
          content += `ConfigOverrideItemMaxQuantity=(ItemClassString="${override.itemClass}",Quantity=${override.quantity})\n`;
        }
      });
    } else {
      // Fallback: if there are any ConfigOverrideItemMaxQuantity entries in values
      Object.keys(values).forEach((key) => {
        if (key.includes('ConfigOverrideItemMaxQuantity') || key.includes('ItemClass')) {
          // Try to extract item class and quantity from the value
          const value = values[key];
          if (typeof value === 'object' && value.itemClass && value.quantity) {
            content += `ConfigOverrideItemMaxQuantity=(ItemClassString="${value.itemClass}",Quantity=${value.quantity})\n`;
          }
        }
      });
    }

    return content;
  };

  const updateValue = (key: string, value: any, file: ConfigFileType) => {
    if (file === 'GameUserSettings') {
      setGameUserSettings(prev => ({ ...prev, [key]: value }));
    } else {
      setGameIni(prev => ({ ...prev, [key]: value }));
    }
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8 text-gray-500">Betöltés...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* File Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex gap-4 items-center">
          <button
            onClick={() => {
              setActiveFile('GameUserSettings');
              setEditMode('form');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeFile === 'GameUserSettings'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            GameUserSettings.ini
          </button>
          <button
            onClick={() => {
              setActiveFile('Game');
              setEditMode('form');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeFile === 'Game'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Game.ini
          </button>
          <div className="flex-1" />
          <div className="flex gap-2">
            <button
              onClick={() => setEditMode(editMode === 'form' ? 'editor' : 'form')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              <Edit2 className="w-4 h-4" />
              {editMode === 'form' ? 'Szerkesztő Mód' : 'Űrlap Mód'}
            </button>
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer font-medium">
              <Upload className="w-4 h-4" />
              Feltöltés
              <input
                type="file"
                accept=".ini"
                onChange={handleUpload}
                className="hidden"
              />
            </label>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              <Download className="w-4 h-4" />
              Letöltés
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Mentés...' : 'Mentés'}
            </button>
          </div>
        </div>
      </div>

      {/* Config Editor */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {editMode === 'form' ? (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">
              {activeFile === 'GameUserSettings' ? 'GameUserSettings.ini' : 'Game.ini'} Beállítások
            </h2>
            <p className="text-sm text-gray-600">
              A port ({port}), QueryPort ({queryPort}) és MaxPlayers ({maxPlayers}) értékek védettek és nem módosíthatók.
            </p>
            {activeFile === 'GameUserSettings' ? (
              <GameUserSettingsForm
                values={gameUserSettings}
                port={port}
                queryPort={queryPort}
                maxPlayers={maxPlayers}
                onUpdate={(key, value) => updateValue(key, value, 'GameUserSettings')}
              />
            ) : (
              <GameIniForm
                values={gameIni}
                onUpdate={(key, value) => updateValue(key, value, 'Game')}
              />
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              {activeFile === 'GameUserSettings' ? 'GameUserSettings.ini' : 'Game.ini'} Szerkesztő
            </h2>
            <textarea
              value={rawContent}
              onChange={(e) => {
                setRawContent(e.target.value);
                setHasChanges(true);
              }}
              className="w-full h-96 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white font-mono text-sm"
              spellCheck={false}
            />
            {hasChanges && (
              <p className="text-sm text-orange-600">
                Vannak nem mentett változtatások
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// GameUserSettings.ini Form Component
function GameUserSettingsForm({
  values,
  port,
  queryPort,
  maxPlayers,
  onUpdate,
}: {
  values: Record<string, any>;
  port: number | null;
  queryPort: number | null;
  maxPlayers: number;
  onUpdate: (key: string, value: any) => void;
}) {
  const categories = [
    {
      name: 'Hang Beállítások',
      description: 'A játék hangjainak hangerőssége',
      fields: [
        {
          key: 'MasterAudioVolume',
          label: 'Fő Hangerő',
          type: 'number' as const,
          min: 0,
          max: 1,
          step: 0.1,
          description: 'Az összes hang összesített hangerőssége (0.0 - 1.0)',
          defaultValue: 1.0,
        },
        {
          key: 'MusicAudioVolume',
          label: 'Zene Hangerő',
          type: 'number' as const,
          min: 0,
          max: 1,
          step: 0.1,
          description: 'A háttérzene hangerőssége (0.0 - 1.0)',
          defaultValue: 1.0,
        },
        {
          key: 'SFXAudioVolume',
          label: 'Effektek Hangerő',
          type: 'number' as const,
          min: 0,
          max: 1,
          step: 0.1,
          description: 'A hang effektek hangerőssége (0.0 - 1.0)',
          defaultValue: 1.0,
        },
        {
          key: 'VoiceAudioVolume',
          label: 'Hang Chat Hangerő',
          type: 'number' as const,
          min: 0,
          max: 1,
          step: 0.1,
          description: 'A hang chat hangerőssége (0.0 - 1.0)',
          defaultValue: 1.0,
        },
      ],
    },
    {
      name: 'UI Beállítások',
      description: 'Felhasználói felület beállításai',
      fields: [
        {
          key: 'UIScaling',
          label: 'UI Méretezés',
          type: 'number' as const,
          min: 0.5,
          max: 2.0,
          step: 0.1,
          description: 'A felhasználói felület méretezése (0.5 - 2.0)',
          defaultValue: 1.0,
        },
        {
          key: 'UIScaleSlider',
          label: 'UI Méretezés Csúszka',
          type: 'number' as const,
          min: 0.5,
          max: 2.0,
          step: 0.1,
          description: 'A UI méretezés csúszka értéke (0.5 - 2.0)',
          defaultValue: 1.0,
        },
        {
          key: 'bFirstRun',
          label: 'Első Futtatás',
          type: 'boolean' as const,
          description: 'Első futtatás jelző (általában False)',
          defaultValue: false,
        },
        {
          key: 'bShowChatbox',
          label: 'Chat Doboz Megjelenítése',
          type: 'boolean' as const,
          description: 'A chat doboz megjelenítése a játékban',
          defaultValue: true,
        },
      ],
    },
    {
      name: 'Szerver Beállítások',
      description: 'A szerver alapvető beállításai',
      fields: [
        {
          key: 'SessionName',
          label: 'Szerver Név',
          type: 'string' as const,
          description: 'A szerver neve, ami megjelenik a szerver listában',
          defaultValue: 'My Ark Server',
        },
        {
          key: 'ServerPassword',
          label: 'Szerver Jelszó',
          type: 'string' as const,
          description: 'Opcionális jelszó a szerverhez való csatlakozáshoz (üres, ha nincs)',
          defaultValue: '',
          isPassword: true,
        },
        {
          key: 'AdminPassword',
          label: 'Admin Jelszó',
          type: 'string' as const,
          description: 'Az adminisztrátor jelszava a szerver konzolhoz való hozzáféréshez',
          defaultValue: 'changeme123',
          isPassword: true,
        },
        {
          key: 'ServerPVE',
          label: 'PvE Mód',
          type: 'boolean' as const,
          description: 'Player vs Environment mód engedélyezése (True = PvE, False = PvP)',
          defaultValue: false,
        },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {categories.map((category) => (
        <div key={category.name} className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.name}</h3>
          <p className="text-sm text-gray-600 mb-4">{category.description}</p>
          <div className="space-y-4">
            {category.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                </label>
                <p className="text-xs text-gray-500 mb-2">{field.description}</p>
                {field.type === 'boolean' ? (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={values[field.key] ?? field.defaultValue}
                      onChange={(e) => onUpdate(field.key, e.target.checked)}
                      className="rounded"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      {values[field.key] ?? field.defaultValue ? 'Igen' : 'Nem'}
                    </span>
                  </label>
                ) : field.type === 'number' ? (
                  <div className="space-y-1">
                    <input
                      type="number"
                      value={values[field.key] ?? field.defaultValue}
                      onChange={(e) => onUpdate(field.key, parseFloat(e.target.value) || 0)}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Min: {field.min}</span>
                      <span>Max: {field.max}</span>
                    </div>
                  </div>
                ) : (
                  <input
                    type={field.isPassword ? 'password' : 'text'}
                    value={values[field.key] ?? field.defaultValue}
                    onChange={(e) => onUpdate(field.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                    placeholder={field.description}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Védett mezők megjelenítése (csak olvasható) */}
      <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">Védett Beállítások</h3>
        <p className="text-sm text-yellow-800 mb-4">
          Ezek az értékek a rendszer által automatikusan kezelve vannak és nem módosíthatók.
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-yellow-900 mb-1">Port</label>
            <input
              type="number"
              value={port || ''}
              disabled
              className="w-full px-3 py-2 border border-yellow-300 rounded-lg bg-yellow-100 text-gray-600 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-yellow-900 mb-1">Query Port</label>
            <input
              type="number"
              value={queryPort || ''}
              disabled
              className="w-full px-3 py-2 border border-yellow-300 rounded-lg bg-yellow-100 text-gray-600 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-yellow-900 mb-1">Max Játékosok</label>
            <input
              type="number"
              value={maxPlayers}
              disabled
              className="w-full px-3 py-2 border border-yellow-300 rounded-lg bg-yellow-100 text-gray-600 cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Game.ini Form Component
function GameIniForm({
  values,
  onUpdate,
}: {
  values: Record<string, any>;
  onUpdate: (key: string, value: any) => void;
}) {
  const [itemOverrides, setItemOverrides] = useState<Array<{ itemClass: string; quantity: number }>>(
    values['ItemOverrides'] || []
  );

  useEffect(() => {
    if (values['ItemOverrides']) {
      setItemOverrides(values['ItemOverrides']);
    }
  }, [values]);

  const addItemOverride = () => {
    const newOverrides = [...itemOverrides, { itemClass: '', quantity: 100.0 }];
    setItemOverrides(newOverrides);
    onUpdate('ItemOverrides', newOverrides);
  };

  const removeItemOverride = (index: number) => {
    const newOverrides = itemOverrides.filter((_, i) => i !== index);
    setItemOverrides(newOverrides);
    onUpdate('ItemOverrides', newOverrides);
  };

  const updateItemOverride = (index: number, field: 'itemClass' | 'quantity', value: string | number) => {
    const newOverrides = [...itemOverrides];
    newOverrides[index] = { ...newOverrides[index], [field]: value };
    setItemOverrides(newOverrides);
    onUpdate('ItemOverrides', newOverrides);
  };

  return (
    <div className="space-y-6">
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Item Mennyiség Felülírások</h3>
        <p className="text-sm text-gray-600 mb-4">
          Itt állíthatod be az egyes tárgyak maximális mennyiségét a játékosok inventory-jában.
        </p>
        
        <div className="space-y-4">
          {itemOverrides.map((override, index) => (
            <div key={index} className="flex gap-2 items-end p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Class String
                </label>
                <input
                  type="text"
                  value={override.itemClass}
                  onChange={(e) => updateItemOverride(index, 'itemClass', e.target.value)}
                  placeholder="pl. PrimalItemResource_Amarberry_C"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                />
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mennyiség
                </label>
                <input
                  type="number"
                  value={override.quantity}
                  onChange={(e) => updateItemOverride(index, 'quantity', parseFloat(e.target.value) || 0)}
                  min={0}
                  step={0.1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                />
              </div>
              <button
                onClick={() => removeItemOverride(index)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Törlés
              </button>
            </div>
          ))}
          
          <button
            onClick={addItemOverride}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
          >
            + Új Item Felülírás Hozzáadása
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Tipp:</strong> A Game.ini fájlban további beállításokat is hozzáadhatsz, mint például dinoszaurusz statisztikák, XP szorzók, stb. 
          Használd a Szerkesztő Módot a részletesebb beállításokhoz.
        </p>
      </div>
    </div>
  );
}

