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
    <div className="space-y-6">
      {/* Hozzáadás gomb és szűrők */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2 flex-wrap">
          <Link
            href={`/${locale}/admin/machines`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !statusFilter
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Összes
          </Link>
          {['ONLINE', 'OFFLINE', 'ERROR', 'MAINTENANCE'].map((status) => (
            <Link
              key={status}
              href={`/${locale}/admin/machines?status=${status}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status}
            </Link>
          ))}
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 font-medium transition-colors"
        >
          {showAddForm ? 'Mégse' : '+ Új Szerver Gép'}
        </button>
      </div>

      {/* Hozzáadás form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Új Szerver Gép Hozzáadása</h2>
          <form onSubmit={handleAddMachine} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Név *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IP Cím *</label>
                <input
                  type="text"
                  value={formData.ipAddress}
                  onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SSH Port</label>
                <input
                  type="number"
                  value={formData.sshPort}
                  onChange={(e) => setFormData({ ...formData, sshPort: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="22"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SSH Felhasználó *</label>
                <input
                  type="text"
                  value={formData.sshUser}
                  onChange={(e) => setFormData({ ...formData, sshUser: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">SSH Kulcs Elérési Út</label>
                <input
                  type="text"
                  value={formData.sshKeyPath}
                  onChange={(e) => setFormData({ ...formData, sshKeyPath: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                  placeholder="/root/.ssh/gameserver_key"
                />
                <p className="text-xs text-gray-500 mt-1">A webszerveren lévő SSH privát kulcs elérési útja</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Megjegyzések</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isAdding}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium transition-colors"
              >
                {isAdding ? 'Hozzáadás...' : 'Hozzáadás'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 font-medium transition-colors"
              >
                Mégse
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Gépek táblázata */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-gray-700">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left p-3 font-semibold text-gray-900">Név</th>
              <th className="text-left p-3 font-semibold text-gray-900">IP Cím</th>
              <th className="text-left p-3 font-semibold text-gray-900">SSH</th>
              <th className="text-left p-3 font-semibold text-gray-900">Státusz</th>
              <th className="text-left p-3 font-semibold text-gray-900">Agentek</th>
              <th className="text-left p-3 font-semibold text-gray-900">Szerverek</th>
              <th className="text-left p-3 font-semibold text-gray-900">Utolsó Heartbeat</th>
              <th className="text-left p-3 font-semibold text-gray-900">Műveletek</th>
            </tr>
          </thead>
          <tbody>
            {machines.length > 0 ? (
              machines.map((machine) => (
                <tr key={machine.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-3 font-medium text-gray-800">{machine.name}</td>
                  <td className="p-3 text-gray-900">{machine.ipAddress}</td>
                  <td className="p-3 text-sm text-gray-700 font-mono">
                    {machine.sshUser}@{machine.ipAddress}:{machine.sshPort}
                  </td>
                <td className="p-3">
                  <div className="flex flex-col gap-1">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(
                        machine.status
                      )}`}
                    >
                      {machine.status}
                    </span>
                    {machine.status === 'OFFLINE' && machine._count.agents === 0 && (
                      <span className="text-xs text-blue-600">
                        SSH rendben, agent hiányzik
                      </span>
                    )}
                  </div>
                </td>
                  <td className="p-3">
                    <div className="space-y-1">
                      {machine.agents.length > 0 ? (
                        machine.agents.map((agent) => (
                          <div key={agent.id} className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${getAgentStatusColor(
                                agent.status
                              )}`}
                            >
                              {agent.agentId.substring(0, 20)}...
                            </span>
                            <span className="text-xs text-gray-500">{agent.status}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">Nincs agent</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-gray-900 font-medium">{machine._count.servers}</td>
                  <td className="p-3 text-sm text-gray-600">
                    {machine.lastHeartbeat
                      ? new Date(machine.lastHeartbeat).toLocaleString('hu-HU')
                      : '-'}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/${locale}/admin/machines/${machine.id}`}
                        className="text-primary-600 hover:text-primary-700 hover:underline text-sm font-medium"
                      >
                        Részletek
                      </Link>
                      {machine._count.agents === 0 && (
                        <button
                          onClick={() => handleInstallAgent(machine.id)}
                          className="text-blue-600 hover:text-blue-700 hover:underline text-sm font-medium"
                        >
                          Agent telepítés
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">
                  Nincs szerver gép hozzáadva
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagináció */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          {currentPage > 1 && (
            <Link
              href={`/${locale}/admin/machines?page=${currentPage - 1}${statusFilter ? `&status=${statusFilter}` : ''}`}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors"
            >
              Előző
            </Link>
          )}
          <span className="px-4 py-2 text-gray-700">
            Oldal <span className="font-semibold">{currentPage}</span> / <span className="font-semibold">{totalPages}</span>
          </span>
          {currentPage < totalPages && (
            <Link
              href={`/${locale}/admin/machines?page=${currentPage + 1}${statusFilter ? `&status=${statusFilter}` : ''}`}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors"
            >
              Következő
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

