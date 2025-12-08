'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { loadTranslations, getNestedValue } from '@/lib/translations';

interface FooterProps {
  locale: string;
}

export function Footer({ locale }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const [translations, setTranslations] = useState<any>({});

  useEffect(() => {
    loadTranslations(locale, 'common').then(setTranslations);
  }, [locale]);

  const t = (key: string) => getNestedValue(translations, key) || key;

  const footerLinks = {
    product: [
      { key: 'pricing', href: '/pricing' },
      { key: 'games', href: '/games' },
      { key: 'features', href: '/features' },
      { key: 'api', href: '/api' },
    ],
    company: [
      { key: 'about', href: '/about' },
      { key: 'blog', href: '/blog' },
      { key: 'careers', href: '/careers' },
      { key: 'contact', href: '/contact' },
    ],
    support: [
      { key: 'docs', href: '/docs' },
      { key: 'support', href: '/support' },
      { key: 'faq', href: '/faq' },
      { key: 'status', href: '/status' },
    ],
    legal: [
      { key: 'terms', href: '/terms' },
      { key: 'privacy', href: '/privacy' },
      { key: 'cookies', href: '/cookies' },
    ],
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href={`/${locale}`} className="text-2xl font-bold text-white mb-4 block">
              {t('footer.brand') || 'ZedinGamingHosting'}
            </Link>
            <p className="text-sm mb-4">
              {t('footer.description') || 'The best gaming server hosting service.'}
            </p>
            <div className="flex gap-4" aria-label={t('footer.socialLabel') || 'Social links'}>
              <a href="#" className="hover:text-primary-400 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-primary-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-primary-400 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.sections.product.title') || 'Product'}</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.key}>
                  <Link href={`/${locale}${link.href}`} className="hover:text-primary-400 transition-colors text-sm">
                    {t(`footer.sections.product.links.${link.key}`) || link.key}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.sections.company.title') || 'Company'}</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.key}>
                  <Link href={`/${locale}${link.href}`} className="hover:text-primary-400 transition-colors text-sm">
                    {t(`footer.sections.company.links.${link.key}`) || link.key}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.sections.support.title') || 'Support'}</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.key}>
                  <Link href={`/${locale}${link.href}`} className="hover:text-primary-400 transition-colors text-sm">
                    {t(`footer.sections.support.links.${link.key}`) || link.key}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.sections.contact.title') || 'Contact'}</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4" />
                {t('footer.contact.email') || 'info@zedgaminghosting.hu'}
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4" />
                {t('footer.contact.phone') || '+36 XX XXX XXXX'}
              </li>
              <li className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4" />
                {t('footer.contact.location') || 'Hungary'}
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">
              {t('footer.copyright')?.replace('{{year}}', String(currentYear)) || `© ${currentYear} ZedinGamingHosting. All rights reserved.`}
            </p>
            <div className="flex gap-6 text-sm">
              {footerLinks.legal.map((link) => (
                <Link key={link.key} href={`/${locale}${link.href}`} className="hover:text-primary-400 transition-colors">
                  {t(`footer.sections.legal.links.${link.key}`) || link.key}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

