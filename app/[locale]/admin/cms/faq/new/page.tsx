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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Új FAQ</h1>
        <p className="text-gray-600">FAQ hozzáadása</p>
      </div>

      <FAQForm locale={locale} />
    </div>
  );
}

