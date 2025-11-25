'use client';

import { Card } from '@/components/ui/Card';
import { getNestedValue } from '@/lib/translations';
import { Server, Zap, Shield, Headphones, Clock, Globe } from 'lucide-react';

interface HomepageSection {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  content: any;
}

interface FeaturesSectionProps {
  locale: string;
  translations: any;
  section?: HomepageSection;
}

const defaultFeatures = [
  {
    icon: Zap,
    title: 'Gyors & Megbízható',
    description: 'SSD tárhely és erős processzorok garantálják a zökkenőmentes játékélményt. Alacsony latency, magas teljesítmény.',
  },
  {
    icon: Shield,
    title: 'DDoS Védelem',
    description: 'Automatikus DDoS védelem minden szerverünkön. Játssz bátran, mi gondoskodunk a biztonságról.',
  },
  {
    icon: Server,
    title: 'Könnyű Kezelés',
    description: 'Intuitív vezérlőpult, ahol mindent egy helyen kezelhetsz. Fájlkezelés, konzol, backup - minden kéznél.',
  },
  {
    icon: Headphones,
    title: '24/7 Támogatás',
    description: 'Szakértő csapatunk mindig elérhető, ha segítségre van szükséged. Discord, email, ticket rendszer.',
  },
  {
    icon: Clock,
    title: 'Azonnali Telepítés',
    description: 'Szervered percek alatt készen áll. Automatikus telepítés, konfiguráció és indítás.',
  },
  {
    icon: Globe,
    title: 'Többnyelvű Támogatás',
    description: 'Magyar és angol nyelvű felület, dokumentáció és támogatás. Könnyű használat bárhol.',
  },
];

export function FeaturesSection({ locale, translations, section }: FeaturesSectionProps) {
  // Parse features from section content if available
  let features = defaultFeatures;
  if (section?.content && typeof section.content === 'object') {
    if (Array.isArray(section.content)) {
      features = section.content;
    } else if (section.content.features && Array.isArray(section.content.features)) {
      features = section.content.features;
    }
  }

  const title = section?.title || 'Miért válassz minket?';
  const subtitle = section?.subtitle || 'Minden, amire szükséged van egy professzionális gaming szerverhez';

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            {title}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group text-center p-6 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                  <Icon className="w-8 h-8 text-gray-700" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

