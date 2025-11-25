'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { loadTranslations, getNestedValue } from '@/lib/translations';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface NavigationProps {
  locale: string;
}

export function Navigation({ locale }: NavigationProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [translations, setTranslations] = useState<any>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);

  useEffect(() => {
    loadTranslations(locale, 'common').then(setTranslations);
  }, [locale]);

  const t = (key: string) => getNestedValue(translations, key) || key;

  const isActive = (path: string) => {
    return pathname?.includes(path);
  };

  const toggleLocale = () => {
    const newLocale = locale === 'hu' ? 'en' : 'hu';
    const newPath = pathname?.replace(`/${locale}`, `/${newLocale}`) || `/${newLocale}`;
    window.location.href = newPath;
  };

  return (
    <header className="border-b border-dark-700 bg-dark-800/50 backdrop-blur-md sticky top-0 z-50 shadow-lg shadow-black/20">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href={`/${locale}`} className="text-2xl font-black text-glow hover:text-primary-400 transition-colors font-display">
            <span className="bg-clip-text text-transparent gamer-gradient">
              ZedinGamingHosting
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-6 items-center">
            <Link
              href={`/${locale}/pricing`}
              className={`hover:text-primary-400 transition-all duration-300 font-semibold relative ${
                isActive('/pricing') 
                  ? 'text-primary-400' 
                  : 'text-gray-300 hover:text-primary-300'
              }`}
            >
              {t('nav.pricing')}
              {isActive('/pricing') && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500"></span>
              )}
            </Link>
            <Link
              href={`/${locale}/games`}
              className={`hover:text-primary-400 transition-all duration-300 font-semibold relative ${
                isActive('/games') 
                  ? 'text-primary-400' 
                  : 'text-gray-300 hover:text-primary-300'
              }`}
            >
              {t('nav.games')}
              {isActive('/games') && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500"></span>
              )}
            </Link>
            
            {session ? (
              <>
                <Link
                  href={`/${locale}/dashboard`}
                  className={`hover:text-primary-400 transition-all duration-300 font-semibold relative ${
                    isActive('/dashboard') 
                      ? 'text-primary-400' 
                      : 'text-gray-300 hover:text-primary-300'
                  }`}
                >
                  {t('nav.dashboard')}
                  {isActive('/dashboard') && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500"></span>
                  )}
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-gray-300 hover:text-red-400 transition-colors font-semibold"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  href={`/${locale}/login`}
                  className="text-gray-300 hover:text-primary-400 transition-colors font-semibold"
                >
                  {t('nav.login')}
                </Link>
                <Link href={`/${locale}/register`}>
                  <Button size="sm" className="btn-primary btn-glow">
                    {t('nav.register')}
                  </Button>
                </Link>
              </>
            )}

            {/* Language Switcher */}
            <button
              onClick={toggleLocale}
              className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-primary-400 border border-dark-600 rounded-lg hover:border-primary-500/50 bg-dark-700/50 hover:bg-dark-700 transition-all duration-300"
            >
              {locale === 'hu' ? 'EN' : 'HU'}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-300 hover:text-primary-400 transition-colors rounded-lg hover:bg-dark-700"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-dark-700 pt-4 animate-slide-up">
            <div className="flex flex-col gap-4">
              <Link
                href={`/${locale}/pricing`}
                onClick={() => setMobileMenuOpen(false)}
                className={`hover:text-primary-400 transition-all duration-300 font-semibold py-2 px-4 rounded-lg ${
                  isActive('/pricing') 
                    ? 'text-primary-400 bg-primary-500/10 border border-primary-500/30' 
                    : 'text-gray-300 hover:bg-dark-700'
                }`}
              >
                {t('nav.pricing')}
              </Link>
              <Link
                href={`/${locale}/games`}
                onClick={() => setMobileMenuOpen(false)}
                className={`hover:text-primary-400 transition-all duration-300 font-semibold py-2 px-4 rounded-lg ${
                  isActive('/games') 
                    ? 'text-primary-400 bg-primary-500/10 border border-primary-500/30' 
                    : 'text-gray-300 hover:bg-dark-700'
                }`}
              >
                {t('nav.games')}
              </Link>
              
              {session ? (
                <>
                  <Link
                    href={`/${locale}/dashboard`}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`hover:text-primary-400 transition-all duration-300 font-semibold py-2 px-4 rounded-lg ${
                      isActive('/dashboard') 
                        ? 'text-primary-400 bg-primary-500/10 border border-primary-500/30' 
                        : 'text-gray-300 hover:bg-dark-700'
                    }`}
                  >
                    {t('nav.dashboard')}
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="text-left text-gray-300 hover:text-red-400 transition-colors font-semibold py-2 px-4 rounded-lg hover:bg-dark-700"
                  >
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href={`/${locale}/login`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-300 hover:text-primary-400 transition-colors font-semibold py-2 px-4 rounded-lg hover:bg-dark-700"
                  >
                    {t('nav.login')}
                  </Link>
                  <Link href={`/${locale}/register`} onClick={() => setMobileMenuOpen(false)}>
                    <Button size="sm" className="w-full btn-primary btn-glow">
                      {t('nav.register')}
                    </Button>
                  </Link>
                </>
              )}

              {/* Mobile Language Switcher */}
              <button
                onClick={() => {
                  toggleLocale();
                  setMobileMenuOpen(false);
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-primary-400 border border-dark-600 rounded-lg hover:border-primary-500/50 bg-dark-700/50 hover:bg-dark-700 transition-all duration-300 text-left"
              >
                {locale === 'hu' ? 'English (EN)' : 'Magyar (HU)'}
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

