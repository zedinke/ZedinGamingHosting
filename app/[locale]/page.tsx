import { getTranslations } from '@/lib/i18n';
import { Navigation } from '@/components/Navigation';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { StatsSection } from '@/components/home/StatsSection';
import { CTASection } from '@/components/home/CTASection';
import { Footer } from '@/components/home/Footer';
import { readFileSync } from 'fs';
import { join } from 'path';

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = getTranslations(locale, 'common');
  
  // Load translations server-side
  let translations = {};
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

      <main>
        <HeroSection locale={locale} translations={translations} />
        <FeaturesSection locale={locale} translations={translations} />
        <StatsSection />
        <CTASection locale={locale} translations={translations} />
      </main>

      <Footer />
    </div>
  );
}

