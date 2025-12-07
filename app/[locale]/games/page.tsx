import { Navigation } from '@/components/Navigation';
import { getTranslations } from '@/lib/i18n';
import { GamesSection } from '@/components/games/GamesSection';
import { Footer } from '@/components/home/Footer';
import { readFileSync } from 'fs';
import { join } from 'path';

export default async function GamesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = getTranslations(locale, 'common');

  // Load translations server-side
  let translations: any = {};
  try {
    const filePath = join(process.cwd(), 'public', 'locales', locale, 'common.json');
    const fileContents = readFileSync(filePath, 'utf8');
    translations = JSON.parse(fileContents);
  } catch (error) {
    console.error('Failed to load translations:', error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation locale={locale} />
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            {translations?.pages?.games?.title || 'Game Servers'}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {translations?.pages?.games?.subtitle || 'Choose a game and package to start your own server'}
          </p>
        </div>

        {/* Games Section */}
        <GamesSection locale={locale} />
      </main>
      <Footer />
    </div>
  );
}
