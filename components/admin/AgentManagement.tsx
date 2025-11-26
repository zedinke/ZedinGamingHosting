'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AgentStatus } from '@prisma/client';

interface Agent {
  id: string;
  agentId: string;
  version: string;
  status: AgentStatus;
  lastHeartbeat: Date | null;
  capabilities: any;
  machine: {
    id: string;
    name: string;
    ipAddress: string;
  };
  _count: {
    servers: number;
    tasks: number;
  };
}

interface Machine {
  id: string;
  name: string;
  ipAddress: string;
}

interface AgentManagementProps {
  agents: Agent[];
  machines: Machine[];
  currentPage: number;
  totalPages: number;
  locale: string;
  statusFilter?: string;
  machineFilter?: string;
}

export function AgentManagement({
  agents,
  machines,
  currentPage,
  totalPages,
  locale,
  statusFilter,
  machineFilter,
}: AgentManagementProps) {
  const getStatusBadgeColor = (status: AgentStatus) => {
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
      {/* Szűrők */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex gap-2">
          <Link
            href={`/${locale}/admin/agents`}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              !statusFilter && !machineFilter
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Összes
          </Link>
          {['ONLINE', 'OFFLINE', 'ERROR', 'UPDATING'].map((status) => (
            <Link
              key={status}
              href={`/${locale}/admin/agents?status=${status}${machineFilter ? `&machineId=${machineFilter}` : ''}`}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                statusFilter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status}
            </Link>
          ))}
        </div>
        <select
          value={machineFilter || ''}
          onChange={(e) => {
            const url = new URL(window.location.href);
            if (e.target.value) {
              url.searchParams.set('machineId', e.target.value);
            } else {
              url.searchParams.delete('machineId');
            }
            window.location.href = url.toString();
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Összes gép</option>
          {machines.map((machine) => (
            <option key={machine.id} value={machine.id}>
              {machine.name} ({machine.ipAddress})
            </option>
          ))}
        </select>
      </div>

      {/* Agentek táblázata */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-gray-700">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left p-3 font-semibold text-gray-900">Agent ID</th>
              <th className="text-left p-3 font-semibold text-gray-900">Verzió</th>
              <th className="text-left p-3 font-semibold text-gray-900">Gép</th>
              <th className="text-left p-3 font-semibold text-gray-900">Státusz</th>
              <th className="text-left p-3 font-semibold text-gray-900">Szerverek</th>
              <th className="text-left p-3 font-semibold text-gray-900">Feladatok</th>
              <th className="text-left p-3 font-semibold text-gray-900">Utolsó Heartbeat</th>
              <th className="text-left p-3 font-semibold text-gray-900">Képességek</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr key={agent.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="p-3">
                  <span className="font-mono text-sm text-gray-800">{agent.agentId}</span>
                </td>
                <td className="p-3 text-sm text-gray-700">{agent.version}</td>
                <td className="p-3">
                  <Link
                    href={`/${locale}/admin/machines/${agent.machine.id}`}
                    className="text-primary-600 hover:underline font-medium text-gray-800"
                  >
                    {agent.machine.name}
                  </Link>
                  <div className="text-xs text-gray-500 mt-1">{agent.machine.ipAddress}</div>
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(
                      agent.status
                    )}`}
                  >
                    {agent.status}
                  </span>
                </td>
                <td className="p-3 text-gray-800">{agent._count.servers}</td>
                <td className="p-3 text-gray-800">{agent._count.tasks}</td>
                <td className="p-3 text-sm text-gray-700">
                  {agent.lastHeartbeat
                    ? new Date(agent.lastHeartbeat).toLocaleString('hu-HU')
                    : '-'}
                </td>
                <td className="p-3 text-xs text-gray-600">
                  {agent.capabilities
                    ? Object.entries(agent.capabilities)
                        .filter(([_, v]) => v)
                        .map(([k]) => k)
                        .join(', ') || '-'
                    : '-'}
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
              href={`/${locale}/admin/agents?page=${currentPage - 1}${statusFilter ? `&status=${statusFilter}` : ''}${machineFilter ? `&machineId=${machineFilter}` : ''}`}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
            >
              Előző
            </Link>
          )}
          <span className="px-4 py-2 text-gray-700">
            Oldal {currentPage} / {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`/${locale}/admin/agents?page=${currentPage + 1}${statusFilter ? `&status=${statusFilter}` : ''}${machineFilter ? `&machineId=${machineFilter}` : ''}`}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
            >
              Következő
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

