'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface PricingPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  interval: string;
  features: any;
  order: number;
}

interface PricingSectionProps {
  plans: PricingPlan[];
  locale: string;
}

export function PricingSection({ plans, locale }: PricingSectionProps) {
  const { data: session } = useSession();

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className="card hover:shadow-xl transition-shadow relative"
        >
          {plan.order === 2 && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Népszerű
              </span>
            </div>
          )}
          
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
            {plan.description && (
              <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
            )}
            <div className="mb-4">
              <span className="text-4xl font-bold text-primary-600">
                {formatPrice(plan.price, plan.currency)}
              </span>
              <span className="text-gray-600">/{plan.interval}</span>
            </div>
          </div>

          {plan.features && Array.isArray(plan.features) && (
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-600 mr-2 mt-1">✓</span>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          )}

          <Link
            href={session ? `/${locale}/servers/new?plan=${plan.id}` : `/${locale}/register`}
            className="block w-full bg-primary-600 text-white text-center py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
          >
            Rendelés
          </Link>
        </div>
      ))}

      {plans.length === 0 && (
        <div className="col-span-full text-center py-12">
          <p className="text-gray-600">Jelenleg nincs elérhető árazási csomag</p>
        </div>
      )}
    </div>
  );
}

