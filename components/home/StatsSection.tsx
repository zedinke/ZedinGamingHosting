'use client';

import { Card } from '@/components/ui/Card';
import { Users, Server, Globe, Award } from 'lucide-react';

interface HomepageSection {
  id: string;
  type: string;
  content: any;
}

const defaultStats = [
  { icon: Users, value: '10,000+', label: 'Elégedett Felhasználó' },
  { icon: Server, value: '50,000+', label: 'Aktív Szerver' },
  { icon: Globe, value: '150+', label: 'Ország' },
  { icon: Award, value: '99.9%', label: 'Uptime Garancia' },
];

interface StatsSectionProps {
  section?: HomepageSection;
}

export function StatsSection({ section }: StatsSectionProps) {
  // Parse stats from section content if available
  let stats = defaultStats;
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
            Zahlen, Daten und Fakten
          </h2>
          <p className="text-gray-600">
            Vertrauen von mehr als 50.000 Spielern und 8 Partnern
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

