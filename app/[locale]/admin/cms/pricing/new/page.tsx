import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { PricingPlanForm } from '@/components/admin/cms/PricingPlanForm';

export default async function NewPricingPlanPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Új Árazási Csomag</h1>
        <p className="text-gray-600">Árazási csomag hozzáadása</p>
      </div>

      <PricingPlanForm locale={locale} />
    </div>
  );
}

