import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { HomepageSectionForm } from '@/components/admin/cms/HomepageSectionForm';

export default async function NewHomepageSectionPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Új Homepage Szekció</h1>
        <p className="text-gray-700">Homepage szekció hozzáadása</p>
      </div>

      <HomepageSectionForm locale={locale} />
    </div>
  );
}

