import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { PageManagement } from '@/components/admin/cms/PageManagement';

export default async function AdminPagesPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { page?: string; search?: string; localeFilter?: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const pageNum = parseInt(searchParams.page || '1');
  const search = searchParams.search || '';
  const localeFilter = searchParams.localeFilter;
  const itemsPerPage = 20;

  const where: any = {};
  
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' as const } },
      { slug: { contains: search, mode: 'insensitive' as const } },
    ];
  }
  
  if (localeFilter) {
    where.locale = localeFilter;
  }

  const [pages, totalPages] = await Promise.all([
    prisma.page.findMany({
      where,
      skip: (pageNum - 1) * itemsPerPage,
      take: itemsPerPage,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.page.count({ where }),
  ]);

  const totalPagesCount = Math.ceil(totalPages / itemsPerPage);

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Oldalak Kezelése</h1>
          <p className="text-gray-600">Összes oldal: {totalPages}</p>
        </div>
        <a
          href={`/${locale}/admin/cms/pages/new`}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
        >
          Új oldal
        </a>
      </div>

      <PageManagement
        pages={pages}
        currentPage={pageNum}
        totalPages={totalPagesCount}
        locale={locale}
        localeFilter={localeFilter}
      />
    </div>
  );
}

