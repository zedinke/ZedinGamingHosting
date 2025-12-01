import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { SAASPricingForm } from '@/components/admin/cms/SAASPricingForm';

export default async function NewSAASPlanPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Új SaaS Csomag</h1>
        <p className="text-gray-700">Új bérleti csomag létrehozása</p>
      </div>

      <SAASPricingForm locale={locale} />
    </div>
  );
}

