import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { PricingPlanForm } from '@/components/admin/cms/PricingPlanForm';
import { notFound } from 'next/navigation';

export default async function EditPricingPlanPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const plan = await prisma.pricingPlan.findUnique({
    where: { id },
  });

  if (!plan) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Árazási Csomag Szerkesztése</h1>
        <p className="text-gray-600">{plan.name}</p>
      </div>

      <PricingPlanForm locale={locale} plan={plan} />
    </div>
  );
}

