'use client';

import Link from 'next/link';

interface PricingPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  interval: string;
  features: any;
  isActive: boolean;
  order: number;
}

interface PricingManagementProps {
  plans: PricingPlan[];
  locale: string;
}

export function PricingManagement({ plans, locale }: PricingManagementProps) {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={`card ${!plan.isActive ? 'opacity-60' : ''}`}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
              <div className="text-3xl font-bold text-primary-600">
                {formatPrice(plan.price, plan.currency)}
                <span className="text-lg text-gray-600">/{plan.interval}</span>
              </div>
            </div>
            {!plan.isActive && (
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                Inaktív
              </span>
            )}
          </div>

          {plan.description && (
            <p className="text-gray-600 mb-4 text-sm">{plan.description}</p>
          )}

          {plan.features && Array.isArray(plan.features) && (
            <ul className="space-y-2 mb-4">
              {plan.features.map((feature: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 pt-4 border-t">
            <Link
              href={`/${locale}/admin/cms/pricing/${plan.id}`}
              className="text-primary-600 hover:underline text-sm"
            >
              Szerkesztés
            </Link>
          </div>
        </div>
      ))}

      {plans.length === 0 && (
        <div className="col-span-full card text-center py-12">
          <p className="text-gray-600">Még nincs árazási csomag</p>
        </div>
      )}
    </div>
  );
}

