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

  const handleInstallAgent = async () => {
    if (!confirm('Biztosan telepíteni szeretnéd az agentet erre a gépre?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/machines/${machine.id}/install-agent`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Hiba történt');
        return;
      }

      toast.success('Agent telepítési feladat létrehozva');
    } catch (error) {
      toast.error('Hiba történt');
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
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Alapinformációk</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-primary-600 hover:underline text-sm"
            >
              {isEditing ? 'Mégse' : 'Szerkesztés'}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Név</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SSH Port</label>
                <input
                  type="number"
                  value={formData.sshPort}
                  onChange={(e) => setFormData({ ...formData, sshPort: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SSH Felhasználó</label>
                <input
                  type="text"
                  value={formData.sshUser}
                  onChange={(e) => setFormData({ ...formData, sshUser: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SSH Kulcs Elérési Út</label>
                <input
                  type="text"
                  value={formData.sshKeyPath}
                  onChange={(e) => setFormData({ ...formData, sshKeyPath: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Státusz</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as MachineStatus })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="ONLINE">ONLINE</option>
                  <option value="OFFLINE">OFFLINE</option>
                  <option value="ERROR">ERROR</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Megjegyzések</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
              <button
                type="submit"
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
              >
                Mentés
              </button>
            </form>
          ) : (
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-gray-600">Név</dt>
                <dd className="font-medium">{machine.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">IP Cím</dt>
                <dd>{machine.ipAddress}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">SSH Kapcsolat</dt>
                <dd>{machine.sshUser}@{machine.ipAddress}:{machine.sshPort}</dd>
              </div>
              {machine.sshKeyPath && (
                <div>
                  <dt className="text-sm text-gray-600">SSH Kulcs</dt>
                  <dd className="font-mono text-sm">{machine.sshKeyPath}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-gray-600">Státusz</dt>
                <dd>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(
                      machine.status
                    )}`}
                  >
                    {machine.status}
                  </span>
                </dd>
              </div>
              {machine.agentVersion && (
                <div>
                  <dt className="text-sm text-gray-600">Agent Verzió</dt>
                  <dd>{machine.agentVersion}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-gray-600">Utolsó Heartbeat</dt>
                <dd>
                  {machine.lastHeartbeat
                    ? new Date(machine.lastHeartbeat).toLocaleString('hu-HU')
                    : 'Soha'}
                </dd>
              </div>
              {machine.notes && (
                <div>
                  <dt className="text-sm text-gray-600">Megjegyzések</dt>
                  <dd className="text-sm">{machine.notes}</dd>
                </div>
              )}
            </dl>
          )}
        </div>

        {/* Erőforrások */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Erőforrások</h2>
          {machine.resources ? (
            <div className="space-y-4">
              {machine.resources.cpu && (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">CPU</span>
                    <span className="text-sm text-gray-600">
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
                    <span className="text-sm font-medium">RAM</span>
                    <span className="text-sm text-gray-600">
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
                    <span className="text-sm font-medium">Disk</span>
                    <span className="text-sm text-gray-600">
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
            <p className="text-gray-500 text-sm">Nincs elérhető erőforrás információ</p>
          )}
        </div>
      </div>

      {/* Agentek */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Agentek ({machine.agents.length})</h2>
          {machine.agents.length === 0 && (
            <button
              onClick={handleInstallAgent}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm"
            >
              Agent Telepítés
            </button>
          )}
        </div>
        {machine.agents.length > 0 ? (
          <div className="space-y-4">
            {machine.agents.map((agent) => (
              <div key={agent.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium">{agent.agentId}</div>
                    <div className="text-sm text-gray-600">Verzió: {agent.version}</div>
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
                    <span className="text-gray-600">Szerverek:</span>{' '}
                    <span className="font-medium">{agent._count.servers}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Feladatok:</span>{' '}
                    <span className="font-medium">{agent._count.tasks}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Utolsó Heartbeat:</span>{' '}
                    <span className="font-medium">
                      {agent.lastHeartbeat
                        ? new Date(agent.lastHeartbeat).toLocaleString('hu-HU')
                        : 'Soha'}
                    </span>
                  </div>
                </div>
                {agent.capabilities && (
                  <div className="mt-2 text-sm">
                    <span className="text-gray-600">Képességek:</span>{' '}
                    <span className="font-medium">
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
          <p className="text-gray-500 text-sm">Nincs telepített agent</p>
        )}
      </div>

      {/* Szerverek */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Szerverek ({machine.servers.length})</h2>
        {machine.servers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Név</th>
                  <th className="text-left p-2">Játék</th>
                  <th className="text-left p-2">Státusz</th>
                  <th className="text-left p-2">Tulajdonos</th>
                  <th className="text-left p-2">Műveletek</th>
                </tr>
              </thead>
              <tbody>
                {machine.servers.map((server) => (
                  <tr key={server.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{server.name}</td>
                    <td className="p-2 text-sm">{server.gameType}</td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          server.status === 'ONLINE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {server.status}
                      </span>
                    </td>
                    <td className="p-2 text-sm">
                      {server.user.name || server.user.email}
                    </td>
                    <td className="p-2">
                      <a
                        href={`/${locale}/admin/servers/${server.id}`}
                        className="text-primary-600 hover:underline text-sm"
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
          <p className="text-gray-500 text-sm">Nincs hozzárendelt szerver</p>
        )}
      </div>
    </div>
  );
}

