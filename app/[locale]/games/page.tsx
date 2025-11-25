import { Navigation } from '@/components/Navigation';
import { getTranslations } from '@/lib/i18n';
import { GameGrid } from '@/components/games/GameGrid';
import { Footer } from '@/components/home/Footer';
import { prisma } from '@/lib/prisma';

export default async function GamesPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { category?: string };
}) {
  const t = getTranslations(locale, 'common');

  // Load games and categories from database
  const where: any = {
    locale,
    isActive: true,
  };

  if (searchParams.category) {
    const category = await prisma.gameCategory.findUnique({
      where: { slug: searchParams.category },
    });
    if (category) {
      where.categoryId = category.id;
    }
  }

  const [games, categories] = await Promise.all([
    prisma.game.findMany({
      where,
      include: { category: true },
      orderBy: { order: 'asc' },
    }),
    prisma.gameCategory.findMany({
      where: { locale, isActive: true },
      orderBy: { order: 'asc' },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation locale={locale} />
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            Támogatott Játékok
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Válassz a legnépszerűbb játékok közül és indítsd el a szervered percek alatt
          </p>
        </div>

        {/* Category filters */}
        {categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <a
              href={`/${locale}/games`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !searchParams.category
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Összes
            </a>
            {categories.map((category) => (
              <a
                key={category.id}
                href={`/${locale}/games?category=${category.slug}`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  searchParams.category === category.slug
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={
                  searchParams.category === category.slug && category.color
                    ? { backgroundColor: category.color }
                    : {}
                }
              >
                {category.icon && <span className="mr-1">{category.icon}</span>}
                {category.name}
              </a>
            ))}
          </div>
        )}

        <GameGrid games={games} locale={locale} />
      </main>
      <Footer />
    </div>
  );
}

