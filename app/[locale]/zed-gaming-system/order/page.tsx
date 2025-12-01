import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/home/Footer';
import { getTranslations } from '@/lib/i18n';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { SaaSOrderForm } from '@/components/saas/SaaSOrderForm';

export default async function SaaSOrderPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { plan?: string };
}) {
  const t = getTranslations(locale, 'common');

  if (!searchParams.plan) {
    redirect(`/${locale}/zed-gaming-system`);
  }

  const plan = await prisma.saaSPlan.findUnique({
    where: { id: searchParams.plan },
  });

  if (!plan || !plan.isActive) {
    redirect(`/${locale}/zed-gaming-system`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation locale={locale} />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">
              Megrendelés - {plan.displayName}
            </h1>
            <p className="text-gray-600">
              Töltse ki az alábbi űrlapot a megrendeléshez
            </p>
          </div>

          <SaaSOrderForm plan={plan} locale={locale} />
        </div>
      </main>

      <Footer />
    </div>
  );
}

