'use client';

import Link from 'next/link';
import { TaskStatus, TaskType } from '@prisma/client';

interface Task {
  id: string;
  type: TaskType;
  status: TaskStatus;
  command: any;
  result: any;
  error: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  agent: {
    id: string;
    agentId: string;
    machine: {
      id: string;
      name: string;
      ipAddress: string;
    };
  } | null;
  server: {
    id: string;
    name: string;
    gameType: string;
  } | null;
}

interface TaskManagementProps {
  tasks: Task[];
  currentPage: number;
  totalPages: number;
  locale: string;
  statusFilter?: string;
  typeFilter?: string;
}

export function TaskManagement({
  tasks,
  currentPage,
  totalPages,
  locale,
  statusFilter,
  typeFilter,
}: TaskManagementProps) {
  const getStatusBadgeColor = (status: TaskStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'RUNNING':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: TaskType) => {
    const labels: Record<TaskType, string> = {
      PROVISION: 'Telepítés',
      START: 'Indítás',
      STOP: 'Leállítás',
      RESTART: 'Újraindítás',
      UPDATE: 'Frissítés',
      BACKUP: 'Backup',
      DELETE: 'Törlés',
      INSTALL_AGENT: 'Agent Telepítés',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-4">
      {/* Szűrők */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex gap-2">
          <Link
            href={`/${locale}/admin/tasks`}
            className={`px-4 py-2 rounded-lg text-sm ${
              !statusFilter && !typeFilter
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Összes
          </Link>
          {['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'].map((status) => (
            <Link
              key={status}
              href={`/${locale}/admin/tasks?status=${status}${typeFilter ? `&type=${typeFilter}` : ''}`}
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
        <div className="flex gap-2">
          {['PROVISION', 'START', 'STOP', 'RESTART', 'INSTALL_AGENT'].map((type) => (
            <Link
              key={type}
              href={`/${locale}/admin/tasks?type=${type}${statusFilter ? `&status=${statusFilter}` : ''}`}
              className={`px-4 py-2 rounded-lg text-sm ${
                typeFilter === type
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getTypeLabel(type as TaskType)}
            </Link>
          ))}
        </div>
      </div>

      {/* Feladatok táblázata */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">Típus</th>
              <th className="text-left p-3">Státusz</th>
              <th className="text-left p-3">Agent</th>
              <th className="text-left p-3">Szerver</th>
              <th className="text-left p-3">Létrehozva</th>
              <th className="text-left p-3">Kezdve</th>
              <th className="text-left p-3">Befejezve</th>
              <th className="text-left p-3">Hiba</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <span className="font-medium">{getTypeLabel(task.type)}</span>
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(
                      task.status
                    )}`}
                  >
                    {task.status}
                  </span>
                </td>
                <td className="p-3 text-sm">
                  {task.agent ? (
                    <Link
                      href={`/${locale}/admin/machines/${task.agent.machine.id}`}
                      className="text-primary-600 hover:underline"
                    >
                      {task.agent.agentId}
                    </Link>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="p-3 text-sm">
                  {task.server ? (
                    <Link
                      href={`/${locale}/admin/servers/${task.server.id}`}
                      className="text-primary-600 hover:underline"
                    >
                      {task.server.name}
                    </Link>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="p-3 text-sm text-gray-600">
                  {new Date(task.createdAt).toLocaleString('hu-HU')}
                </td>
                <td className="p-3 text-sm text-gray-600">
                  {task.startedAt ? new Date(task.startedAt).toLocaleString('hu-HU') : '-'}
                </td>
                <td className="p-3 text-sm text-gray-600">
                  {task.completedAt ? new Date(task.completedAt).toLocaleString('hu-HU') : '-'}
                </td>
                <td className="p-3 text-sm">
                  {task.error ? (
                    <span className="text-red-600" title={task.error}>
                      {task.error.length > 50 ? `${task.error.substring(0, 50)}...` : task.error}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
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
              href={`/${locale}/admin/tasks?page=${currentPage - 1}${statusFilter ? `&status=${statusFilter}` : ''}${typeFilter ? `&type=${typeFilter}` : ''}`}
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
              href={`/${locale}/admin/tasks?page=${currentPage + 1}${statusFilter ? `&status=${statusFilter}` : ''}${typeFilter ? `&type=${typeFilter}` : ''}`}
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

