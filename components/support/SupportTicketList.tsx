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
  _count: {
    messages: number;
  };
}

interface SupportTicketListProps {
  tickets: Ticket[];
  locale: string;
}

export function SupportTicketList({ tickets, locale }: SupportTicketListProps) {
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

  return (
    <div className="space-y-4">
      {tickets.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center py-12">
          <p className="text-gray-600 mb-4">Még nincs ticket</p>
          <Link
            href={`/${locale}/dashboard/support/new`}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Hozz létre egy újat
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-3 text-gray-700 font-semibold">Tárgy</th>
                <th className="text-left p-3 text-gray-700 font-semibold">Kategória</th>
                <th className="text-left p-3 text-gray-700 font-semibold">Státusz</th>
                <th className="text-left p-3 text-gray-700 font-semibold">Prioritás</th>
                <th className="text-left p-3 text-gray-700 font-semibold">Üzenetek</th>
                <th className="text-left p-3 text-gray-700 font-semibold">Létrehozva</th>
                <th className="text-left p-3 text-gray-700 font-semibold">Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-3">
                    <div className="font-medium">{ticket.subject}</div>
                    <div className="text-sm text-gray-500">#{ticket.id.slice(0, 8)}</div>
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
                  <td className="p-3 text-sm text-gray-600">
                    {new Date(ticket.createdAt).toLocaleDateString('hu-HU')}
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/${locale}/dashboard/support/${ticket.id}`}
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
      )}
    </div>
  );
}

