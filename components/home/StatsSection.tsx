'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Users, Server, Globe, Award } from 'lucide-react';
import { loadTranslations, getNestedValue } from '@/lib/translations';

interface HomepageSection {
  id: string;
  type: string;
  content: any;
  // Prisma mezők is lehetnek jelen
  createdAt?: Date;
  updatedAt?: Date;
  title?: string | null;
  locale?: string;
  order?: number;
  isActive?: boolean;
  image?: string | null;
  subtitle?: string | null;
  buttonText?: string | null;
  buttonLink?: string | null;
}

const defaultStats = [
  { icon: Users, value: '10,000+', label: 'Elégedett Felhasználó' },
  { icon: Server, value: '50,000+', label: 'Aktív Szerver' },
  { icon: Globe, value: '150+', label: 'Ország' },
  { icon: Award, value: '99.9%', label: 'Uptime Garancia' },
];

interface StatsSectionProps {
  section?: HomepageSection;
  locale: string;
}

export function StatsSection({ section, locale }: StatsSectionProps) {
  const [translations, setTranslations] = useState<any>({});

  useEffect(() => {
    loadTranslations(locale, 'common').then(setTranslations);
  }, [locale]);

  const t = (key: string) => getNestedValue(translations, key) || key;

  // Parse stats from section content if available
  let stats = defaultStats.map((stat) => ({
    ...stat,
    label:
      stat.label === 'Elégedett Felhasználó'
        ? t('home.stats.satisfiedUsers') || stat.label
        : stat.label === 'Aktív Szerver'
        ? t('home.stats.activeServers') || stat.label
        : stat.label === 'Ország'
        ? t('home.stats.countries') || stat.label
        : stat.label === 'Uptime Garancia'
        ? t('home.stats.uptime') || stat.label
        : stat.label,
  }));
  if (section?.content && typeof section.content === 'object') {
    if (Array.isArray(section.content)) {
      stats = section.content;
    } else if (section.content.stats && Array.isArray(section.content.stats)) {
      stats = section.content.stats;
    }
  }
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">
            {t('home.stats.title') || 'Numbers that matter'}
          </h2>
          <p className="text-gray-600">
            {t('home.stats.subtitle') || 'Trusted by thousands of players and partners'}
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-white rounded-full shadow-sm">
                  <Icon className="w-8 h-8 text-gray-700" />
                </div>
                <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

