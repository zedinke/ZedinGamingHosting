'use client';

import { Card } from '@/components/ui/Card';
import { Users, Server, Globe, Award } from 'lucide-react';

const stats = [
  { icon: Users, value: '10,000+', label: 'Elégedett Felhasználó' },
  { icon: Server, value: '50,000+', label: 'Aktív Szerver' },
  { icon: Globe, value: '150+', label: 'Ország' },
  { icon: Award, value: '99.9%', label: 'Uptime Garancia' },
];

export function StatsSection() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="text-center" padding="lg">
                <div className="inline-flex items-center justify-center w-12 h-12 mb-4 bg-primary-100 rounded-full">
                  <Icon className="w-6 h-6 text-primary-600" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

