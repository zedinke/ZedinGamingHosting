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
    <section className="relative overflow-hidden">
      {/* Modern Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
      
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative container mx-auto px-4 py-16 md:py-24 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Premium badge */}
          <div className="inline-flex items-center px-4 py-2 mb-8 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-colors">
            <span className="text-sm font-medium text-white/90">
              ✨ Legjobb Gaming Szerver Hosting
            </span>
          </div>

          {/* Main heading - modern and impactful */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-white">
            {title}
            <span className="block h-1 w-24 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full mx-auto mt-4"></span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>

          {/* CTA Buttons - Premium design */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link href={buttonLink}>
              <Button size="lg" className="bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 px-10 py-4 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-2xl">
                {buttonText} →
              </Button>
            </Link>
            <Link href={learnMoreLink}>
              <Button variant="outline" size="lg" className="border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm px-10 py-4 rounded-lg font-semibold transition-all">
                {t('hero.learnMore')}
              </Button>
            </Link>
          </div>

          {/* Stats - premium layout */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-16 pt-16 border-t border-white/10">
            {[
              { value: '99.99%', label: 'Átlagos Uptime' },
              { value: '100%', label: 'Flexibilitás' },
              { value: '9', label: 'Szerver Helyszín' },
              { value: '24/7', label: 'Támogatás' },
            ].map((stat, index) => (
              <div
                key={index}
                className="text-center group"
              >
                <div className="text-3xl md:text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 group-hover:from-purple-300 group-hover:to-blue-300 transition-all">{stat.value}</div>
                <div className="text-sm text-white/70 group-hover:text-white/90 transition-colors">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

