import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { HomepageSectionsManagement } from '@/components/admin/cms/HomepageSectionsManagement';

export default async function AdminHomepagePage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { localeFilter?: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const localeFilter = searchParams.localeFilter || locale;

  const sections = await prisma.homepageSection.findMany({
    where: { locale: localeFilter },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Kezdőoldal Szerkesztése</h1>
          <p className="text-gray-600">Homepage szekciók kezelése</p>
        </div>
        <a
          href={`/${locale}/admin/cms/homepage/new`}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Új Szekció
        </a>
      </div>

      <HomepageSectionsManagement sections={sections} locale={locale} />
    </div>
  );
}

