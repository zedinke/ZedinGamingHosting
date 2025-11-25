import { Navigation } from '@/components/Navigation';
import { getTranslations } from '@/lib/i18n';
import { prisma } from '@/lib/prisma';
import { PricingSection } from '@/components/PricingSection';

export default async function PricingPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = getTranslations(locale, 'common');

  const plans = await prisma.pricingPlan.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation locale={locale} />
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Árazás</h1>
          <p className="text-xl text-gray-600">
            Válassz egy csomagot, amely megfelel az igényeidnek
          </p>
        </div>

        <PricingSection plans={plans} locale={locale} />
      </main>
    </div>
  );
}

