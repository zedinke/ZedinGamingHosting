import { Navigation } from '@/components/Navigation';
import { getTranslations } from '@/lib/i18n';
import { GameGrid } from '@/components/games/GameGrid';
import { Footer } from '@/components/home/Footer';

export default async function GamesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = getTranslations(locale, 'common');

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

        <GameGrid locale={locale} />
      </main>
      <Footer />
    </div>
  );
}

