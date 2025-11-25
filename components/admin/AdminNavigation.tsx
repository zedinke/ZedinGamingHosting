'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { loadTranslations, getNestedValue } from '@/lib/translations';

interface AdminNavigationProps {
  locale: string;
}

export function AdminNavigation({ locale }: AdminNavigationProps) {
  const pathname = usePathname();
  const [translations, setTranslations] = useState<any>({});

  useEffect(() => {
    loadTranslations(locale, 'common').then(setTranslations);
  }, [locale]);

  const t = (key: string) => getNestedValue(translations, key) || key;

  const isActive = (path: string) => {
    return pathname?.includes(path);
  };

  const menuItems = [
    { href: `/${locale}/admin`, label: 'Vezérlőpult', icon: '📊' },
    { href: `/${locale}/admin/users`, label: 'Felhasználók', icon: '👥' },
    { href: `/${locale}/admin/servers`, label: 'Szerverek', icon: '🖥️' },
    { href: `/${locale}/admin/subscriptions`, label: 'Előfizetések', icon: '💳' },
    { href: `/${locale}/admin/invoices`, label: 'Számlák', icon: '📄' },
    { href: `/${locale}/admin/tickets`, label: 'Ticketek', icon: '🎫' },
    { href: `/${locale}/admin/cms`, label: 'CMS', icon: '📝' },
    { href: `/${locale}/admin/settings`, label: 'Beállítások', icon: '⚙️' },
  ];

  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href={`/${locale}/admin`} className="text-xl font-bold text-primary-600">
              Admin Panel
            </Link>
            <div className="flex space-x-4">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href={`/${locale}/dashboard`}
              className="text-gray-600 hover:text-primary-600 text-sm"
            >
              Felhasználói felület
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: `/${locale}` })}
              className="text-gray-600 hover:text-red-600 text-sm"
            >
              Kijelentkezés
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

