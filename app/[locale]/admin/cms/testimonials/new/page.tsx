import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { TestimonialForm } from '@/components/admin/cms/TestimonialForm';

export default async function NewTestimonialPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Új Vélemény</h1>
        <p className="text-gray-700">Vélemény hozzáadása</p>
      </div>

      <TestimonialForm locale={locale} />
    </div>
  );
}

