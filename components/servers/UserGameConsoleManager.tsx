'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Terminal, Settings, Package, Copy, RefreshCw, Pause, Play } from 'lucide-react';
import { GameConsoleManager } from '@/components/admin/GameConsoleManager';

interface UserGameConsoleManagerProps {
  serverId: string;
}

export function UserGameConsoleManager({ serverId }: UserGameConsoleManagerProps) {
  // Felhasználó verzió: Közvetlenül az admin komponenst használjuk felhasználó API-kkal
  // De az admin komponens `/api/admin/servers/...` url-okat hívja, melyek adminnak kell
  // Ezért készítünk egy wrapper komponenst mely felhasználó API-kat hívja

  const [activeTab, setActiveTab] = useState<'console' | 'config' | 'mods'>('console');
  const [loading, setLoading] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [command, setCommand] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const consoleEndRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll a konzolhoz
  useEffect(() => {
    if (autoScroll && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleOutput, autoScroll]);

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
        {activeTab === 'config' && (
          <div className="text-center py-8 text-gray-600">
            Konfigurációs szerkesztés hamarosan elérhető...
          </div>
        )}
        {activeTab === 'mods' && (
          <div className="text-center py-8 text-gray-600">
            Modok szerkesztése hamarosan elérhető...
          </div>
        )}
      </div>
    </div>
  );
}
