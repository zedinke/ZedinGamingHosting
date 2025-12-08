'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { loadTranslations, getNestedValue } from '@/lib/translations';
import {
  LayoutDashboard,
  Users,
  Server,
  CreditCard,
  FileText,
  Ticket,
  FileEdit,
  BarChart3,
  Palette,
  Settings,
  Bug,
  LogOut,
  User,
  Menu,
  X,
  Network,
  MessageSquare,
  Key,
} from 'lucide-react';

interface AdminNavigationProps {
  locale: string;
}

export function AdminNavigation({ locale }: AdminNavigationProps) {
  const pathname = usePathname();
  const [translations, setTranslations] = useState<any>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadTranslations(locale, 'common').then(setTranslations);
  }, [locale]);

  const t = (key: string) => getNestedValue(translations, key) || key;

  const isActive = (path: string) => {
    return pathname === path || (path !== `/${locale}/admin` && pathname?.startsWith(path));
  };

  const menuCategories = [
    {
      title: 'Áttekintés',
      items: [
        { href: `/${locale}/admin`, label: 'Vezérlőpult', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Szerverek & Infrastruktúra',
      items: [
        { href: `/${locale}/admin/servers`, label: 'Szerverek', icon: Server },
        { href: `/${locale}/admin/machines`, label: 'Szerver Gépek', icon: Network },
        { href: `/${locale}/admin/agents`, label: 'Agentek', icon: Server },
        { href: `/${locale}/admin/server-templates`, label: 'Szerver Sablonok', icon: Server },
        { href: `/${locale}/admin/games`, label: 'Játékok Konfig', icon: Server },
      ],
    },
    {
      title: 'Felhasználók & Jogosultságok',
      items: [
        { href: `/${locale}/admin/users`, label: 'Felhasználók', icon: Users },
        { href: `/${locale}/admin/license`, label: 'License Kezelés', icon: Key },
      ],
    },
    {
      title: 'Pénzügyek',
      items: [
        { href: `/${locale}/admin/subscriptions`, label: 'Előfizetések', icon: CreditCard },
        { href: `/${locale}/admin/invoices`, label: 'Számlák', icon: FileText },
      ],
    },
    {
      title: 'Támogatás',
      items: [
        { href: `/${locale}/admin/tickets`, label: 'Ticketek', icon: Ticket },
      ],
    },
    {
      title: 'Monitoring & Analytics',
      items: [
        { href: `/${locale}/admin/monitoring`, label: 'Monitoring', icon: BarChart3 },
        { href: `/${locale}/admin/performance`, label: 'Performance', icon: BarChart3 },
        { href: `/${locale}/admin/reports`, label: 'Jelentések', icon: BarChart3 },
        { href: `/${locale}/admin/analytics`, label: 'Analytics', icon: BarChart3 },
      ],
    },
    {
      title: 'Tartalomkezelés',
      items: [
        { href: `/${locale}/admin/cms`, label: 'CMS', icon: FileEdit },
      ],
    },
    {
      title: 'Logok & Feladatok',
      items: [
        { href: `/${locale}/admin/install-logs`, label: 'Telepítési Logok', icon: FileText },
        { href: `/${locale}/admin/audit-logs`, label: 'Audit Logok', icon: FileText },
        { href: `/${locale}/admin/tasks`, label: 'Feladatok', icon: FileText },
      ],
    },
    {
      title: 'Rendszer & Beállítások',
      items: [
        { href: `/${locale}/admin/webhooks`, label: 'Webhookok', icon: Settings },
        { href: `/${locale}/admin/theme`, label: 'Téma', icon: Palette },
        { href: `/${locale}/admin/system`, label: 'Rendszer', icon: Settings },
        { href: `/${locale}/admin/settings`, label: 'Beállítások', icon: Settings },
      ],
    },
    {
      title: 'Fejlesztés',
      items: [
        { href: `/${locale}/admin/ai-chat`, label: 'AI Chat', icon: MessageSquare },
        { href: `/${locale}/admin/debug`, label: 'Debug', icon: Bug },
      ],
    },
  ];

  // Scroll to top when pathname changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return (
    <>
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-xl z-50">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-700">
            <Link href={`/${locale}/admin`} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Admin Panel</h1>
                <p className="text-xs text-gray-400">ZedinGaming</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-4">
            {menuCategories.map((category) => (
              <div key={category.title} className="space-y-1">
                <h3 className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {category.title}
                </h3>
                {category.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        // Scroll to top when navigating
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                        active
                          ? 'bg-primary-600 text-white shadow-lg'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700 space-y-2">
            <Link
              href={`/${locale}/dashboard`}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-all"
            >
              <User className="w-5 h-5" />
              <span className="font-medium">Felhasználói felület</span>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: `/${locale}` })}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Kijelentkezés</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-gray-900 text-white rounded-lg shadow-lg"
      >
        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-xl z-50 transform transition-transform lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-700 flex items-center justify-between">
            <Link href={`/${locale}/admin`} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Admin Panel</h1>
              </div>
            </Link>
            <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden">
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 space-y-4">
            {menuCategories.map((category) => (
              <div key={category.title} className="space-y-1">
                <h3 className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {category.title}
                </h3>
                {category.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        // Scroll to top when navigating
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                        active
                          ? 'bg-primary-600 text-white shadow-lg'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-700 space-y-2">
            <Link
              href={`/${locale}/dashboard`}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-all"
            >
              <User className="w-5 h-5" />
              <span className="font-medium">Felhasználói felület</span>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: `/${locale}` })}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Kijelentkezés</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

