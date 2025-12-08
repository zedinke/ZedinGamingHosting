'use client';

import { useEffect, useState } from 'react';
import { loadTranslations, getNestedValue } from '@/lib/translations';

interface Partner {
  name: string;
  logo: string;
  url?: string;
}

interface PartnersSectionProps {
  partners?: Partner[];
  locale: string;
}

const defaultPartners: Partner[] = [
  { name: 'Stunlock Studios', logo: '/images/partners/stunlock.png' },
  { name: 'Funcom', logo: '/images/partners/funcom.png' },
  { name: 'Giants Software', logo: '/images/partners/giants.png' },
  { name: 'FiveM', logo: '/images/partners/fivem.png' },
  { name: 'Gamepires', logo: '/images/partners/gamepires.png' },
  { name: 'Channel 3 Entertainment', logo: '/images/partners/channel3.png' },
  { name: 'Treehouse Games', logo: '/images/partners/treehouse.png' },
  { name: 'Astrolabe Interactive', logo: '/images/partners/astrolabe.png' },
];

export function PartnersSection({ partners = defaultPartners, locale }: PartnersSectionProps) {
  const [translations, setTranslations] = useState<any>({});

  useEffect(() => {
    loadTranslations(locale, 'common').then(setTranslations);
  }, [locale]);

  const t = (key: string) => getNestedValue(translations, key) || key;

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900">
            {t('home.partners.title') || 'Official Partners'}
          </h2>
          <p className="text-gray-600">
            {t('home.partners.subtitle') || 'Recommended by game studios'}
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-8 items-center">
          {partners.map((partner, index) => (
            <div
              key={index}
              className="flex items-center justify-center h-16 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
            >
              {partner.url ? (
                <a href={partner.url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="max-h-12 max-w-full object-contain mx-auto"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </a>
              ) : (
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="max-h-12 max-w-full object-contain mx-auto"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

