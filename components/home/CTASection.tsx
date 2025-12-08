'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { getNestedValue } from '@/lib/translations';

interface HomepageSection {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  buttonText: string | null;
  buttonLink: string | null;
}

interface CTASectionProps {
  locale: string;
  translations: any;
  section?: HomepageSection;
}

export function CTASection({ locale, translations, section }: CTASectionProps) {
  const t = (key: string) => getNestedValue(translations, key) || key;

  const title = section?.title || t('pages.cta.title') || 'Ready to start?';
  const subtitle = section?.subtitle || t('pages.cta.registerNow') || 'Register now and get 24 hours free trial!';
  const buttonText = section?.buttonText || t('pages.cta.freeRegistration') || 'Free Registration';
  const buttonLink = section?.buttonLink || `/${locale}/register`;

  return (
    <section className="py-20 bg-gray-900 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {title}
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            {subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={buttonLink}>
              <Button size="lg" className="w-full sm:w-auto bg-white text-gray-900 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-colors">
                {buttonText}
              </Button>
            </Link>
            <Link href={`/${locale}/pricing`}>
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-lg font-semibold transition-colors">
                {t('pages.cta.viewPricing') || 'View Pricing'}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

