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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Új Vélemény</h1>
        <p className="text-gray-600">Vélemény hozzáadása</p>
      </div>

      <TestimonialForm locale={locale} />
    </div>
  );
}

