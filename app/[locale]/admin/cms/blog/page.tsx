import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { BlogManagement } from '@/components/admin/cms/BlogManagement';

export default async function AdminBlogPage({
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

  const [posts, totalPosts] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      skip: (pageNum - 1) * itemsPerPage,
      take: itemsPerPage,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.blogPost.count({ where }),
  ]);

  const totalPagesCount = Math.ceil(totalPosts / itemsPerPage);

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Blog Bejegyzések</h1>
          <p className="text-gray-600">Összes bejegyzés: {totalPosts}</p>
        </div>
        <a
          href={`/${locale}/admin/cms/blog/new`}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
        >
          Új bejegyzés
        </a>
      </div>

      <BlogManagement
        posts={posts}
        currentPage={pageNum}
        totalPages={totalPagesCount}
        locale={locale}
        localeFilter={localeFilter}
      />
    </div>
  );
}

