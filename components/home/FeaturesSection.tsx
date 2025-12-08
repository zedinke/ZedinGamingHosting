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

export function FeaturesSection({ locale, translations, section }: FeaturesSectionProps) {
  const t = (key: string) => getNestedValue(translations, key) || key;

  // Default features sourced from translations to avoid hardcoded strings
  const translatedDefaults = [
    {
      icon: Zap,
      title: t('home.features.items.fast.title') || 'Fast & Reliable',
      description: t('home.features.items.fast.description') || 'SSD storage and powerful CPUs keep performance smooth.',
    },
    {
      icon: Shield,
      title: t('home.features.items.ddos.title') || 'DDoS Protection',
      description: t('home.features.items.ddos.description') || 'Automatic DDoS protection on every server.',
    },
    {
      icon: Server,
      title: t('home.features.items.management.title') || 'Easy Management',
      description: t('home.features.items.management.description') || 'Intuitive panel with console, file manager, backups.',
    },
    {
      icon: Headphones,
      title: t('home.features.items.support.title') || '24/7 Support',
      description: t('home.features.items.support.description') || 'Expert team via Discord, email, and tickets.',
    },
    {
      icon: Clock,
      title: t('home.features.items.instant.title') || 'Instant Setup',
      description: t('home.features.items.instant.description') || 'Servers ready in minutes with automated install.',
    },
    {
      icon: Globe,
      title: t('home.features.items.multilang.title') || 'Multilingual',
      description: t('home.features.items.multilang.description') || 'Interfaces, docs, and support in multiple languages.',
    },
  ];

  // Parse features from section content if available
  let features = translatedDefaults;
  if (section?.content && typeof section.content === 'object') {
    if (Array.isArray(section.content)) {
      features = section.content;
    } else if (section.content.features && Array.isArray(section.content.features)) {
      features = section.content.features;
    }
  }

  const title = section?.title || t('home.features.title') || 'Why choose us?';
  const subtitle = section?.subtitle || t('home.features.subtitle') || 'Everything you need for a professional gaming server';

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

