import { Navigation } from '@/components/Navigation';
import { getTranslations } from '@/lib/i18n';
import { requireAuth } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ServerOrderForm } from '@/components/ServerOrderForm';

export default async function NewServerPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { plan?: string };
}) {
  await requireAuth();
  const t = getTranslations(locale, 'common');

  const selectedPlan = searchParams.plan
    ? await prisma.pricingPlan.findUnique({
        where: { id: searchParams.plan },
      })
    : null;

  const plans = await prisma.pricingPlan.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation locale={locale} />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Új Szerver Rendelése</h1>
          <ServerOrderForm
            plans={plans}
            selectedPlan={selectedPlan}
            locale={locale}
          />
        </div>
      </main>
    </div>
  );
}

