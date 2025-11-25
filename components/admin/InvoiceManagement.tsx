'use client';

import { useState } from 'react';
import Link from 'next/link';
import { InvoiceStatus } from '@prisma/client';

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  subscription: {
    id: string;
    server: {
      name: string;
    } | null;
  } | null;
}

interface InvoiceManagementProps {
  invoices: Invoice[];
  currentPage: number;
  totalPages: number;
  locale: string;
  statusFilter?: string;
}

export function InvoiceManagement({
  invoices,
  currentPage,
  totalPages,
  locale,
  statusFilter,
}: InvoiceManagementProps) {
  const [search, setSearch] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    window.location.href = `/${locale}/admin/invoices?${params.toString()}`;
  };

  const getStatusBadgeColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'REFUNDED':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Keresés és szűrők */}
      <div className="flex gap-2 flex-wrap">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[300px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Keresés számlaszám vagy email alapján..."
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="submit"
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
          >
            Keresés
          </button>
        </form>
        
        {/* Státusz szűrők */}
        <div className="flex gap-2">
          <Link
            href={`/${locale}/admin/invoices`}
            className={`px-4 py-2 rounded-lg text-sm ${
              !statusFilter
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Összes
          </Link>
          {['PAID', 'PENDING', 'FAILED', 'REFUNDED', 'CANCELED'].map((status) => (
            <Link
              key={status}
              href={`/${locale}/admin/invoices?status=${status}`}
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
      </div>

      {/* Számlák táblázata */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">Számlaszám</th>
              <th className="text-left p-3">Felhasználó</th>
              <th className="text-left p-3">Összeg</th>
              <th className="text-left p-3">Státusz</th>
              <th className="text-left p-3">Esedékesség</th>
              <th className="text-left p-3">Fizetve</th>
              <th className="text-left p-3">Létrehozva</th>
              <th className="text-left p-3">Műveletek</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{invoice.invoiceNumber}</td>
                <td className="p-3">
                  <Link
                    href={`/${locale}/admin/users/${invoice.user.id}`}
                    className="text-primary-600 hover:underline"
                  >
                    {invoice.user.name || invoice.user.email}
                  </Link>
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
                  {invoice.dueDate
                    ? new Date(invoice.dueDate).toLocaleDateString('hu-HU')
                    : '-'}
                </td>
                <td className="p-3 text-sm text-gray-600">
                  {invoice.paidAt
                    ? new Date(invoice.paidAt).toLocaleDateString('hu-HU')
                    : '-'}
                </td>
                <td className="p-3 text-sm text-gray-600">
                  {new Date(invoice.createdAt).toLocaleDateString('hu-HU')}
                </td>
                <td className="p-3">
                  <Link
                    href={`/${locale}/admin/invoices/${invoice.id}`}
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

      {/* Pagináció */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {currentPage > 1 && (
            <Link
              href={`/${locale}/admin/invoices?page=${currentPage - 1}${statusFilter ? `&status=${statusFilter}` : ''}`}
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
              href={`/${locale}/admin/invoices?page=${currentPage + 1}${statusFilter ? `&status=${statusFilter}` : ''}`}
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

