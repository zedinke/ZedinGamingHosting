'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { Copy, Check, Mail, Key, Eye, EyeOff } from 'lucide-react';

interface SaaSOrder {
  id: string;
  customerEmail: string;
  customerName: string | null;
  customerCompany: string | null;
  amount: number;
  currency: string;
  paymentStatus: string;
  licenseKey: string | null;
  licenseGenerated: boolean;
  invoiceSent: boolean;
  isActive: boolean;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  plan: {
    id: string;
    displayName: string;
    interval: string;
  };
}

interface SaaSPlan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  currency: string;
  interval: string;
}

interface LicenseManagementProps {
  orders: SaaSOrder[];
  plans: SaaSPlan[];
  currentPage: number;
  totalPages: number;
  locale: string;
  statusFilter?: string;
}

export function LicenseManagement({
  orders,
  plans,
  currentPage,
  totalPages,
  locale,
  statusFilter,
}: LicenseManagementProps) {
  const [copiedKeys, setCopiedKeys] = useState<Set<string>>(new Set());
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState<string | null>(null);
  const [sendingInvoice, setSendingInvoice] = useState<string | null>(null);
  const [manualGenerate, setManualGenerate] = useState(false);
  const [manualForm, setManualForm] = useState({
    customerEmail: '',
    planId: plans[0]?.id || '',
  });

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('hu-HU').format(new Date(date));
  };

  const getDaysRemaining = (endDate: Date | null) => {
    if (!endDate) return null;
    const now = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const copyToClipboard = async (text: string, orderId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKeys(new Set([...copiedKeys, orderId]));
      setTimeout(() => {
        setCopiedKeys(new Set([...copiedKeys].filter(id => id !== orderId)));
      }, 2000);
      toast.success('Másolva a vágólapra!');
    } catch (error) {
      toast.error('Másolás sikertelen');
    }
  };

  const handleGenerateLicense = async (orderId: string) => {
    setGenerating(orderId);
    try {
      const response = await fetch('/api/admin/license/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Hiba történt');
      }

      toast.success('License key sikeresen generálva!');
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Hiba történt');
    } finally {
      setGenerating(null);
    }
  };

  const handleManualGenerate = async () => {
    if (!manualForm.customerEmail || !manualForm.planId) {
      toast.error('Email és csomag megadása kötelező');
      return;
    }

    setGenerating('manual');
    try {
      const response = await fetch('/api/admin/license/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manual: true,
          customerEmail: manualForm.customerEmail,
          planId: manualForm.planId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Hiba történt');
      }

      toast.success('License key sikeresen generálva!');
      setManualGenerate(false);
      setManualForm({ customerEmail: '', planId: plans[0]?.id || '' });
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Hiba történt');
    } finally {
      setGenerating(null);
    }
  };

  const handleSendInvoice = async (orderId: string) => {
    setSendingInvoice(orderId);
    try {
      const response = await fetch('/api/admin/license/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Hiba történt');
      }

      toast.success('Számla sikeresen elküldve!');
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Hiba történt');
    } finally {
      setSendingInvoice(null);
    }
  };

  const toggleKeyVisibility = (orderId: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(orderId)) {
      newVisible.delete(orderId);
    } else {
      newVisible.add(orderId);
    }
    setVisibleKeys(newVisible);
  };

  return (
    <div>
      {/* Manuális generálás gomb */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex gap-4">
          <Button
            onClick={() => setManualGenerate(!manualGenerate)}
            variant="outline"
          >
            <Key className="w-4 h-4 mr-2" />
            Manuális License Key generálás
          </Button>
        </div>
      </div>

      {/* Manuális generálás form */}
      {manualGenerate && (
        <Card className="mb-6" padding="lg">
          <h3 className="text-lg font-bold mb-4">Manuális License Key generálás</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email cím
              </label>
              <input
                type="email"
                value={manualForm.customerEmail}
                onChange={(e) => setManualForm({ ...manualForm, customerEmail: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="customer@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Csomag
              </label>
              <select
                value={manualForm.planId}
                onChange={(e) => setManualForm({ ...manualForm, planId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.displayName} - {formatPrice(plan.price, plan.currency)}/{plan.interval === 'month' ? 'hó' : 'év'}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              onClick={handleManualGenerate}
              disabled={generating === 'manual'}
            >
              {generating === 'manual' ? 'Generálás...' : 'Generálás'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setManualGenerate(false);
                setManualForm({ customerEmail: '', planId: plans[0]?.id || '' });
              }}
            >
              Mégse
            </Button>
          </div>
        </Card>
      )}

      {/* Megrendelések táblázat */}
      <Card padding="lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Vásárló</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Csomag</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Összeg</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Státusz</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">License Key</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Lejárat</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const daysRemaining = getDaysRemaining(order.endDate);
                const isKeyVisible = visibleKeys.has(order.id);
                const isCopied = copiedKeys.has(order.id);

                return (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{order.customerName || order.customerEmail}</p>
                        <p className="text-sm text-gray-600">{order.customerEmail}</p>
                        {order.customerCompany && (
                          <p className="text-xs text-gray-500">{order.customerCompany}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{order.plan.displayName}</p>
                        <p className="text-xs text-gray-500">
                          {order.plan.interval === 'month' ? 'Havi' : 'Éves'}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold">{formatPrice(order.amount, order.currency)}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          order.paymentStatus === 'PAID'
                            ? 'bg-green-100 text-green-800'
                            : order.paymentStatus === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                      {order.isActive && (
                        <span className="ml-2 px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                          Aktív
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {order.licenseKey ? (
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                            {isKeyVisible ? order.licenseKey : '••••-••••-••••-••••'}
                          </code>
                          <button
                            onClick={() => toggleKeyVisibility(order.id)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            {isKeyVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(order.licenseKey!, order.id)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            {isCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateLicense(order.id)}
                          disabled={generating === order.id}
                        >
                          {generating === order.id ? 'Generálás...' : 'Generálás'}
                        </Button>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {order.endDate ? (
                        <div>
                          <p className="text-sm">{formatDate(order.endDate)}</p>
                          {daysRemaining !== null && (
                            <p
                              className={`text-xs ${
                                daysRemaining < 7
                                  ? 'text-red-600 font-semibold'
                                  : daysRemaining < 30
                                  ? 'text-yellow-600'
                                  : 'text-gray-500'
                              }`}
                            >
                              {daysRemaining > 0
                                ? `${daysRemaining} nap van hátra`
                                : daysRemaining === 0
                                ? 'Ma jár le'
                                : `${Math.abs(daysRemaining)} napja lejárt`}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {order.licenseKey && !order.invoiceSent && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendInvoice(order.id)}
                            disabled={sendingInvoice === order.id}
                          >
                            <Mail className="w-4 h-4 mr-1" />
                            {sendingInvoice === order.id ? 'Küldés...' : 'Számla küldés'}
                          </Button>
                        )}
                        {order.invoiceSent && (
                          <span className="text-xs text-green-600">✓ Számla elküldve</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <a
                key={page}
                href={`/${locale}/admin/license?page=${page}${statusFilter ? `&status=${statusFilter}` : ''}`}
                className={`px-4 py-2 rounded ${
                  page === currentPage
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {page}
              </a>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

