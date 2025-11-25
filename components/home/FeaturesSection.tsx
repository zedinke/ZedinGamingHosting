'use client';

import { Card } from '@/components/ui/Card';
import { getNestedValue } from '@/lib/translations';
import { Server, Zap, Shield, Headphones, Clock, Globe } from 'lucide-react';

interface FeaturesSectionProps {
  locale: string;
  translations: any;
}

const features = [
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

export function FeaturesSection({ locale, translations }: FeaturesSectionProps) {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Miért válassz minket?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Minden, amire szükséged van egy professzionális gaming szerverhez
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} hover className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-primary-100 rounded-full">
                  <Icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

