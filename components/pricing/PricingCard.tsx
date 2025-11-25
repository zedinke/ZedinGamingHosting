'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Check, X } from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  interval: string;
  features: any;
  order: number;
  isPopular?: boolean;
}

interface PricingCardProps {
  plan: PricingPlan;
  locale: string;
  isPopular?: boolean;
  session?: any;
}

export function PricingCard({ plan, locale, isPopular = false, session }: PricingCardProps) {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const features = plan.features && Array.isArray(plan.features) ? plan.features : [];

  return (
    <Card
      className={`relative ${isPopular ? 'border-2 border-primary-500 shadow-xl scale-105' : ''}`}
      hover
      padding="lg"
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <Badge variant="success" size="md">
            ⭐ Népszerű
          </Badge>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2 text-gray-900">{plan.name}</h3>
        {plan.description && (
          <p className="text-gray-600 text-sm mb-6">{plan.description}</p>
        )}
        <div className="mb-2">
          <span className="text-5xl font-bold text-primary-600">
            {formatPrice(plan.price, plan.currency)}
          </span>
        </div>
        <p className="text-gray-600 text-sm">
          /{plan.interval === 'month' ? 'hónap' : plan.interval}
        </p>
      </div>

      <div className="mb-6">
        <ul className="space-y-3">
          {features.map((feature: string, index: number) => (
            <li key={index} className="flex items-start">
              <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <Link
        href={session ? `/${locale}/servers/new?plan=${plan.id}` : `/${locale}/register`}
        className="block"
      >
        <Button
          variant={isPopular ? 'primary' : 'outline'}
          size="lg"
          className="w-full"
        >
          {session ? 'Rendelés' : 'Kezdés'}
        </Button>
      </Link>
    </Card>
  );
}

