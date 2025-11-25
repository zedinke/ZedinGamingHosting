'use client';

import Link from 'next/link';
import { InvoiceStatus, SubscriptionStatus } from '@prisma/client';

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  subscription: {
    server: {
      name: string;
    } | null;
  } | null;
}

interface Subscription {
  id: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  server: {
    name: string;
    gameType: string;
  } | null;
}

interface BillingOverviewProps {
  invoices: Invoice[];
  subscriptions: Subscription[];
  locale: string;
}

export function BillingOverview({
  invoices,
  subscriptions,
  locale,
}: BillingOverviewProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getStatusBadgeColor = (status: InvoiceStatus | SubscriptionStatus) => {
    switch (status) {
      case 'PAID':
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
      case 'PAST_DUE':
        return 'bg-red-100 text-red-800';
      case 'CANCELED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalPaid = invoices
    .filter((inv) => inv.status === 'PAID')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const pendingAmount = invoices
    .filter((inv) => inv.status === 'PENDING')
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="space-y-6">
      {/* Statisztikák */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Összes Fizetve</h3>
          <p className="text-3xl font-bold text-green-600">
            {formatCurrency(totalPaid, invoices[0]?.currency || 'HUF')}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Függőben</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {formatCurrency(pendingAmount, invoices[0]?.currency || 'HUF')}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Aktív Előfizetések</h3>
          <p className="text-3xl font-bold text-primary-600">
            {subscriptions.filter((s) => s.status === 'ACTIVE').length}
          </p>
        </div>
      </div>

      {/* Aktív előfizetések */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Aktív Előfizetések</h2>
        {subscriptions.length === 0 ? (
          <p className="text-gray-600">Nincs aktív előfizetés</p>
        ) : (
          <div className="space-y-3">
            {subscriptions.map((subscription) => (
              <div
                key={subscription.id}
                className="flex justify-between items-center p-4 border rounded-lg"
              >
                <div>
                  <div className="font-semibold">
                    {subscription.server?.name || 'Névtelen szerver'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {subscription.server?.gameType}
                    {subscription.currentPeriodEnd && (
                      <span className="ml-2">
                        • Következő számlázás:{' '}
                        {new Date(subscription.currentPeriodEnd).toLocaleDateString('hu-HU')}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded text-sm font-semibold ${getStatusBadgeColor(
                    subscription.status
                  )}`}
                >
                  {subscription.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Számlák */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Számlák</h2>
        {invoices.length === 0 ? (
          <p className="text-gray-600">Nincs számla</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Számlaszám</th>
                  <th className="text-left p-3">Szerver</th>
                  <th className="text-left p-3">Összeg</th>
                  <th className="text-left p-3">Státusz</th>
                  <th className="text-left p-3">Dátum</th>
                  <th className="text-left p-3">Műveletek</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{invoice.invoiceNumber}</td>
                    <td className="p-3 text-sm text-gray-600">
                      {invoice.subscription?.server?.name || '-'}
                    </td>
                    <td className="p-3 font-semibold">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(
                          invoice.status
                        )}`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {new Date(invoice.createdAt).toLocaleDateString('hu-HU')}
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/${locale}/dashboard/billing/invoices/${invoice.id}`}
                        className="text-primary-600 hover:underline text-sm"
                      >
                        Részletek
                      </Link>
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

