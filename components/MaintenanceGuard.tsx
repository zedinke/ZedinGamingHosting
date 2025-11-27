'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

export function MaintenanceGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [checked, setChecked] = useState(false);
  const isAdmin = (session?.user as any)?.role === 'ADMIN' || (session?.user as any)?.role === 'ADMIN';

  useEffect(() => {
    // Várjuk meg, amíg a session betöltődik
    if (status === 'loading') {
      return;
    }

    // Ha admin vagyunk, ne irányítsunk át
    if (isAdmin) {
      setChecked(true);
      return;
    }

    const checkMaintenance = async () => {
      try {
        const response = await fetch('/api/system/maintenance/check-session', {
          cache: 'no-store',
        });
        const data = await response.json();

        if (data.maintenanceMode && !data.allowed) {
          // Kivételek: login, maintenance, api, admin oldalak
          if (
            !pathname?.includes('/admin') &&
            !pathname?.includes('/api') &&
            !pathname?.includes('/maintenance') &&
            !pathname?.includes('/login') &&
            !pathname?.includes('/auth')
          ) {
            const locale = pathname?.split('/')[1] || 'hu';
            const validLocales = ['hu', 'en'];
            const actualLocale = validLocales.includes(locale) ? locale : 'hu';
            router.replace(`/${actualLocale}/maintenance`);
          }
        }
        setChecked(true);
      } catch (error) {
        console.error('Maintenance check error:', error);
        setChecked(true);
      }
    };

    // Azonnal ellenőrzés
    checkMaintenance();
    
    // Ellenőrzés 5 másodpercenként
    const interval = setInterval(checkMaintenance, 5000);

    return () => clearInterval(interval);
  }, [pathname, isAdmin, router, status]);

  return null;
}

