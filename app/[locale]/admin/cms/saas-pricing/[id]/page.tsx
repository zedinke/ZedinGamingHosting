import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { SAASPricingForm } from '@/components/admin/cms/SAASPricingForm';

export default async function EditSAASPlanPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const plan = await prisma.saaSPlan.findUnique({
    where: { id },
  });

  if (!plan) {
    redirect(`/${locale}/admin/cms/saas-pricing`);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SaaS Csomag Szerkesztése</h1>
        <p className="text-gray-700">{plan.displayName}</p>
      </div>

      <SAASPricingForm plan={plan} locale={locale} />
    </div>
  );
}

