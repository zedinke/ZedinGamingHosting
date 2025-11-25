'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Mail, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface InvoiceManagementProps {
  invoices: Invoice[];
  currentPage: number;
  totalPages: number;
  locale: string;
}

export function InvoiceManagement({
  invoices,
  currentPage,
  totalPages,
  locale,
}: InvoiceManagementProps) {
  const [resendingIds, setResendingIds] = useState<Set<string>>(new Set());

  const handleResend = async (invoiceId: string) => {
    setResendingIds((prev: Set<string>) => new Set(prev).add(invoiceId));
    try {
      const response = await fetch(`/api/admin/invoices/${invoiceId}/resend`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Hiba történt');
        return;
      }

      toast.success('Számla sikeresen elküldve');
    } catch (error) {
      toast.error('Hiba történt');
    } finally {
      setResendingIds((prev: Set<string>) => {
        const newSet = new Set(prev);
        newSet.delete(invoiceId);
        return newSet;
      });
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'default' | 'error'> = {
      PAID: 'success',
      PENDING: 'warning',
      FAILED: 'error',
      REFUNDED: 'default',
      CANCELED: 'default',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Keresés */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Keresés számlaszám alapján..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900"
          />
        </div>
      </div>

      {/* Táblázat */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  Számlaszám
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  Felhasználó
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  Összeg
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  Státusz
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  Dátum
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  Műveletek
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-gray-500 text-lg">Nincs számla</p>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {invoice.invoiceNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.user.name || 'Névtelen'}
                        </div>
                        <div className="text-sm text-gray-600">{invoice.user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatPrice(invoice.amount, invoice.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">
                        {new Date(invoice.createdAt).toLocaleDateString('hu-HU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResend(invoice.id)}
                        disabled={resendingIds.has(invoice.id)}
                        className="text-gray-700 border-gray-300 hover:bg-gray-50"
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        {resendingIds.has(invoice.id) ? 'Küldés...' : 'Újraküldés'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagináció */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
          <div className="text-sm text-gray-700">
            Oldal <span className="font-semibold text-gray-900">{currentPage}</span> /{' '}
            <span className="font-semibold text-gray-900">{totalPages}</span>
          </div>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link
                href={`/${locale}/admin/invoices?page=${currentPage - 1}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Előző
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`/${locale}/admin/invoices?page=${currentPage + 1}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Következő
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
