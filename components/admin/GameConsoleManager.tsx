'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Terminal, Settings, Package } from 'lucide-react';

interface ConsoleTab {
  id: 'console' | 'config' | 'mods';
  label: string;
  icon: React.ReactNode;
}

interface GameConsoleManagerProps {
  serverId: string;
  gameType: string;
  locale: string;
}

export function GameConsoleManager({
  serverId,
  gameType,
  locale,
}: GameConsoleManagerProps) {
  const [activeTab, setActiveTab] = useState<'console' | 'config' | 'mods'>('console');
  const [loading, setLoading] = useState(false);

  const tabs: ConsoleTab[] = [
    { id: 'console', label: 'Játék Console', icon: <Terminal className="w-4 h-4" /> },
    { id: 'config', label: 'Konfiguráció', icon: <Settings className="w-4 h-4" /> },
    { id: 'mods', label: 'Modok', icon: <Package className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Tabgombok */}
      <div className="border-b border-gray-200 bg-gray-50 grid grid-cols-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-medium text-sm flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab tartalom */}
      <div className="p-6">
        {activeTab === 'console' && (
          <GameConsole serverId={serverId} gameType={gameType} locale={locale} />
        )}
        {activeTab === 'config' && (
          <ConfigFileEditor serverId={serverId} gameType={gameType} />
        )}
        {activeTab === 'mods' && gameType.includes('ARK') && (
          <ArkModManager serverId={serverId} />
        )}
        {activeTab === 'mods' && !gameType.includes('ARK') && (
          <div className="text-center py-12 text-gray-500">
            A mod menedzser csak Ark szerverekhez elérhető
          </div>
        )}
      </div>
    </div>
  );
}

// Game Console Component
function GameConsole({
  serverId,
  gameType,
  locale,
}: {
  serverId: string;
  gameType: string;
  locale: string;
}) {
  const [logs, setLogs] = useState<string[]>([]);
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConsoleLogs();
  }, []);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const loadConsoleLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/servers/${serverId}/console-stream?lines=200`);
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      setLogs(data.logs || []);
      setStreaming(data.streaming || false);
    } catch (error) {
      console.error('Error loading console logs:', error);
      toast.error('Hiba történt a konzol betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/servers/${serverId}/console-command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: command.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      toast.success('Parancs elküldve');
      setCommand('');
      
      // Frissítés a parancs után
      setTimeout(loadConsoleLogs, 500);
    } catch (error) {
      console.error('Error sending command:', error);
      toast.error('Hiba történt a parancs küldése során');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Beállítások */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded w-4 h-4"
            />
            <span className="text-sm text-gray-700">Automatikus görgetés</span>
          </label>
          {streaming && (
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full animate-pulse">
              ● Élő
            </span>
          )}
        </div>
        <button
          onClick={loadConsoleLogs}
          disabled={loading}
          className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 disabled:opacity-50 text-sm font-medium"
        >
          {loading ? 'Betöltés...' : 'Frissítés'}
        </button>
      </div>

      {/* Console output */}
      <div className="bg-gray-900 text-white font-mono text-sm p-4 rounded-lg h-96 overflow-y-auto border border-gray-700">
        {logs.length === 0 ? (
          <div className="text-gray-400">Nincs konzol kimenet</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1 text-gray-200 break-all">
              {log}
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Parancs küldése */}
      <form onSubmit={handleSendCommand} className="flex gap-2">
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder={getCommandPlaceholder(gameType)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm bg-white text-gray-900 placeholder:text-gray-400"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !command.trim()}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {loading ? 'Küldés...' : 'Küldés'}
        </button>
      </form>

      {/* Parancs segítség */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <p className="font-medium mb-1">Populáris parancsok:</p>
        <p className="font-mono text-gray-600">{getCommandExamples(gameType)}</p>
      </div>
    </div>
  );
}

// Config File Editor Component
function ConfigFileEditor({
  serverId,
  gameType,
}: {
  serverId: string;
  gameType: string;
}) {
  const [files, setFiles] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const configFiles = getConfigFiles(gameType);

  useEffect(() => {
    if (configFiles.length > 0) {
      setSelectedFile(configFiles[0].name);
      loadFile(configFiles[0].name);
    }
  }, []);

  const loadFile = async (fileName: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/servers/${serverId}/config-file?file=${encodeURIComponent(fileName)}`);
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      setContent(data.content || '');
      setFiles({ ...files, [fileName]: data.content || '' });
    } catch (error) {
      console.error('Error loading config file:', error);
      toast.error('Hiba történt a fájl betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedFile || !content) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/servers/${serverId}/config-file`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: selectedFile, content }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      toast.success('Fájl sikeresen mentve');
      setFiles({ ...files, [selectedFile]: content });
    } catch (error) {
      console.error('Error saving config file:', error);
      toast.error('Hiba történt a fájl mentése során');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* File selector */}
      <div className="flex gap-2">
        <select
          value={selectedFile}
          onChange={(e) => {
            setSelectedFile(e.target.value);
            loadFile(e.target.value);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
        >
          {configFiles.map((file) => (
            <option key={file.name} value={file.name}>
              {file.label}
            </option>
          ))}
        </select>
      </div>

      {/* Editor */}
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm text-gray-900 bg-white resize-none"
          placeholder="Konfiguráció tartalma..."
        />
      </div>

      {/* Save button */}
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => loadFile(selectedFile)}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Vissza
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !content}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
        >
          {saving ? 'Mentés...' : 'Mentés'}
        </button>
      </div>
    </div>
  );
}

// Ark Mod Manager Component
function ArkModManager({ serverId }: { serverId: string }) {
  const [mods, setMods] = useState<any[]>([]);
  const [activeMods, setActiveMods] = useState<string[]>([]);
  const [passiveMods, setPassiveMods] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMods();
  }, []);

  const loadMods = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/servers/${serverId}/mods`);
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      setMods(data.mods || []);
      setActiveMods(data.activeMods || []);
      setPassiveMods(data.passiveMods || []);
    } catch (error) {
      console.error('Error loading mods:', error);
      toast.error('Hiba történt a modok betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMods = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/servers/${serverId}/mods`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeMods, passiveMods }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      toast.success('Modok sikeresen mentve');
    } catch (error) {
      console.error('Error saving mods:', error);
      toast.error('Hiba történt a modok mentése során');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Modok betöltése...</p>
        </div>
      ) : (
        <>
          {/* Elérhető modok */}
          <div>
            <h3 className="font-bold mb-3">Elérhető Modok ({mods.length})</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {mods.map((mod: any) => (
                <div key={mod.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={activeMods.includes(mod.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setActiveMods([...activeMods, mod.id]);
                      } else {
                        setActiveMods(activeMods.filter((id) => id !== mod.id));
                      }
                    }}
                    className="w-4 h-4 rounded"
                    title="Aktív mod (-mods=)"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{mod.name}</p>
                    <p className="text-xs text-gray-500">{mod.id}</p>
                  </div>
                  {mod.version && <span className="text-xs text-gray-400">{mod.version}</span>}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">Jelöld meg az aktív modokat</p>
          </div>

          {/* Passzív modok */}
          <div>
            <h3 className="font-bold mb-3">Passzív Modok (-passivemods=)</h3>
            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <textarea
                value={passiveMods.join(',')}
                onChange={(e) =>
                  setPassiveMods(e.target.value.split(',').filter((id) => id.trim()))
                }
                placeholder="Mod ID-kat vesszővel elválasztva"
                className="w-full h-24 p-2 border border-gray-300 rounded font-mono text-sm text-gray-900 bg-white"
              />
            </div>
          </div>

          {/* Save button */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={loadMods}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Frissítés
            </button>
            <button
              onClick={handleSaveMods}
              disabled={saving}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
            >
              {saving ? 'Mentés...' : 'Modok Mentése'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Helper functions
function getCommandPlaceholder(gameType: string): string {
  switch (gameType) {
    case 'ARK_EVOLVED':
    case 'ARK_ASCENDED':
      return 'pl: admincheat GiveItemToPlayer MyPlayer 0 Recipe 1 1 true';
    case 'MINECRAFT':
      return 'pl: say Hello World';
    case 'RUST':
      return 'pl: say Hello World';
    default:
      return 'Parancs...';
  }
}

function getCommandExamples(gameType: string): string {
  switch (gameType) {
    case 'ARK_EVOLVED':
    case 'ARK_ASCENDED':
      return 'say Hello | admincheat God | admincheat Fly';
    case 'MINECRAFT':
      return 'say Hello | stop | list';
    case 'RUST':
      return 'say Hello | status';
    default:
      return 'Játéktípus specifikus parancsok...';
  }
}

function getConfigFiles(gameType: string) {
  switch (gameType) {
    case 'ARK_EVOLVED':
    case 'ARK_ASCENDED':
      return [
        { name: 'GameUserSettings.ini', label: '🎮 GameUserSettings.ini' },
        { name: 'Game.ini', label: '⚙️ Game.ini' },
      ];
    case 'MINECRAFT':
      return [{ name: 'server.properties', label: '📝 server.properties' }];
    default:
      return [];
  }
}
