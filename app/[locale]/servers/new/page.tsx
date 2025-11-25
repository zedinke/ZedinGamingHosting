import { Navigation } from '@/components/Navigation';
import { getTranslations } from '@/lib/i18n';
import { requireAuth } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ServerOrderForm } from '@/components/servers/ServerOrderForm';
import { Footer } from '@/components/home/Footer';

export default async function NewServerPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { plan?: string; game?: string };
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
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Új Szerver Rendelése
            </h1>
            <p className="text-xl text-gray-600">
              Töltsd ki az alábbi űrlapot és szervered percek alatt készen áll
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold">
                  1
                </div>
                <span className="text-sm font-medium">Játék választása</span>
              </div>
              <div className="w-12 h-0.5 bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-semibold">
                  2
                </div>
                <span className="text-sm text-gray-600">Csomag választása</span>
              </div>
              <div className="w-12 h-0.5 bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-semibold">
                  3
                </div>
                <span className="text-sm text-gray-600">Rendelés</span>
              </div>
            </div>
          </div>

          <ServerOrderForm
            plans={plans}
            selectedPlan={selectedPlan}
            locale={locale}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}

