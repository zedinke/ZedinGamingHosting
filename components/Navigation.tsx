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
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href={`/${locale}`} className="text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
            ZedinGamingHosting
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-6 items-center">
            <Link
              href={`/${locale}/pricing`}
              className={`hover:text-gray-900 transition-colors font-medium ${
                isActive('/pricing') 
                  ? 'text-gray-900 font-semibold' 
                  : 'text-gray-700'
              }`}
            >
              {t('nav.pricing')}
            </Link>
            <Link
              href={`/${locale}/games`}
              className={`hover:text-gray-900 transition-colors font-medium ${
                isActive('/games') 
                  ? 'text-gray-900 font-semibold' 
                  : 'text-gray-700'
              }`}
            >
              {t('nav.games')}
            </Link>
            <Link
              href={`/${locale}/zed-gaming-system`}
              className={`hover:text-gray-900 transition-colors font-medium ${
                isActive('/zed-gaming-system') 
                  ? 'text-gray-900 font-semibold' 
                  : 'text-gray-700'
              }`}
            >
              Zed Gaming System
            </Link>
            <Link
              href={`/${locale}/system`}
              className={`hover:text-gray-900 transition-colors font-medium ${
                isActive('/system') 
                  ? 'text-gray-900 font-semibold' 
                  : 'text-gray-700'
              }`}
            >
              {t('nav.system')}
            </Link>
            
            {session ? (
              <>
                <Link
                  href={`/${locale}/dashboard`}
                  className={`hover:text-gray-900 transition-colors font-medium ${
                    isActive('/dashboard') 
                      ? 'text-gray-900 font-semibold' 
                      : 'text-gray-700'
                  }`}
                >
                  {t('nav.dashboard')}
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-gray-700 hover:text-gray-900 transition-colors font-medium"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  href={`/${locale}/login`}
                  className="text-gray-700 hover:text-gray-900 transition-colors font-medium"
                >
                  {t('nav.login')}
                </Link>
                <Link href={`/${locale}/register`}>
                  <Button size="sm" className="bg-gray-900 text-white hover:bg-gray-800">
                    {t('nav.register')}
                  </Button>
                </Link>
              </>
            )}

            {/* Language Switcher */}
            <button
              onClick={toggleLocale}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
            >
              {locale === 'hu' ? 'EN' : 'HU'}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
            <div className="flex flex-col gap-4">
              <Link
                href={`/${locale}/pricing`}
                onClick={() => setMobileMenuOpen(false)}
                className={`hover:text-gray-900 transition-colors font-medium py-2 ${
                  isActive('/pricing') 
                    ? 'text-gray-900 font-semibold' 
                    : 'text-gray-700'
                }`}
              >
                {t('nav.pricing')}
              </Link>
              <Link
                href={`/${locale}/games`}
                onClick={() => setMobileMenuOpen(false)}
                className={`hover:text-gray-900 transition-colors font-medium py-2 ${
                  isActive('/games') 
                    ? 'text-gray-900 font-semibold' 
                    : 'text-gray-700'
                }`}
              >
                {t('nav.games')}
              </Link>
              <Link
                href={`/${locale}/zed-gaming-system`}
                onClick={() => setMobileMenuOpen(false)}
                className={`hover:text-gray-900 transition-colors font-medium py-2 ${
                  isActive('/zed-gaming-system') 
                    ? 'text-gray-900 font-semibold' 
                    : 'text-gray-700'
                }`}
              >
                Zed Gaming System
              </Link>
              <Link
                href={`/${locale}/system`}
                onClick={() => setMobileMenuOpen(false)}
                className={`hover:text-gray-900 transition-colors font-medium py-2 ${
                  isActive('/system') 
                    ? 'text-gray-900 font-semibold' 
                    : 'text-gray-700'
                }`}
              >
                {t('nav.system')}
              </Link>
              
              {session ? (
                <>
                  <Link
                    href={`/${locale}/dashboard`}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`hover:text-gray-900 transition-colors font-medium py-2 ${
                      isActive('/dashboard') 
                        ? 'text-gray-900 font-semibold' 
                        : 'text-gray-700'
                    }`}
                  >
                    {t('nav.dashboard')}
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="text-left text-gray-700 hover:text-gray-900 transition-colors font-medium py-2"
                  >
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href={`/${locale}/login`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-700 hover:text-gray-900 transition-colors font-medium py-2"
                  >
                    {t('nav.login')}
                  </Link>
                  <Link href={`/${locale}/register`} onClick={() => setMobileMenuOpen(false)}>
                    <Button size="sm" className="w-full bg-gray-900 text-white hover:bg-gray-800">
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
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors text-left"
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

