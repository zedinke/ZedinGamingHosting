'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Terminal, Settings, Package, RefreshCw, Pause, Play, Save, Download } from 'lucide-react';

interface UserGameConsoleManagerProps {
  serverId: string;
  gameType?: string;
}

interface ConfigFile {
  name: string;
  label: string;
}

interface Mod {
  id: string;
  name: string;
  category: string;
}

export function UserGameConsoleManager({ serverId, gameType }: UserGameConsoleManagerProps) {
  const [activeTab, setActiveTab] = useState<'console' | 'config' | 'mods'>('console');
  const [loading, setLoading] = useState(false);
  
  // Console state
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [command, setCommand] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Config state
  const [selectedFile, setSelectedFile] = useState<string>('GameUserSettings.ini');
  const [fileContent, setFileContent] = useState('');
  const [fileSaving, setFileSaving] = useState(false);

  // Mods state
  const [mods, setMods] = useState<Mod[]>([]);
  const [activeMods, setActiveMods] = useState<string[]>([]);
  const [passiveMods, setPassiveMods] = useState<string[]>([]);
  const [modsSaving, setModsSaving] = useState(false);

  // ARK szerverek specifikus config fájlok
  const isARK = gameType?.includes('ARK');
  
  const getConfigFiles = (): ConfigFile[] => {
    if (isARK) {
      return [
        { name: 'GameUserSettings.ini', label: 'GameUserSettings.ini (Egyedi beállítások)' },
        { name: 'Game.ini', label: 'Game.ini (Szerver beállítások)' },
      ];
    }
    return [
      { name: 'GameUserSettings.ini', label: 'GameUserSettings.ini' },
      { name: 'Game.ini', label: 'Game.ini' },
      { name: 'server.properties', label: 'Server Properties' },
    ];
  };
  
  const configFiles = getConfigFiles();

  const tabs = [
    { id: 'console', label: 'Játék Console', icon: <Terminal className="w-4 h-4" /> },
    { id: 'config', label: 'Konfiguráció', icon: <Settings className="w-4 h-4" /> },
    { id: 'mods', label: 'Modok', icon: <Package className="w-4 h-4" /> },
  ] as const;

  // Console frissítés
  const refreshConsole = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/servers/${serverId}/console-stream?lines=200`);
      if (!response.ok) throw new Error('Console read failed');
      
      const data = await response.json();
      setConsoleOutput(data.logs || []);
    } catch (error) {
      toast.error('Console frissítés hiba');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Config fájl betöltése
  const loadConfigFile = async (fileName: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/servers/${serverId}/config-file?file=${fileName}`);
      if (!response.ok) throw new Error('Config read failed');
      
      const data = await response.json();
      setFileContent(data.content || '');
      toast.success('Fájl betöltve');
    } catch (error) {
      toast.error('Fájl betöltés hiba');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Config fájl mentése
  const saveConfigFile = async () => {
    if (!fileContent.trim()) {
      toast.error('A fájl tartalma nem lehet üres');
      return;
    }

    setFileSaving(true);
    try {
      const response = await fetch(`/api/servers/${serverId}/config-file`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: selectedFile, content: fileContent }),
      });

      if (!response.ok) throw new Error('Save failed');
      
      toast.success('Fájl sikeresen mentve');
    } catch (error) {
      toast.error('Fájl mentés hiba');
      console.error(error);
    } finally {
      setFileSaving(false);
    }
  };

  // Modok betöltése
  const loadMods = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/servers/${serverId}/mods`);
      if (!response.ok) throw new Error('Mods fetch failed');
      
      const data = await response.json();
      setMods(data.mods || []);
      setActiveMods(data.activeMods || []);
      setPassiveMods(data.passiveMods || []);
    } catch (error) {
      toast.error('Modok betöltés hiba');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Modok mentése
  const saveMods = async () => {
    setModsSaving(true);
    try {
      const response = await fetch(`/api/servers/${serverId}/mods`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeMods, passiveMods }),
      });

      if (!response.ok) throw new Error('Save failed');
      
      toast.success('Modok sikeresen mentve');
    } catch (error) {
      toast.error('Modok mentés hiba');
      console.error(error);
    } finally {
      setModsSaving(false);
    }
  };

  // Mod toggle
  const toggleActiveMod = (modId: string) => {
    setActiveMods(prev =>
      prev.includes(modId)
        ? prev.filter(id => id !== modId)
        : [...prev, modId]
    );
  };

  const togglePassiveMod = (modId: string) => {
    setPassiveMods(prev =>
      prev.includes(modId)
        ? prev.filter(id => id !== modId)
        : [...prev, modId]
    );
  };

  // Auto-scroll a konzolhoz
  useEffect(() => {
    if (autoScroll && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleOutput, autoScroll]);

  // Config fájl betöltése tab váltáskor
  useEffect(() => {
    if (activeTab === 'config') {
      loadConfigFile(selectedFile);
    }
  }, [activeTab, selectedFile]);

  // Modok betöltése tab váltáskor
  useEffect(() => {
    if (activeTab === 'mods') {
      loadMods();
    }
  }, [activeTab]);

  // Parancs küldése
  const sendCommand = async () => {
    if (!command.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/servers/${serverId}/console-command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });

      if (!response.ok) throw new Error('Command failed');
      
      toast.success('Parancs elküldve');
      setCommand('');
      
      // Konzol frissítése
      setTimeout(refreshConsole, 500);
    } catch (error) {
      toast.error('Parancs küldési hiba');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Console tab
  const renderConsoleTab = () => (
    <div className="space-y-4">
      <div className="bg-gray-900 text-green-400 font-mono p-4 rounded-lg h-96 overflow-y-auto border border-gray-700">
        {consoleOutput.length === 0 ? (
          <div className="text-gray-500">Konzol üres...</div>
        ) : (
          consoleOutput.map((line, idx) => (
            <div key={idx} className="text-sm break-words">
              {line}
            </div>
          ))
        )}
        <div ref={consoleEndRef} />
      </div>

      <div className="flex gap-2">
        <button
          onClick={refreshConsole}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          <RefreshCw className="w-4 h-4" />
          Frissítés
        </button>
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
            autoScroll 
              ? 'bg-primary-600 text-white border-primary-700' 
              : 'border-gray-300 text-gray-700 hover:bg-gray-100'
          }`}
        >
          {autoScroll ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          {autoScroll ? 'Auto' : 'Szünet'}
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendCommand()}
          placeholder="Parancs írása..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
          disabled={loading}
        />
        <button
          onClick={sendCommand}
          disabled={loading || !command.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Küldés
        </button>
      </div>
    </div>
  );

  // Config tab
  const renderConfigTab = () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <select
          value={selectedFile}
          onChange={(e) => setSelectedFile(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
        >
          {configFiles.map(file => (
            <option key={file.name} value={file.name}>
              {file.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => loadConfigFile(selectedFile)}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Újratöltés
        </button>
      </div>

      <textarea
        value={fileContent}
        onChange={(e) => setFileContent(e.target.value)}
        placeholder="Fájl tartalma..."
        className="w-full h-96 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
      />

      <button
        onClick={saveConfigFile}
        disabled={fileSaving || !fileContent.trim()}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        {fileSaving ? 'Mentés...' : 'Mentés'}
      </button>
    </div>
  );

  // Mods tab
  const renderModsTab = () => (
    <div className="space-y-4">
      {mods.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          Nincsenek elérhető modok vagy az ARK szerver nem támogatott.
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Aktív modok */}
            <div>
              <h3 className="font-semibold mb-2 text-green-600">Aktív Modok</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto border border-green-300 rounded-lg p-3">
                {mods.filter(m => activeMods.includes(m.id)).map(mod => (
                  <div key={mod.id} className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
                    <input
                      type="checkbox"
                      checked={true}
                      onChange={() => toggleActiveMod(mod.id)}
                      className="w-4 h-4 rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{mod.name}</div>
                      <div className="text-xs text-gray-500">{mod.category}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Passzív modok */}
            <div>
              <h3 className="font-semibold mb-2 text-blue-600">Passzív Modok</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto border border-blue-300 rounded-lg p-3">
                {mods.filter(m => passiveMods.includes(m.id)).map(mod => (
                  <div key={mod.id} className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-200">
                    <input
                      type="checkbox"
                      checked={true}
                      onChange={() => togglePassiveMod(mod.id)}
                      className="w-4 h-4 rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{mod.name}</div>
                      <div className="text-xs text-gray-500">{mod.category}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Elérhető modok */}
          <div>
            <h3 className="font-semibold mb-2">Elérhető Modok</h3>
            <div className="grid md:grid-cols-2 gap-2 max-h-96 overflow-y-auto border border-gray-300 rounded-lg p-3">
              {mods.filter(m => !activeMods.includes(m.id) && !passiveMods.includes(m.id)).map(mod => (
                <div key={mod.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded border border-gray-200">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{mod.name}</div>
                    <div className="text-xs text-gray-500">{mod.category}</div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleActiveMod(mod.id)}
                      title="Aktív"
                      className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => togglePassiveMod(mod.id)}
                      title="Passzív"
                      className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                      ○
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={saveMods}
            disabled={modsSaving}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {modsSaving ? 'Mentés...' : 'Modok Mentése'}
          </button>
        </>
      )}
    </div>
  );

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
        {activeTab === 'console' && renderConsoleTab()}
        {activeTab === 'config' && renderConfigTab()}
        {activeTab === 'mods' && renderModsTab()}
      </div>
    </div>
  );
}
