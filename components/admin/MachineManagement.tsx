'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MachineStatus, AgentStatus } from '@prisma/client';
import toast from 'react-hot-toast';

interface Machine {
  id: string;
  name: string;
  ipAddress: string;
  sshPort: number;
  sshUser: string;
  status: MachineStatus;
  lastHeartbeat: Date | null;
  agents: Array<{
    id: string;
    agentId: string;
    status: AgentStatus;
    lastHeartbeat: Date | null;
  }>;
  _count: {
    agents: number;
    servers: number;
  };
}

interface MachineManagementProps {
  machines: Machine[];
  currentPage: number;
  totalPages: number;
  locale: string;
  statusFilter?: string;
}

export function MachineManagement({
  machines,
  currentPage,
  totalPages,
  locale,
  statusFilter,
}: MachineManagementProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    ipAddress: '',
    sshPort: '22',
    sshUser: '',
    sshKeyPath: '',
    notes: '',
  });

  const handleAddMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);

    try {
      const response = await fetch('/api/admin/machines', {
        method: 'POST',
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

      toast.success('Szerver gép sikeresen hozzáadva');
      setShowAddForm(false);
      setFormData({
        name: '',
        ipAddress: '',
        sshPort: '22',
        sshUser: '',
        sshKeyPath: '',
        notes: '',
      });
      window.location.reload();
    } catch (error) {
      toast.error('Hiba történt');
    } finally {
      setIsAdding(false);
    }
  };

  const handleInstallAgent = async (machineId: string) => {
    if (!confirm('Biztosan telepíteni szeretnéd az agentet erre a gépre?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/machines/${machineId}/install-agent`, {
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
    <div className="space-y-4">
      {/* Hozzáadás gomb */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Link
            href={`/${locale}/admin/machines`}
            className={`px-4 py-2 rounded-lg text-sm ${
              !statusFilter
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Összes
          </Link>
          {['ONLINE', 'OFFLINE', 'ERROR', 'MAINTENANCE'].map((status) => (
            <Link
              key={status}
              href={`/${locale}/admin/machines?status=${status}`}
              className={`px-4 py-2 rounded-lg text-sm ${
                statusFilter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status}
            </Link>
          ))}
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          {showAddForm ? 'Mégse' : '+ Új Szerver Gép'}
        </button>
      </div>

      {/* Hozzáadás form */}
      {showAddForm && (
        <div className="card p-6">
          <h2 className="text-xl font-bold mb-4">Új Szerver Gép Hozzáadása</h2>
          <form onSubmit={handleAddMachine} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Név *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">IP Cím *</label>
                <input
                  type="text"
                  value={formData.ipAddress}
                  onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SSH Port</label>
                <input
                  type="number"
                  value={formData.sshPort}
                  onChange={(e) => setFormData({ ...formData, sshPort: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="22"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SSH Felhasználó *</label>
                <input
                  type="text"
                  value={formData.sshUser}
                  onChange={(e) => setFormData({ ...formData, sshUser: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SSH Kulcs Elérési Út</label>
                <input
                  type="text"
                  value={formData.sshKeyPath}
                  onChange={(e) => setFormData({ ...formData, sshKeyPath: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="/path/to/ssh/key"
                />
              </div>
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
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isAdding}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {isAdding ? 'Hozzáadás...' : 'Hozzáadás'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
              >
                Mégse
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Gépek táblázata */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">Név</th>
              <th className="text-left p-3">IP Cím</th>
              <th className="text-left p-3">SSH</th>
              <th className="text-left p-3">Státusz</th>
              <th className="text-left p-3">Agentek</th>
              <th className="text-left p-3">Szerverek</th>
              <th className="text-left p-3">Utolsó Heartbeat</th>
              <th className="text-left p-3">Műveletek</th>
            </tr>
          </thead>
          <tbody>
            {machines.map((machine) => (
              <tr key={machine.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{machine.name}</td>
                <td className="p-3">{machine.ipAddress}</td>
                <td className="p-3 text-sm">
                  {machine.sshUser}@{machine.ipAddress}:{machine.sshPort}
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(
                      machine.status
                    )}`}
                  >
                    {machine.status}
                  </span>
                </td>
                <td className="p-3">
                  <div className="space-y-1">
                    {machine.agents.length > 0 ? (
                      machine.agents.map((agent) => (
                        <div key={agent.id} className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${getAgentStatusColor(
                              agent.status
                            )}`}
                          >
                            {agent.agentId}
                          </span>
                          <span className="text-xs text-gray-500">{agent.status}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-400 text-sm">Nincs agent</span>
                    )}
                  </div>
                </td>
                <td className="p-3">{machine._count.servers}</td>
                <td className="p-3 text-sm text-gray-600">
                  {machine.lastHeartbeat
                    ? new Date(machine.lastHeartbeat).toLocaleString('hu-HU')
                    : '-'}
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Link
                      href={`/${locale}/admin/machines/${machine.id}`}
                      className="text-primary-600 hover:underline text-sm"
                    >
                      Részletek
                    </Link>
                    {machine._count.agents === 0 && (
                      <button
                        onClick={() => handleInstallAgent(machine.id)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Agent telepítés
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagináció */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {currentPage > 1 && (
            <Link
              href={`/${locale}/admin/machines?page=${currentPage - 1}${statusFilter ? `&status=${statusFilter}` : ''}`}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Előző
            </Link>
          )}
          <span className="px-4 py-2">
            Oldal {currentPage} / {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`/${locale}/admin/machines?page=${currentPage + 1}${statusFilter ? `&status=${statusFilter}` : ''}`}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Következő
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

