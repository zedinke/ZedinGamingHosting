'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SubscriptionStatus, InvoiceStatus } from '@prisma/client';
import toast from 'react-hot-toast';

interface Subscription {
  id: string;
  status: SubscriptionStatus;
  paymentProvider: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  server: {
    id: string;
    name: string;
    gameType: string;
    status: string;
    port: number | null;
    ipAddress: string | null;
  } | null;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    status: InvoiceStatus;
    dueDate: Date | null;
    paidAt: Date | null;
    createdAt: Date;
  }>;
}

interface SubscriptionDetailProps {
  subscription: Subscription;
  locale: string;
}

export function SubscriptionDetail({ subscription, locale }: SubscriptionDetailProps) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(subscription.status);
  const [isUpdatingInvoice, setIsUpdatingInvoice] = useState<Set<string>>(new Set());

  const getStatusBadgeColor = (status: SubscriptionStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'CANCELED':
        return 'bg-red-100 text-red-800';
      case 'PAST_DUE':
        return 'bg-orange-100 text-orange-800';
      case 'UNPAID':
        return 'bg-yellow-100 text-yellow-800';
      case 'TRIALING':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInvoiceStatusBadgeColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'REFUNDED':
        return 'bg-orange-100 text-orange-800';
      case 'CANCELED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = async (newStatus: SubscriptionStatus) => {
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/admin/subscriptions/${subscription.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Hiba történt a státusz frissítése során');
        return;
      }

      toast.success('Státusz sikeresen frissítve');
      setCurrentStatus(newStatus);
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Hiba történt a státusz frissítése során');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleInvoiceStatusChange = async (invoiceId: string, newStatus: InvoiceStatus) => {
    setIsUpdatingInvoice((prev) => new Set(prev).add(invoiceId));
    try {
      const response = await fetch(`/api/admin/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Hiba történt a számla státusz frissítése során');
        return;
      }

      toast.success('Számla státusz sikeresen frissítve');
      
      // Ha PAID-re változtattuk, triggereljük az automatikus telepítést
      if (newStatus === 'PAID' && subscription.server) {
        toast.loading('Szerver telepítés indítása...', { id: 'install-toast' });
        
        // Automatikus telepítés triggerelése
        fetch(`/api/admin/servers/${subscription.server.id}/trigger-install`, {
          method: 'POST',
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              toast.success('Szerver telepítés elindítva', { id: 'install-toast' });
            } else {
              toast.error(data.error || 'Hiba történt a szerver telepítés indítása során', { id: 'install-toast' });
            }
          })
          .catch((error) => {
            console.error('Install trigger error:', error);
            toast.error('Hiba történt a szerver telepítés indítása során', { id: 'install-toast' });
          });
      }

      // Oldal frissítése
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Invoice status update error:', error);
      toast.error('Hiba történt a számla státusz frissítése során');
    } finally {
      setIsUpdatingInvoice((prev) => {
        const next = new Set(prev);
        next.delete(invoiceId);
        return next;
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Alap információk */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Alap információk</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Felhasználó</label>
            <div className="mt-1">
              <Link
                href={`/${locale}/admin/users/${subscription.user.id}`}
                className="text-primary-600 hover:underline"
              >
                {subscription.user.name || subscription.user.email}
              </Link>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Fizetési szolgáltató</label>
            <div className="mt-1 text-gray-900">{subscription.paymentProvider}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Státusz</label>
            <div className="mt-1">
              <select
                value={currentStatus}
                onChange={(e) => handleStatusChange(e.target.value as SubscriptionStatus)}
                disabled={isUpdatingStatus}
                className={`px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  getStatusBadgeColor(currentStatus)
                }`}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="CANCELED">CANCELED</option>
                <option value="PAST_DUE">PAST_DUE</option>
                <option value="UNPAID">UNPAID</option>
                <option value="TRIALING">TRIALING</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Törlés periódus végén</label>
            <div className="mt-1 text-gray-900">
              {subscription.cancelAtPeriodEnd ? 'Igen' : 'Nem'}
            </div>
          </div>
          {subscription.currentPeriodStart && subscription.currentPeriodEnd && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700">Periódus kezdete</label>
                <div className="mt-1 text-gray-900">
                  {new Date(subscription.currentPeriodStart).toLocaleString('hu-HU')}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Periódus vége</label>
                <div className="mt-1 text-gray-900">
                  {new Date(subscription.currentPeriodEnd).toLocaleString('hu-HU')}
                </div>
              </div>
            </>
          )}
          <div>
            <label className="text-sm font-medium text-gray-700">Létrehozva</label>
            <div className="mt-1 text-gray-900">
              {new Date(subscription.createdAt).toLocaleString('hu-HU')}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Utolsó frissítés</label>
            <div className="mt-1 text-gray-900">
              {new Date(subscription.updatedAt).toLocaleString('hu-HU')}
            </div>
          </div>
        </div>
      </div>

      {/* Szerver információk */}
      {subscription.server ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Szerver információk</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Szerver neve</label>
              <div className="mt-1">
                <Link
                  href={`/${locale}/admin/servers/${subscription.server.id}`}
                  className="text-primary-600 hover:underline"
                >
                  {subscription.server.name}
                </Link>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Játék típusa</label>
              <div className="mt-1 text-gray-900">{subscription.server.gameType}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Státusz</label>
              <div className="mt-1">
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    subscription.server.status === 'ONLINE'
                      ? 'bg-green-100 text-green-800'
                      : subscription.server.status === 'OFFLINE'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {subscription.server.status}
                </span>
              </div>
            </div>
            {subscription.server.ipAddress && subscription.server.port && (
              <div>
                <label className="text-sm font-medium text-gray-700">IP:Port</label>
                <div className="mt-1 text-gray-900">
                  {subscription.server.ipAddress}:{subscription.server.port}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-200 p-6">
          <p className="text-yellow-800">
            ⚠️ Nincs hozzárendelt szerver ehhez az előfizetéshez.
          </p>
        </div>
      )}

      {/* Számlák */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Számlák</h2>
        {subscription.invoices.length === 0 ? (
          <p className="text-gray-500">Nincs számla ehhez az előfizetéshez.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-gray-700">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left p-3 font-semibold text-gray-900">Számlaszám</th>
                  <th className="text-left p-3 font-semibold text-gray-900">Összeg</th>
                  <th className="text-left p-3 font-semibold text-gray-900">Státusz</th>
                  <th className="text-left p-3 font-semibold text-gray-900">Esedékesség</th>
                  <th className="text-left p-3 font-semibold text-gray-900">Fizetve</th>
                  <th className="text-left p-3 font-semibold text-gray-900">Létrehozva</th>
                  <th className="text-left p-3 font-semibold text-gray-900">Műveletek</th>
                </tr>
              </thead>
              <tbody>
                {subscription.invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-medium text-gray-800">{invoice.invoiceNumber}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-gray-900">
                        {invoice.amount.toLocaleString('hu-HU')} {invoice.currency}
                      </div>
                    </td>
                    <td className="p-3">
                      <select
                        value={invoice.status}
                        onChange={(e) =>
                          handleInvoiceStatusChange(invoice.id, e.target.value as InvoiceStatus)
                        }
                        disabled={isUpdatingInvoice.has(invoice.id)}
                        className={`px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-xs font-semibold ${
                          getInvoiceStatusBadgeColor(invoice.status)
                        }`}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="PAID">PAID</option>
                        <option value="FAILED">FAILED</option>
                        <option value="REFUNDED">REFUNDED</option>
                        <option value="CANCELED">CANCELED</option>
                      </select>
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {invoice.dueDate
                        ? new Date(invoice.dueDate).toLocaleDateString('hu-HU')
                        : '-'}
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {invoice.paidAt ? new Date(invoice.paidAt).toLocaleString('hu-HU') : '-'}
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {new Date(invoice.createdAt).toLocaleDateString('hu-HU')}
                    </td>
                    <td className="p-3">
                      <a
                        href={`/api/invoices/${invoice.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline text-sm"
                      >
                        PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

