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
    <section className="relative overflow-hidden min-h-screen flex items-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white">
      {/* Animated grid pattern background */}
      <div className="absolute inset-0 grid-pattern opacity-20"></div>
      
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary-400 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${6 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="relative container mx-auto px-4 py-20 md:py-32 z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge with glow effect */}
          <div className="inline-flex items-center px-6 py-3 mb-8 glass-effect rounded-full border border-primary-500/50 shadow-neon animate-slide-up">
            <span className="text-sm font-semibold text-primary-300 flex items-center gap-2">
              <span className="w-2 h-2 bg-neon-cyan rounded-full animate-glow-pulse"></span>
              Legjobb Gaming Szerver Hosting
            </span>
          </div>

          {/* Main heading with glow */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight text-glow animate-fade-in">
            <span className="bg-clip-text text-transparent gamer-gradient">
              {title}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-up">
            {subtitle}
          </p>

          {/* CTA Buttons with enhanced effects */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 animate-slide-up">
            <Link href={buttonLink} className="group">
              <Button size="lg" className="btn-primary btn-glow w-full sm:w-auto text-lg px-8 py-4">
                <span className="flex items-center gap-2">
                  {buttonText}
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </Button>
            </Link>
            <Link href={learnMoreLink}>
              <Button variant="outline" size="lg" className="btn-secondary w-full sm:w-auto text-lg px-8 py-4">
                {t('hero.learnMore')}
              </Button>
            </Link>
          </div>

          {/* Enhanced Stats with cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-20 animate-fade-in">
            {[
              { value: '99.9%', label: 'Uptime', icon: '⚡' },
              { value: '24/7', label: 'Támogatás', icon: '🎮' },
              { value: 'SSD', label: 'Tárhely', icon: '💾' },
              { value: 'DDoS', label: 'Védelem', icon: '🛡️' },
            ].map((stat, index) => (
              <div
                key={index}
                className="card-glow text-center p-6 hover:scale-105 transition-transform duration-300"
              >
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-3xl md:text-4xl font-bold mb-2 text-primary-400">{stat.value}</div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modern wave separator with gradient */}
      <div className="absolute bottom-0 left-0 right-0 z-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(13, 17, 23)" stopOpacity="1" />
              <stop offset="100%" stopColor="rgb(13, 17, 23)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="url(#waveGradient)"
          />
        </svg>
      </div>
    </section>
  );
}

