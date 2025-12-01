'use client';

import { useState, useEffect } from 'react';
import { GameType, ServerStatus } from '@prisma/client';
import toast from 'react-hot-toast';
import { Search, FileText, X, Download } from 'lucide-react';

interface Server {
  id: string;
  name: string;
  gameType: GameType;
  status: ServerStatus;
  user: {
    email: string;
    name: string | null;
  };
  createdAt: Date;
}

interface InstallLogData {
  status: string;
  message: string;
  progress: number;
  log: string;
  error: string | null;
  currentStep?: string;
  totalSteps?: number;
}

interface InstallLogsViewerProps {
  locale: string;
  servers: Server[];
}

export function InstallLogsViewer({ locale, servers: initialServers }: InstallLogsViewerProps) {
  const [servers] = useState<Server[]>(initialServers);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [logData, setLogData] = useState<InstallLogData | null>(null);
  const [loadingLog, setLoadingLog] = useState(false);

  const loadInstallLog = async (serverId: string) => {
    setLoadingLog(true);
    try {
      const response = await fetch(`/api/admin/servers/${serverId}/install-progress`);
      const data = await response.json();
      
      if (response.ok) {
        setLogData(data);
      } else {
        toast.error(data.error || 'Hiba történt a log betöltése során');
        setLogData(null);
      }
    } catch (error) {
      toast.error('Hiba történt a log betöltése során');
      setLogData(null);
    } finally {
      setLoadingLog(false);
    }
  };

  const handleServerSelect = (server: Server) => {
    setSelectedServer(server);
    loadInstallLog(server.id);
  };

  const getGameTypeLabel = (gameType: GameType) => {
    const labels: Partial<Record<GameType, string>> = {
      ARK_EVOLVED: 'ARK: Survival Evolved',
      ARK_ASCENDED: 'ARK: Survival Ascended',
      MINECRAFT: 'Minecraft',
      RUST: 'Rust',
      VALHEIM: 'Valheim',
      SEVEN_DAYS_TO_DIE: '7 Days to Die',
      CONAN_EXILES: 'Conan Exiles',
      DAYZ: 'DayZ',
      PROJECT_ZOMBOID: 'Project Zomboid',
      PALWORLD: 'Palworld',
      ENSHROUDED: 'Enshrouded',
      SONS_OF_THE_FOREST: 'Sons of the Forest',
      THE_FOREST: 'The Forest',
      GROUNDED: 'Grounded',
      V_RISING: 'V Rising',
      DONT_STARVE_TOGETHER: "Don't Starve Together",
      SATISFACTORY: 'Satisfactory',
      CS2: 'Counter-Strike 2',
      CSGO: 'Counter-Strike: Global Offensive',
      TERRARIA: 'Terraria',
      OTHER: 'Egyéb',
    };
    return labels[gameType] || gameType;
  };

  const getStatusBadgeColor = (status: ServerStatus) => {
    switch (status) {
      case 'ONLINE':
        return 'bg-green-100 text-green-800';
      case 'OFFLINE':
        return 'bg-gray-100 text-gray-800';
      case 'STARTING':
        return 'bg-yellow-100 text-yellow-800';
      case 'STOPPING':
        return 'bg-orange-100 text-orange-800';
      case 'RESTARTING':
        return 'bg-blue-100 text-blue-800';
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLogStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'in_progress':
      case 'starting':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const filteredServers = servers.filter((server) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      server.name.toLowerCase().includes(searchLower) ||
      server.user.email.toLowerCase().includes(searchLower) ||
      (server.user.name && server.user.name.toLowerCase().includes(searchLower)) ||
      getGameTypeLabel(server.gameType).toLowerCase().includes(searchLower)
    );
  });

  const downloadLog = () => {
    if (!logData || !selectedServer) return;
    
    const blob = new Blob([logData.log || 'Nincs log tartalom'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `install-log-${selectedServer.id}-${selectedServer.name.replace(/[^a-z0-9]/gi, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Telepítési Logok</h1>
            <p className="text-gray-600 mt-1">Szerverek telepítési logjainak megtekintése</p>
          </div>
        </div>

        {/* Keresés */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Keresés szerver név, email vagy játék alapján..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Szerverek lista */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Szerverek ({filteredServers.length})
            </h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredServers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nincs találat</div>
              ) : (
                filteredServers.map((server) => (
                  <button
                    key={server.id}
                    onClick={() => handleServerSelect(server)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      selectedServer?.id === server.id
                        ? 'border-primary-500 bg-primary-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">{server.name}</div>
                        <div className="text-sm text-gray-600 mb-2">
                          {getGameTypeLabel(server.gameType)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {server.user.name || server.user.email}
                        </div>
                      </div>
                      <div className="ml-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(
                            server.status
                          )}`}
                        >
                          {server.status}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Log megjelenítés */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedServer ? `Telepítési Log: ${selectedServer.name}` : 'Válassz egy szervert'}
              </h2>
              {selectedServer && logData && (
                <button
                  onClick={downloadLog}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Letöltés
                </button>
              )}
            </div>

            {selectedServer ? (
              <div className="bg-black rounded-lg p-4 min-h-[600px] max-h-[600px] overflow-y-auto">
                {loadingLog ? (
                  <div className="text-white text-center py-8">Log betöltése...</div>
                ) : logData ? (
                  <div className="space-y-4">
                    {/* Progress információk */}
                    {logData.status && (
                      <div className="border-b border-gray-700 pb-3 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`font-semibold ${getLogStatusColor(logData.status)}`}>
                            Státusz: {logData.status.toUpperCase()}
                          </span>
                        </div>
                        {logData.message && (
                          <div className="text-gray-300 text-sm mb-2">{logData.message}</div>
                        )}
                        {logData.progress !== undefined && (
                          <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                logData.status === 'error' ? 'bg-red-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${logData.progress}%` }}
                            />
                          </div>
                        )}
                        {logData.currentStep && logData.totalSteps && (
                          <div className="text-gray-400 text-xs">
                            Lépés: {logData.currentStep} / {logData.totalSteps}
                          </div>
                        )}
                        {logData.error && (
                          <div className="text-red-400 text-sm mt-2 font-semibold">
                            HIBA: {logData.error}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Teljes log */}
                    <div className="text-white font-mono text-xs whitespace-pre-wrap break-words">
                      {logData.log || 'Nincs log tartalom'}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400 text-center py-8">
                    Nincs telepítési log elérhető ehhez a szerverhez
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-200 rounded-lg p-8 text-center text-gray-500 min-h-[600px] flex items-center justify-center">
                <div>
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Válassz ki egy szervert a bal oldali listából</p>
                  <p className="text-sm mt-2">a telepítési log megtekintéséhez</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

