'use client';

import { Check, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: any;
  order: number;
}

interface PricingComparisonProps {
  plans: PricingPlan[];
}

export function PricingComparison({ plans }: PricingComparisonProps) {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Összegyűjtjük az összes feature-t
  const allFeatures = new Set<string>();
  plans.forEach((plan) => {
    if (plan.features && Array.isArray(plan.features)) {
      plan.features.forEach((feature: string) => allFeatures.add(feature));
    }
  });

  const featureList = Array.from(allFeatures);

  return (
    <div className="mt-16">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Összehasonlítás</h2>
        <p className="text-gray-600">Hasonlítsd össze a csomagokat</p>
      </div>

      <div className="overflow-x-auto">
        <Card className="p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left p-4 font-semibold text-gray-900">Funkció</th>
                {plans.map((plan) => (
                  <th key={plan.id} className="text-center p-4">
                    <div className="font-bold text-lg">{plan.name}</div>
                    <div className="text-primary-600 font-semibold mt-1">
                      {formatPrice(plan.price, plan.currency)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureList.map((feature, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-4 text-gray-700">{feature}</td>
                  {plans.map((plan) => {
                    const hasFeature = plan.features && Array.isArray(plan.features) && plan.features.includes(feature);
                    return (
                      <td key={plan.id} className="text-center p-4">
                        {hasFeature ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

