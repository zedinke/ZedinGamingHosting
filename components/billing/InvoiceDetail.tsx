'use client';

import { InvoiceStatus } from '@prisma/client';
import Link from 'next/link';

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
    id: string;
    server: {
      id: string;
      name: string;
      gameType: string;
    } | null;
  } | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface InvoiceDetailProps {
  invoice: Invoice;
  locale: string;
}

export function InvoiceDetail({ invoice, locale }: InvoiceDetailProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getStatusBadgeColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Számla információk */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Számla Információk</h2>
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-gray-700">Számlaszám:</dt>
            <dd className="font-medium text-gray-900">{invoice.invoiceNumber}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-700">Összeg:</dt>
            <dd className="font-semibold text-lg text-gray-900">
              {formatCurrency(invoice.amount, invoice.currency)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-700">Státusz:</dt>
            <dd>
              <span
                className={`px-3 py-1 rounded text-sm font-semibold ${getStatusBadgeColor(
                  invoice.status
                )}`}
              >
                {invoice.status}
              </span>
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-700">Létrehozva:</dt>
            <dd className="text-gray-900">
              {new Date(invoice.createdAt).toLocaleDateString('hu-HU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </dd>
          </div>
          {invoice.dueDate && (
            <div className="flex justify-between">
              <dt className="text-gray-700">Fizetési határidő:</dt>
              <dd className="text-gray-900">
                {new Date(invoice.dueDate).toLocaleDateString('hu-HU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>
          )}
          {invoice.paidAt && (
            <div className="flex justify-between">
              <dt className="text-gray-700">Fizetve:</dt>
              <dd className="text-gray-900">
                {new Date(invoice.paidAt).toLocaleDateString('hu-HU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Előfizetés információk */}
      {invoice.subscription && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Előfizetés Információk</h2>
          <dl className="space-y-3">
            {invoice.subscription.server && (
              <>
                <div className="flex justify-between">
                  <dt className="text-gray-700">Szerver:</dt>
                  <dd className="text-gray-900">{invoice.subscription.server.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-700">Játék:</dt>
                  <dd className="text-gray-900">{invoice.subscription.server.gameType}</dd>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-700">Előfizetés ID:</dt>
              <dd className="text-gray-900 font-mono text-sm">{invoice.subscription.id}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Műveletek */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Műveletek</h2>
        <div className="flex gap-3">
          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            PDF Letöltése
          </a>
          {invoice.status === 'PENDING' && (
            <Link
              href={`/${locale}/dashboard/billing?pay=${invoice.id}`}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Fizetés
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

