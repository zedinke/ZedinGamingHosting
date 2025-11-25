'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { loadTranslations, getNestedValue } from '@/lib/translations';

interface NavigationProps {
  locale: string;
}

export function Navigation({ locale }: NavigationProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [translations, setTranslations] = useState<any>({});

  useEffect(() => {
    loadTranslations(locale, 'common').then(setTranslations);
  }, [locale]);

  const t = (key: string) => getNestedValue(translations, key) || key;

  const isActive = (path: string) => {
    return pathname?.includes(path);
  };

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href={`/${locale}`} className="text-2xl font-bold text-primary-600">
          ZedinGamingHosting
        </Link>
        
        <div className="flex gap-6 items-center">
          <Link
            href={`/${locale}/pricing`}
            className={`hover:text-primary-600 transition-colors ${
              isActive('/pricing') ? 'text-primary-600 font-semibold' : ''
            }`}
          >
            {t('nav.pricing')}
          </Link>
          <Link
            href={`/${locale}/games`}
            className={`hover:text-primary-600 transition-colors ${
              isActive('/games') ? 'text-primary-600 font-semibold' : ''
            }`}
          >
            {t('nav.games')}
          </Link>
          
          {session ? (
            <>
              <Link
                href={`/${locale}/dashboard`}
                className={`hover:text-primary-600 transition-colors ${
                  isActive('/dashboard') ? 'text-primary-600 font-semibold' : ''
                }`}
              >
                {t('nav.dashboard')}
              </Link>
              <Link
                href={`/${locale}/dashboard/billing`}
                className={`hover:text-primary-600 transition-colors ${
                  isActive('/billing') ? 'text-primary-600 font-semibold' : ''
                }`}
              >
                Számlázás
              </Link>
              <Link
                href={`/${locale}/dashboard/settings`}
                className={`hover:text-primary-600 transition-colors ${
                  isActive('/settings') ? 'text-primary-600 font-semibold' : ''
                }`}
              >
                Beállítások
              </Link>
              <button
                onClick={() => signOut()}
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <Link
                href={`/${locale}/login`}
                className="hover:text-primary-600 transition-colors"
              >
                {t('nav.login')}
              </Link>
              <Link
                href={`/${locale}/register`}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                {t('nav.register')}
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

