'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Check, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

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

interface SaaSPlansSectionProps {
  plans: SaaSPlan[];
  locale: string;
}

export function SaaSPlansSection({ plans, locale }: SaaSPlansSectionProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const features = (plan: SaaSPlan) => {
    if (plan.features && Array.isArray(plan.features)) {
      return plan.features;
    }
    // Alapértelmezett funkciók
    return [
      'Teljes rendszer hozzáférés',
      'Automatikus frissítések',
      'Email támogatás',
      plan.maxUsers ? `Maximum ${plan.maxUsers} felhasználó` : 'Korlátlan felhasználó',
      plan.maxServers ? `Maximum ${plan.maxServers} szerver` : 'Korlátlan szerver',
      '60+ játék támogatás',
      'Integrált fizetési rendszer',
      'Teljes CMS rendszer',
      'Admin vezérlőpult',
    ];
  };

  // Rendezés order szerint
  const sortedPlans = [...plans].sort((a, b) => a.order - b.order);

  return (
    <div id="pricing" className="grid md:grid-cols-3 gap-8">
      {sortedPlans.map((plan, index) => {
        const isPopular = index === 1; // Második csomag = népszerű
        const planFeatures = features(plan);

        return (
          <Card
            key={plan.id}
            className={`relative ${isPopular ? 'border-2 border-primary-500 shadow-xl scale-105' : ''}`}
            hover
            padding="lg"
          >
            {isPopular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  ⭐ Népszerű
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2 text-gray-900">{plan.displayName}</h3>
              {plan.description && (
                <p className="text-gray-600 text-sm mb-6">{plan.description}</p>
              )}
              <div className="mb-2">
                <span className="text-5xl font-bold text-primary-600">
                  {formatPrice(plan.price, plan.currency)}
                </span>
              </div>
              <p className="text-gray-600 text-sm">
                /{plan.interval === 'month' ? 'hónap' : plan.interval === 'year' ? 'év' : plan.interval}
              </p>
            </div>

            <div className="mb-6">
              <ul className="space-y-3">
                {planFeatures.map((feature: string, idx: number) => (
                  <li key={idx} className="flex items-start">
                    <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link href={`/${locale}/zed-gaming-system/order?plan=${plan.id}`} className="block">
              <Button
                variant={isPopular ? 'primary' : 'outline'}
                size="lg"
                className="w-full"
              >
                Megrendelés
              </Button>
            </Link>
          </Card>
        );
      })}
    </div>
  );
}

