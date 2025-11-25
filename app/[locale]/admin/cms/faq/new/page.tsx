import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { FAQForm } from '@/components/admin/cms/FAQForm';

export default async function NewFAQPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Új FAQ</h1>
        <p className="text-gray-700">FAQ hozzáadása</p>
      </div>

      <FAQForm locale={locale} />
    </div>
  );
}

