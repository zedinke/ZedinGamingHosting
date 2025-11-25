'use client';

import { useSession } from 'next-auth/react';
import { PricingCard } from '@/components/pricing/PricingCard';
import { PricingComparison } from '@/components/pricing/PricingComparison';
import { useState } from 'react';

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
  const [showComparison, setShowComparison] = useState(false);

  // Népszerű csomag meghatározása (általában a középső)
  const popularPlanIndex = plans.length > 1 ? Math.floor(plans.length / 2) : -1;

  return (
    <div>
      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {plans.map((plan, index) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            locale={locale}
            isPopular={index === popularPlanIndex}
            session={session}
          />
        ))}

        {plans.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-600">Jelenleg nincs elérhető árazási csomag</p>
          </div>
        )}
      </div>

      {/* Comparison Toggle */}
      {plans.length > 1 && (
        <div className="mt-12 text-center">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="text-primary-600 hover:text-primary-700 font-semibold underline"
          >
            {showComparison ? 'Összehasonlítás elrejtése' : 'Összehasonlítás megjelenítése'}
          </button>
        </div>
      )}

      {/* Comparison Table */}
      {showComparison && plans.length > 1 && (
        <PricingComparison plans={plans} />
      )}

      {/* FAQ vagy További információk */}
      <div className="mt-16 max-w-3xl mx-auto">
        <Card className="text-center" padding="lg">
          <h3 className="text-xl font-bold mb-4">Kérdések?</h3>
          <p className="text-gray-600 mb-4">
            Nem vagy biztos, melyik csomag a megfelelő? Lépj velünk kapcsolatba!
          </p>
          <a
            href={`/${locale}/dashboard/support/new`}
            className="inline-block text-primary-600 hover:text-primary-700 font-semibold"
          >
            Kapcsolatfelvétel →
          </a>
        </Card>
      </div>
    </div>
  );
}

