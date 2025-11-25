import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { GamesManagement } from '@/components/admin/cms/GamesManagement';

export default async function AdminGamesPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { categoryId?: string; localeFilter?: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const localeFilter = searchParams.localeFilter || locale;
  const categoryId = searchParams.categoryId;

  const where: any = { locale: localeFilter };
  if (categoryId) {
    where.categoryId = categoryId;
  }

  const [games, categories] = await Promise.all([
    prisma.game.findMany({
      where,
      include: { category: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.gameCategory.findMany({
      where: { locale: localeFilter },
      orderBy: { order: 'asc' },
    }),
  ]);

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Játékok Kezelése</h1>
          <p className="text-gray-700">Játékok és kategóriák kezelése</p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/${locale}/admin/cms/games/categories/new`}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-sm hover:shadow-md"
          >
            Új Kategória
          </a>
          <a
            href={`/${locale}/admin/cms/games/new`}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm hover:shadow-md"
          >
            Új Játék
          </a>
        </div>
      </div>

      <GamesManagement games={games} categories={categories} locale={locale} />
    </div>
  );
}

