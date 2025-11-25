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
    <section className="py-24 bg-dark-900 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 hexagon-pattern opacity-10"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-block px-4 py-2 mb-6 glass-effect rounded-full border border-primary-500/30">
            <span className="text-sm font-semibold text-primary-400 uppercase tracking-wider">Funkciók</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-glow">
            <span className="bg-clip-text text-transparent gamer-gradient">
              {title}
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group card-glow text-center p-8 hover:scale-105 transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-2xl border border-primary-500/30 group-hover:border-primary-400 group-hover:shadow-neon transition-all duration-300">
                  <Icon className="w-10 h-10 text-primary-400 group-hover:text-primary-300 transition-colors" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-primary-300 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                  {feature.description}
                </p>
                <div className="mt-6 h-1 w-0 bg-gradient-to-r from-primary-500 to-secondary-500 group-hover:w-full transition-all duration-500 rounded-full"></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

