'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import { MaintenanceCheck } from '@/components/MaintenanceCheck';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MaintenanceCheck />
      {children}
      <Toaster position="top-right" />
    </SessionProvider>
  );
}

