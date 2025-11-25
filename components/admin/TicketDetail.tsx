'use client';

import { useState, useEffect } from 'react';
import { TicketStatus, TicketPriority, TicketCategory } from '@prisma/client';
import toast from 'react-hot-toast';
import { loadTranslations, getNestedValue } from '@/lib/translations';

interface Ticket {
  id: string;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  messages: Array<{
    id: string;
    content: string;
    isAdmin: boolean;
    createdAt: Date;
  }>;
}

interface TicketDetailProps {
  ticket: Ticket;
  locale: string;
  adminId: string;
}

export function TicketDetail({ ticket, locale, adminId }: TicketDetailProps) {
  const [translations, setTranslations] = useState<any>({});
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ticketStatus, setTicketStatus] = useState(ticket.status);
  const [ticketPriority, setTicketPriority] = useState(ticket.priority);
  const [messages, setMessages] = useState(ticket.messages);

  useEffect(() => {
    loadTranslations(locale, 'common').then(setTranslations);
  }, [locale]);

  const t = (key: string) => getNestedValue(translations, key) || key;

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/tickets/${ticket.id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: message,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Hiba történt');
        return;
      }

      toast.success('Üzenet elküldve');
      setMessage('');
      // Üzenetek frissítése
      setMessages([...messages, result.message]);
    } catch (error) {
      toast.error('Hiba történt');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: TicketStatus) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/tickets/${ticket.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Hiba történt');
        return;
      }

      toast.success('Státusz frissítve');
      setTicketStatus(newStatus);
    } catch (error) {
      toast.error('Hiba történt');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePriority = async (newPriority: TicketPriority) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/tickets/${ticket.id}/priority`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priority: newPriority }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Hiba történt');
        return;
      }

      toast.success('Prioritás frissítve');
      setTicketPriority(newPriority);
    } catch (error) {
      toast.error('Hiba történt');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Ticket információk */}
      <div className="card">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold mb-2">{ticket.subject}</h2>
            <div className="flex gap-2 flex-wrap">
              <span
                className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(
                  ticketStatus
                )}`}
              >
                {ticketStatus}
              </span>
              <span
                className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityBadgeColor(
                  ticketPriority
                )}`}
              >
                {ticketPriority}
              </span>
              <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                {getCategoryLabel(ticket.category)}
              </span>
            </div>
          </div>
          <div className="text-right text-sm text-gray-600">
            <div>Felhasználó: {ticket.user.name || ticket.user.email}</div>
            <div>Létrehozva: {new Date(ticket.createdAt).toLocaleString('hu-HU')}</div>
          </div>
        </div>

        {/* Státusz és prioritás kezelés */}
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-2">Státusz módosítása</label>
            <div className="flex gap-2">
              {(['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'CLOSED'] as TicketStatus[]).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => handleUpdateStatus(status)}
                    disabled={isLoading || ticketStatus === status}
                    className={`px-3 py-1 rounded text-sm ${
                      ticketStatus === status
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    } disabled:opacity-50`}
                  >
                    {status}
                  </button>
                )
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Prioritás módosítása</label>
            <div className="flex gap-2">
              {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as TicketPriority[]).map((priority) => (
                <button
                  key={priority}
                  onClick={() => handleUpdatePriority(priority)}
                  disabled={isLoading || ticketPriority === priority}
                  className={`px-3 py-1 rounded text-sm ${
                    ticketPriority === priority
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  } disabled:opacity-50`}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Üzenetek */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Üzenetek</h2>
        <div className="space-y-4 mb-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-4 rounded-lg ${
                msg.isAdmin ? 'bg-primary-50 border-l-4 border-primary-600' : 'bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold">
                  {msg.isAdmin ? 'Admin' : ticket.user.name || ticket.user.email}
                </span>
                <span className="text-sm text-gray-600">
                  {new Date(msg.createdAt).toLocaleString('hu-HU')}
                </span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))}
        </div>

        {/* Új üzenet küldése */}
        <form onSubmit={handleSendMessage} className="space-y-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Írj egy választ..."
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 min-h-[100px]"
            required
          />
          <button
            type="submit"
            disabled={isLoading || !message.trim()}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t('common.loading') : 'Üzenet küldése'}
          </button>
        </form>
      </div>
    </div>
  );
}

