'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

interface SaaSPlan {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  price: number;
  currency: string;
  interval: string;
  features: any;
  maxUsers: number | null;
  maxServers: number | null;
  isActive: boolean;
  order: number;
}

interface SAASPricingManagementProps {
  plans: SaaSPlan[];
  locale: string;
}

export function SAASPricingManagement({ plans, locale }: SAASPricingManagementProps) {
  const [deleting, setDeleting] = useState<string | null>(null);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('Biztosan törölni szeretnéd ezt a csomagot?')) {
      return;
    }

    setDeleting(planId);
    try {
      const response = await fetch(`/api/admin/saas-plans/${planId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Hiba történt');
      }

      toast.success('Csomag sikeresen törölve!');
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Hiba történt');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (planId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/saas-plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Hiba történt');
      }

      toast.success(`Csomag ${!currentStatus ? 'aktiválva' : 'deaktiválva'}!`);
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Hiba történt');
    }
  };

  return (
    <Card padding="lg">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Név</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Ár</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Időtartam</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Státusz</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Sorrend</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Műveletek</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium">{plan.displayName}</p>
                    <p className="text-sm text-gray-600">{plan.name}</p>
                    {plan.description && (
                      <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <p className="font-semibold">{formatPrice(plan.price, plan.currency)}</p>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                    {plan.interval === 'month' ? 'Havi' : plan.interval === 'year' ? 'Éves' : plan.interval}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => handleToggleActive(plan.id, plan.isActive)}
                    className={`px-2 py-1 text-xs rounded ${
                      plan.isActive
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {plan.isActive ? 'Aktív' : 'Inaktív'}
                  </button>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-gray-600">{plan.order}</span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <Link href={`/${locale}/admin/cms/saas-pricing/${plan.id}`}>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(plan.id)}
                      disabled={deleting === plan.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Még nincs SaaS csomag létrehozva</p>
          <Link href={`/${locale}/admin/cms/saas-pricing/new`}>
            <Button>Első csomag létrehozása</Button>
          </Link>
        </div>
      )}
    </Card>
  );
}

