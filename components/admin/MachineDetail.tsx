'use client';

import { useState } from 'react';
import { MachineStatus, AgentStatus } from '@prisma/client';
import toast from 'react-hot-toast';

interface Machine {
  id: string;
  name: string;
  ipAddress: string;
  sshPort: number;
  sshUser: string;
  sshKeyPath: string | null;
  status: MachineStatus;
  agentVersion: string | null;
  lastHeartbeat: Date | null;
  resources: any;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  agents: Array<{
    id: string;
    agentId: string;
    version: string;
    status: AgentStatus;
    lastHeartbeat: Date | null;
    capabilities: any;
    _count: {
      servers: number;
      tasks: number;
    };
  }>;
  servers: Array<{
    id: string;
    name: string;
    gameType: string;
    status: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
}

interface MachineDetailProps {
  machine: Machine;
  locale: string;
}

export function MachineDetail({ machine, locale }: MachineDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isInstallingAgent, setIsInstallingAgent] = useState(false);
  const [isReinstallingAgent, setIsReinstallingAgent] = useState(false);
  const [isTestingSSH, setIsTestingSSH] = useState(false);
  const [formData, setFormData] = useState({
    name: machine.name,
    sshPort: machine.sshPort.toString(),
    sshUser: machine.sshUser,
    sshKeyPath: machine.sshKeyPath || '',
    notes: machine.notes || '',
    status: machine.status,
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/admin/machines/${machine.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sshPort: parseInt(formData.sshPort),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Hiba történt');
        return;
      }

      toast.success('Szerver gép sikeresen frissítve');
      setIsEditing(false);
      window.location.reload();
    } catch (error) {
      toast.error('Hiba történt');
    }
  };

  const handleReinstallAgent = async () => {
    if (!confirm('Biztosan újratelepíted az agentet erre a gépre? Ez törli a meglévő agentet és minden könyvtárat root tulajdonba helyezi. Ez néhány percig eltarthat.')) {
      return;
    }

    setIsReinstallingAgent(true);

    try {
      const response = await fetch(`/api/admin/machines/${machine.id}/reinstall-agent`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Hiba történt');
        return;
      }

      toast.success(result.message || 'Agent sikeresen újratelepítve');
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      toast.error('Hiba történt');
    } finally {
      setIsReinstallingAgent(false);
    }
  };

  const handleInstallAgent = async () => {
    if (!confirm('Biztosan telepíteni szeretnéd az agentet erre a gépre?')) {
      return;
    }

    setIsInstallingAgent(true);

    try {
      console.log('Agent telepítés indítása...', machine.id);
      
      const response = await fetch(`/api/admin/machines/${machine.id}/install-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      const result = await response.json();
      console.log('Response result:', result);

      if (!response.ok) {
        console.error('Agent telepítési hiba:', result);
        toast.error(result.error || 'Hiba történt az agent telepítése során');
        return;
      }

      toast.success('Agent telepítési feladat elindítva. A telepítés háttérben folyik...');
      
      // Oldal frissítése 3 másodperc után, hogy lássuk az új agentet
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error) {
      console.error('Agent telepítési hiba:', error);
      toast.error('Hiba történt az agent telepítése során. Ellenőrizd a konzolt a részletekért.');
    } finally {
      setIsInstallingAgent(false);
    }
  };

  const handleTestSSH = async () => {
    setIsTestingSSH(true);

    try {
      const response = await fetch(`/api/admin/machines/${machine.id}/test-ssh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'SSH kapcsolat sikertelen');
        return;
      }

      toast.success('SSH kapcsolat sikeres');
    } catch (error) {
      console.error('SSH tesztelési hiba:', error);
      toast.error('Hiba történt az SSH tesztelése során');
    } finally {
      setIsTestingSSH(false);
    }
  };

  const getStatusBadgeColor = (status: MachineStatus) => {
    switch (status) {
      case 'ONLINE':
        return 'bg-green-100 text-green-800';
      case 'OFFLINE':
        return 'bg-gray-100 text-gray-800';
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAgentStatusColor = (status: AgentStatus) => {
    switch (status) {
      case 'ONLINE':
        return 'bg-green-100 text-green-800';
      case 'OFFLINE':
        return 'bg-gray-100 text-gray-800';
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      case 'UPDATING':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Alapinformációk */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Alapinformációk</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-primary-600 hover:text-primary-700 hover:underline text-sm font-medium"
            >
              {isEditing ? 'Mégse' : 'Szerkesztés'}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Név</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SSH Port</label>
                <input
                  type="number"
                  value={formData.sshPort}
                  onChange={(e) => setFormData({ ...formData, sshPort: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SSH Felhasználó</label>
                <input
                  type="text"
                  value={formData.sshUser}
                  onChange={(e) => setFormData({ ...formData, sshUser: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SSH Kulcs Elérési Út</label>
                <input
                  type="text"
                  value={formData.sshKeyPath}
                  onChange={(e) => setFormData({ ...formData, sshKeyPath: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Státusz</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as MachineStatus })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                >
                  <option value="ONLINE">ONLINE</option>
                  <option value="OFFLINE">OFFLINE</option>
                  <option value="ERROR">ERROR</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Megjegyzések</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-400"
                  rows={3}
                />
              </div>
              <button
                type="submit"
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 font-medium transition-colors"
              >
                Mentés
              </button>
            </form>
          ) : (
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-700 mb-1">Név</dt>
                <dd className="font-semibold text-gray-900">{machine.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-700 mb-1">IP Cím</dt>
                <dd className="text-gray-900">{machine.ipAddress}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-700 mb-1">SSH Kapcsolat</dt>
                <dd className="text-gray-900 font-mono text-sm">{machine.sshUser}@{machine.ipAddress}:{machine.sshPort}</dd>
              </div>
              {machine.sshKeyPath && (
                <div>
                  <dt className="text-sm font-medium text-gray-700 mb-1">SSH Kulcs</dt>
                  <dd className="font-mono text-sm text-gray-900 break-all">{machine.sshKeyPath}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-700 mb-1">Státusz</dt>
                <dd className="space-y-1">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(
                      machine.status
                    )}`}
                  >
                    {machine.status}
                  </span>
                  {machine.status === 'OFFLINE' && machine.agents.length === 0 && (
                    <div className="text-xs text-blue-700 font-medium mt-1">
                      ℹ️ SSH kapcsolat rendben, agent telepítés szükséges
                    </div>
                  )}
                </dd>
              </div>
              {machine.agentVersion && (
                <div>
                  <dt className="text-sm font-medium text-gray-700 mb-1">Agent Verzió</dt>
                  <dd className="text-gray-900">{machine.agentVersion}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-700 mb-1">Utolsó Heartbeat</dt>
                <dd className="text-gray-900">
                  {machine.lastHeartbeat
                    ? new Date(machine.lastHeartbeat).toLocaleString('hu-HU')
                    : 'Soha'}
                </dd>
              </div>
              {machine.notes && (
                <div>
                  <dt className="text-sm font-medium text-gray-700 mb-1">Megjegyzések</dt>
                  <dd className="text-sm text-gray-800">{machine.notes}</dd>
                </div>
              )}
            </dl>
          )}
        </div>

        {/* Műveletek */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Műveletek</h2>
          <div className="space-y-3">
            <button
              onClick={handleTestSSH}
              disabled={isTestingSSH}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTestingSSH ? 'Tesztelés...' : 'SSH Kapcsolat Tesztelése'}
            </button>
            {machine.agents.length === 0 && (
              <button
                onClick={handleInstallAgent}
                disabled={isInstallingAgent}
                className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isInstallingAgent ? 'Telepítés...' : 'Agent Telepítés'}
              </button>
            )}
          </div>
        </div>

        {/* Erőforrások */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:col-span-2">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Erőforrások</h2>
          {machine.resources ? (
            <div className="space-y-4">
              {machine.resources.cpu && (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">CPU</span>
                    <span className="text-sm text-gray-700">
                      {machine.resources.cpu.usage}% / {machine.resources.cpu.cores} core
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${machine.resources.cpu.usage}%` }}
                    />
                  </div>
                </div>
              )}
              {machine.resources.ram && (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">RAM</span>
                    <span className="text-sm text-gray-700">
                      {Math.round(machine.resources.ram.used / 1024 / 1024 / 1024)} GB /{' '}
                      {Math.round(machine.resources.ram.total / 1024 / 1024 / 1024)} GB
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{
                        width: `${(machine.resources.ram.used / machine.resources.ram.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
              {machine.resources.disk && (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Disk</span>
                    <span className="text-sm text-gray-700">
                      {Math.round(machine.resources.disk.used / 1024 / 1024 / 1024)} GB /{' '}
                      {Math.round(machine.resources.disk.total / 1024 / 1024 / 1024)} GB
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{
                        width: `${(machine.resources.disk.used / machine.resources.disk.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-600 text-sm">Nincs elérhető erőforrás információ</p>
          )}
        </div>
      </div>

      {/* Agentek */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Agentek ({machine.agents.length})</h2>
          {machine.agents.length === 0 && (
            <button
              onClick={handleInstallAgent}
              disabled={isInstallingAgent}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isInstallingAgent ? 'Telepítés...' : 'Agent Telepítés'}
            </button>
          )}
          {machine.agents.length > 0 && (
            <button
              onClick={handleReinstallAgent}
              disabled={isReinstallingAgent}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ml-2"
            >
              {isReinstallingAgent ? 'Újratelepítés...' : 'Agent Újratelepítése (Root)'}
            </button>
          )}
        </div>
        {machine.agents.length > 0 ? (
          <div className="space-y-4">
            {machine.agents.map((agent) => (
              <div key={agent.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium text-gray-900">{agent.agentId}</div>
                    <div className="text-sm text-gray-700">Verzió: {agent.version}</div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${getAgentStatusColor(
                      agent.status
                    )}`}
                  >
                    {agent.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                  <div>
                    <span className="text-gray-700 font-medium">Szerverek:</span>{' '}
                    <span className="font-semibold text-gray-900">{agent._count.servers}</span>
                  </div>
                  <div>
                    <span className="text-gray-700 font-medium">Feladatok:</span>{' '}
                    <span className="font-semibold text-gray-900">{agent._count.tasks}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-700 font-medium">Utolsó Heartbeat:</span>{' '}
                    <span className="font-semibold text-gray-900">
                      {agent.lastHeartbeat
                        ? new Date(agent.lastHeartbeat).toLocaleString('hu-HU')
                        : 'Soha'}
                    </span>
                  </div>
                </div>
                {agent.capabilities && (
                  <div className="mt-2 text-sm">
                    <span className="text-gray-700 font-medium">Képességek:</span>{' '}
                    <span className="font-semibold text-gray-900">
                      {Object.entries(agent.capabilities)
                        .filter(([_, v]) => v)
                        .map(([k]) => k)
                        .join(', ')}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-sm">Nincs telepített agent</p>
        )}
      </div>

      {/* Szerverek */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Szerverek ({machine.servers.length})</h2>
        {machine.servers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left p-3 font-semibold text-gray-900">Név</th>
                  <th className="text-left p-3 font-semibold text-gray-900">Játék</th>
                  <th className="text-left p-3 font-semibold text-gray-900">Státusz</th>
                  <th className="text-left p-3 font-semibold text-gray-900">Tulajdonos</th>
                  <th className="text-left p-3 font-semibold text-gray-900">Műveletek</th>
                </tr>
              </thead>
              <tbody>
                {machine.servers.map((server) => (
                  <tr key={server.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-medium text-gray-900">{server.name}</td>
                    <td className="p-3 text-sm text-gray-800">{server.gameType}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          server.status === 'ONLINE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {server.status}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-800">
                      {server.user.name || server.user.email}
                    </td>
                    <td className="p-3">
                      <a
                        href={`/${locale}/admin/servers/${server.id}`}
                        className="text-primary-600 hover:underline text-sm font-medium"
                      >
                        Részletek
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600 text-sm">Nincs hozzárendelt szerver</p>
        )}
      </div>
    </div>
  );
}

