import { getTranslations } from '@/lib/i18n';
import { Navigation } from '@/components/Navigation';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { StatsSection } from '@/components/home/StatsSection';
import { CTASection } from '@/components/home/CTASection';
import { SlideshowSection } from '@/components/home/SlideshowSection';
import { Footer } from '@/components/home/Footer';
import { prisma } from '@/lib/prisma';
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

  // Load homepage sections from database
  const [homepageSections, slideshowSlides] = await Promise.all([
    prisma.homepageSection.findMany({
      where: {
        locale,
        isActive: true,
      },
      orderBy: { order: 'asc' },
    }),
    prisma.slideshowSlide.findMany({
      where: {
        locale,
        isActive: true,
      },
      orderBy: { order: 'asc' },
    }),
  ]);

  // Get sections by type
  const heroSection = homepageSections.find((s) => s.type === 'hero');
  const featuresSection = homepageSections.find((s) => s.type === 'features');
  const statsSection = homepageSections.find((s) => s.type === 'stats');
  const ctaSection = homepageSections.find((s) => s.type === 'cta');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation locale={locale} />

      <main>
        {/* Slideshow */}
        {slideshowSlides.length > 0 && (
          <SlideshowSection slides={slideshowSlides} locale={locale} />
        )}

        {/* Hero Section - Use database if available, otherwise fallback to component */}
        {heroSection ? (
          <HeroSection
            locale={locale}
            translations={translations}
            section={heroSection}
          />
        ) : (
          <HeroSection locale={locale} translations={translations} />
        )}

        {/* Features Section */}
        {featuresSection ? (
          <FeaturesSection
            locale={locale}
            translations={translations}
            section={featuresSection}
          />
        ) : (
          <FeaturesSection locale={locale} translations={translations} />
        )}

        {/* Stats Section */}
        {statsSection ? (
          <StatsSection section={statsSection} />
        ) : (
          <StatsSection />
        )}

        {/* CTA Section */}
        {ctaSection ? (
          <CTASection
            locale={locale}
            translations={translations}
            section={ctaSection}
          />
        ) : (
          <CTASection locale={locale} translations={translations} />
        )}
      </main>

      <Footer />
    </div>
  );
}

