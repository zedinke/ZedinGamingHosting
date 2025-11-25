'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Mail } from 'lucide-react';

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
    <div className="space-y-4">
      <Card padding="lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Számlaszám</th>
                <th className="text-left p-3">Felhasználó</th>
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
                  <td className="p-3">
                    <div>
                      <div className="font-medium">{invoice.user.name || 'Névtelen'}</div>
                      <div className="text-sm text-gray-600">{invoice.user.email}</div>
                    </div>
                  </td>
                  <td className="p-3">{formatPrice(invoice.amount, invoice.currency)}</td>
                  <td className="p-3">
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td className="p-3 text-sm text-gray-600">
                    {new Date(invoice.createdAt).toLocaleDateString('hu-HU')}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResend(invoice.id)}
                        disabled={resendingIds.has(invoice.id)}
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        {resendingIds.has(invoice.id) ? 'Küldés...' : 'Újraküldés'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {currentPage > 1 && (
            <Link
              href={`/${locale}/admin/invoices?page=${currentPage - 1}`}
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
              href={`/${locale}/admin/invoices?page=${currentPage + 1}`}
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
