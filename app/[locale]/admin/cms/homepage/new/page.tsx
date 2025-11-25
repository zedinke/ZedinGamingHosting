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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Új Homepage Szekció</h1>
        <p className="text-gray-600">Homepage szekció hozzáadása</p>
      </div>

      <HomepageSectionForm locale={locale} />
    </div>
  );
}

