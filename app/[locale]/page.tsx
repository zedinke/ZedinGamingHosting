import { getTranslations } from '@/lib/i18n';
import { Navigation } from '@/components/Navigation';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { StatsSection } from '@/components/home/StatsSection';
import { CTASection } from '@/components/home/CTASection';
import { SlideshowSection } from '@/components/home/SlideshowSection';
import { PartnersSection } from '@/components/home/PartnersSection';
import { Footer } from '@/components/home/Footer';
import { PriceCalculator } from '@/components/home/PriceCalculator';
import { prisma } from '@/lib/prisma';
import { readFileSync } from 'fs';
import { join } from 'path';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  // Ellenőrizzük, hogy a locale érvényes-e (pl. favicon.ico ne legyen locale)
  const VALID_LOCALES = ['hu', 'en', 'es'];
  const staticFileExtensions = ['.ico', '.txt', '.xml', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.css', '.js'];
  const isStaticFile = staticFileExtensions.some(ext => locale.toLowerCase().endsWith(ext));
  
  // Ha nem érvényes locale vagy statikus fájl, használjuk az angolt
  const validLocale = (VALID_LOCALES.includes(locale) && !isStaticFile) ? locale : 'en';
  
  const t = getTranslations(validLocale, 'common');
  
  // Load translations server-side
  let translations = {};
  try {
    const filePath = join(process.cwd(), 'public', 'locales', validLocale, 'common.json');
    const fileContents = readFileSync(filePath, 'utf8');
    translations = JSON.parse(fileContents);
  } catch (error) {
    // Csak akkor logoljuk, ha valódi locale, ne a favicon.ico-t
    if (VALID_LOCALES.includes(locale) && !isStaticFile) {
      console.error('Failed to load translations:', error);
    }
  }

  // Load homepage sections from database
  const [homepageSections, slideshowSlides, slideshowInterval] = await Promise.all([
    prisma.homepageSection.findMany({
      where: {
        locale: validLocale,
        isActive: true,
      },
      orderBy: { order: 'asc' },
    }),
    prisma.slideshowSlide.findMany({
      where: {
        locale: validLocale,
        isActive: true,
      },
      orderBy: { order: 'asc' },
    }),
    prisma.setting.findUnique({
      where: { key: 'slideshow_transition_interval' },
    }),
  ]);

  // Get transition interval (default: 5 seconds)
  const transitionInterval = slideshowInterval 
    ? parseInt(slideshowInterval.value, 10) || 5 
    : 5;

  // Get sections by type
  const heroSection = homepageSections.find((s) => s.type === 'hero');
  const featuresSection = homepageSections.find((s) => s.type === 'features');
  const statsSection = homepageSections.find((s) => s.type === 'stats');
  const ctaSection = homepageSections.find((s) => s.type === 'cta');

  return (
    <div className="min-h-screen bg-white">
      <Navigation locale={locale} />

      <main>
        {/* Hero Section with Slideshow Background */}
        <section className="relative w-full h-screen min-h-[600px] overflow-hidden bg-white">
          {/* Slideshow Background */}
          <SlideshowSection slides={slideshowSlides} locale={locale} transitionInterval={transitionInterval} />
          
          {/* Hero Content Overlay - 80% darkened bar */}
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="container mx-auto px-4">
              {/* 80% darkened bar background */}
              <div className="max-w-4xl mx-auto bg-black/80 backdrop-blur-sm rounded-2xl p-8 md:p-12 shadow-2xl">
                <div className="text-center text-white">
                  {/* Badge */}
                  <div className="inline-flex items-center px-4 py-2 mb-6 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                    <span className="text-sm font-semibold">
                      ✨ {t('hero.badge') || 'Gaming Server Hosting'}
                    </span>
                  </div>

                  {/* Main heading */}
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-white">
                    {heroSection?.title || t('hero.title')}
                  </h1>

                  {/* Subtitle */}
                  <p className="text-lg md:text-xl lg:text-2xl mb-10 text-gray-100 max-w-2xl mx-auto leading-relaxed">
                    {heroSection?.subtitle || t('hero.subtitle')}
                  </p>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                    <Link href={`/${locale}/register`}>
                      <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-colors">
                        {heroSection?.buttonText || t('hero.cta')} →
                      </Button>
                    </Link>
                    <Link href={`/${locale}/pricing`}>
                      <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-lg font-semibold transition-colors">
                        {t('hero.learnMore')}
                      </Button>
                    </Link>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-16 border-t border-white/20">
                    {[
                      { value: '99.99%', label: t('hero.stats.uptime') || 'Average Uptime' },
                      { value: '100%', label: t('hero.stats.flexibility') || 'Flexibility' },
                      { value: '9', label: t('hero.stats.locations') || 'Server Locations' },
                      { value: '24/7', label: t('hero.stats.support') || 'Support' },
                    ].map((stat, index) => (
                      <div key={index} className="text-center">
                        <div className="text-3xl md:text-4xl font-bold mb-2 text-white">{stat.value}</div>
                        <div className="text-sm text-gray-200">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

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

        {/* Partners Section */}
        <PartnersSection locale={locale} />

        {/* Price Calculator Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <PriceCalculator locale={validLocale} />
          </div>
        </section>

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

