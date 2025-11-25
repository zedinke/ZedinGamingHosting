'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import { MaintenanceGuard } from '@/components/MaintenanceGuard';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MaintenanceGuard />
      {children}
      <Toaster position="top-right" />
    </SessionProvider>
  );
}

