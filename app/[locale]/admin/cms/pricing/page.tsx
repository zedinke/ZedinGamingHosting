import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { PricingManagement } from '@/components/admin/cms/PricingManagement';

export default async function AdminPricingPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const plans = await prisma.pricingPlan.findMany({
    orderBy: { order: 'asc' },
  });

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Árazási Csomagok</h1>
          <p className="text-gray-700">Árazási terv kezelése</p>
        </div>
        <a
          href={`/${locale}/admin/cms/pricing/new`}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm hover:shadow-md"
        >
          Új csomag
        </a>
      </div>

      <PricingManagement plans={plans} locale={locale} />
    </div>
  );
}

