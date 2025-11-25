import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { FAQManagement } from '@/components/admin/cms/FAQManagement';

export default async function AdminFAQPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { localeFilter?: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const localeFilter = searchParams.localeFilter;

  const where: any = {};
  if (localeFilter) {
    where.locale = localeFilter;
  }

  const faqs = await prisma.fAQ.findMany({
    where,
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">FAQ Kezelése</h1>
          <p className="text-gray-600">Gyakran ismételt kérdések</p>
        </div>
        <a
          href={`/${locale}/admin/cms/faq/new`}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
        >
          Új FAQ
        </a>
      </div>

      <FAQManagement faqs={faqs} locale={locale} localeFilter={localeFilter} />
    </div>
  );
}

