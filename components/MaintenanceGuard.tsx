'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

export function MaintenanceGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const response = await fetch('/api/system/maintenance/check-session');
        const data = await response.json();

        if (data.maintenanceMode && !data.allowed && !isAdmin) {
          // Admin és API routes kivételek
          if (
            !pathname?.includes('/admin') &&
            !pathname?.includes('/api') &&
            !pathname?.includes('/maintenance')
          ) {
            const locale = pathname?.split('/')[1] || 'hu';
            router.push(`/${locale}/maintenance`);
          }
        }
      } catch (error) {
        console.error('Maintenance check error:', error);
      }
    };

    checkMaintenance();
    // Ellenőrzés 10 másodpercenként
    const interval = setInterval(checkMaintenance, 10000);

    return () => clearInterval(interval);
  }, [pathname, isAdmin, router]);

  return null;
}

