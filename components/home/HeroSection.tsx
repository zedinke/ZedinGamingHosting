'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { getNestedValue } from '@/lib/translations';
import { useEffect, useState } from 'react';

interface HomepageSection {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  content: any;
  image: string | null;
  buttonText: string | null;
  buttonLink: string | null;
}

interface HeroSectionProps {
  locale: string;
  translations: any;
  section?: HomepageSection;
}

export function HeroSection({ locale, translations, section }: HeroSectionProps) {
  const t = (key: string) => getNestedValue(translations, key) || key;

  // Use section data if available, otherwise use translations
  const title = section?.title || t('hero.title');
  const subtitle = section?.subtitle || t('hero.subtitle');
  const buttonText = section?.buttonText || t('hero.cta');
  const buttonLink = section?.buttonLink || `/${locale}/register`;
  const learnMoreLink = `/${locale}/pricing`;

  return (
    <section className="relative overflow-hidden bg-white">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="relative container mx-auto px-4 py-16 md:py-24 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Simple badge */}
          <div className="inline-flex items-center px-4 py-2 mb-6 bg-gray-100 rounded-full">
            <span className="text-sm font-medium text-gray-700">
              Legjobb Gaming Szerver Hosting
            </span>
          </div>

          {/* Main heading - clean and modern */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-gray-900">
            {title}
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>

          {/* CTA Buttons - clean design */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href={buttonLink}>
              <Button size="lg" className="bg-gray-900 text-white hover:bg-gray-800 px-8 py-3 rounded-lg font-semibold transition-colors">
                {buttonText}
              </Button>
            </Link>
            <Link href={learnMoreLink}>
              <Button variant="outline" size="lg" className="border-2 border-gray-900 text-gray-900 hover:bg-gray-50 px-8 py-3 rounded-lg font-semibold transition-colors">
                {t('hero.learnMore')}
              </Button>
            </Link>
          </div>

          {/* Stats - clean and minimal */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mt-16 pt-16 border-t border-gray-200">
            {[
              { value: '99.99%', label: 'Átlagos Uptime' },
              { value: '100%', label: 'Flexibilitás' },
              { value: '9', label: 'Szerver Helyszín' },
              { value: '24/7', label: 'Támogatás' },
            ].map((stat, index) => (
              <div
                key={index}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

