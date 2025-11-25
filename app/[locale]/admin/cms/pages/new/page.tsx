import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { PageForm } from '@/components/admin/cms/PageForm';

export default async function NewPagePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Új Oldal</h1>
        <p className="text-gray-700">Oldal hozzáadása</p>
      </div>

      <PageForm locale={locale} />
    </div>
  );
}

