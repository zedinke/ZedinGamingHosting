'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface SaaSPlan {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  price: number;
  currency: string;
  interval: string;
}

interface SaaSOrderFormProps {
  plan: SaaSPlan;
  locale: string;
}

export function SaaSOrderForm({ plan, locale }: SaaSOrderFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerCompany: '',
    billingAddress: '',
    billingTaxNumber: '',
  });

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/saas/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Hiba történt a megrendelés során');
      }

      // Fizetés átirányítás
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.success('Megrendelés sikeresen létrehozva!');
        router.push(`/${locale}/dashboard`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Hiba történt a megrendelés során');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {/* Order Summary */}
      <div className="md:col-span-1">
        <Card padding="lg">
          <h3 className="text-xl font-bold mb-4 text-gray-900">Megrendelés összefoglaló</h3>
          
          <div className="space-y-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Csomag</p>
              <p className="font-semibold text-gray-900">{plan.displayName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Időtartam</p>
              <p className="font-semibold text-gray-900">
                {plan.interval === 'month' ? '1 hónap' : plan.interval === 'year' ? '1 év' : plan.interval}
              </p>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-1">Összesen</p>
              <p className="text-2xl font-bold text-primary-600">
                {formatPrice(plan.price, plan.currency)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {plan.interval === 'month' ? 'havonta' : plan.interval === 'year' ? 'évente' : ''}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Order Form */}
      <div className="md:col-span-2">
        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Név <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Kovács János"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email cím <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="kovacs.janos@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cégnév (opcionális)
              </label>
              <input
                type="text"
                value={formData.customerCompany}
                onChange={(e) => setFormData({ ...formData, customerCompany: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Kovács Kft."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Számlázási cím <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.billingAddress}
                onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="1234 Fő utca, Budapest, 1234"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adószám (opcionális)
              </label>
              <input
                type="text"
                value={formData.billingTaxNumber}
                onChange={(e) => setFormData({ ...formData, billingTaxNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="12345678-1-23"
              />
            </div>

            <div className="pt-4 border-t">
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Feldolgozás...' : 'Tovább a fizetéshez'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

