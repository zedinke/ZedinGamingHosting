'use client';

import Link from 'next/link';
import { TicketStatus, TicketCategory, TicketPriority } from '@prisma/client';

interface Ticket {
  id: string;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  messages: Array<{
    createdAt: Date;
    isAdmin: boolean;
  }>;
  _count: {
    messages: number;
  };
}

interface TicketManagementProps {
  tickets: Ticket[];
  currentPage: number;
  totalPages: number;
  locale: string;
  statusFilter?: string;
  categoryFilter?: string;
  priorityFilter?: string;
}

export function TicketManagement({
  tickets,
  currentPage,
  totalPages,
  locale,
  statusFilter,
  categoryFilter,
  priorityFilter,
}: TicketManagementProps) {
  const getStatusBadgeColor = (status: TicketStatus) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'WAITING_FOR_USER':
        return 'bg-orange-100 text-orange-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadgeColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: TicketCategory) => {
    const labels: Record<TicketCategory, string> = {
      TECHNICAL: 'Technikai',
      BILLING: 'Számlázás',
      GENERAL: 'Általános',
      SERVER_ISSUE: 'Szerver probléma',
    };
    return labels[category] || category;
  };

  const buildFilterUrl = (filters: {
    status?: string;
    category?: string;
    priority?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.category) params.set('category', filters.category);
    if (filters.priority) params.set('priority', filters.priority);
    return `/${locale}/admin/tickets?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      {/* Szűrők */}
      <div className="flex flex-wrap gap-2">
        {/* Státusz szűrők */}
        <div className="flex gap-2">
          <span className="px-2 py-2 text-sm text-gray-600">Státusz:</span>
          <Link
            href={`/${locale}/admin/tickets`}
            className={`px-4 py-2 rounded-lg text-sm ${
              !statusFilter
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Összes
          </Link>
          {['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'CLOSED'].map((status) => (
            <Link
              key={status}
              href={buildFilterUrl({ status, category: categoryFilter, priority: priorityFilter })}
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

        {/* Kategória szűrők */}
        <div className="flex gap-2">
          <span className="px-2 py-2 text-sm text-gray-600">Kategória:</span>
          <Link
            href={buildFilterUrl({ status: statusFilter, priority: priorityFilter })}
            className={`px-4 py-2 rounded-lg text-sm ${
              !categoryFilter
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Összes
          </Link>
          {['TECHNICAL', 'BILLING', 'GENERAL', 'SERVER_ISSUE'].map((category) => (
            <Link
              key={category}
              href={buildFilterUrl({
                status: statusFilter,
                category,
                priority: priorityFilter,
              })}
              className={`px-4 py-2 rounded-lg text-sm ${
                categoryFilter === category
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getCategoryLabel(category as TicketCategory)}
            </Link>
          ))}
        </div>

        {/* Prioritás szűrők */}
        <div className="flex gap-2">
          <span className="px-2 py-2 text-sm text-gray-600">Prioritás:</span>
          <Link
            href={buildFilterUrl({ status: statusFilter, category: categoryFilter })}
            className={`px-4 py-2 rounded-lg text-sm ${
              !priorityFilter
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Összes
          </Link>
          {['URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((priority) => (
            <Link
              key={priority}
              href={buildFilterUrl({
                status: statusFilter,
                category: categoryFilter,
                priority,
              })}
              className={`px-4 py-2 rounded-lg text-sm ${
                priorityFilter === priority
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {priority}
            </Link>
          ))}
        </div>
      </div>

      {/* Ticketek táblázata */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-gray-700">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left p-3 font-semibold text-gray-900">Tárgy</th>
              <th className="text-left p-3 font-semibold text-gray-900">Felhasználó</th>
              <th className="text-left p-3 font-semibold text-gray-900">Kategória</th>
              <th className="text-left p-3 font-semibold text-gray-900">Státusz</th>
              <th className="text-left p-3 font-semibold text-gray-900">Prioritás</th>
              <th className="text-left p-3 font-semibold text-gray-900">Üzenetek</th>
              <th className="text-left p-3 font-semibold text-gray-900">Utolsó frissítés</th>
              <th className="text-left p-3 font-semibold text-gray-900">Műveletek</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="p-3">
                  <div className="font-medium text-gray-800">{ticket.subject}</div>
                  <div className="text-sm text-gray-600">
                    #{ticket.id.slice(0, 8)}
                  </div>
                </td>
                <td className="p-3">
                  <Link
                    href={`/${locale}/admin/users/${ticket.user.id}`}
                    className="text-primary-600 hover:underline"
                  >
                    {ticket.user.name || ticket.user.email}
                  </Link>
                </td>
                <td className="p-3">
                  <span className="text-sm">{getCategoryLabel(ticket.category)}</span>
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(
                      ticket.status
                    )}`}
                  >
                    {ticket.status}
                  </span>
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityBadgeColor(
                      ticket.priority
                    )}`}
                  >
                    {ticket.priority}
                  </span>
                </td>
                <td className="p-3">
                  <span className="text-sm">{ticket._count.messages}</span>
                </td>
                <td className="p-3 text-sm text-gray-700">
                  {ticket.messages[0]
                    ? new Date(ticket.messages[0].createdAt).toLocaleDateString('hu-HU')
                    : new Date(ticket.createdAt).toLocaleDateString('hu-HU')}
                </td>
                <td className="p-3">
                  <Link
                    href={`/${locale}/admin/tickets/${ticket.id}`}
                    className="text-primary-600 hover:underline text-sm"
                  >
                    Megnyitás
                  </Link>
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
              href={`/${locale}/admin/tickets?page=${currentPage - 1}${statusFilter ? `&status=${statusFilter}` : ''}${categoryFilter ? `&category=${categoryFilter}` : ''}${priorityFilter ? `&priority=${priorityFilter}` : ''}`}
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
              href={`/${locale}/admin/tickets?page=${currentPage + 1}${statusFilter ? `&status=${statusFilter}` : ''}${categoryFilter ? `&category=${categoryFilter}` : ''}${priorityFilter ? `&priority=${priorityFilter}` : ''}`}
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

