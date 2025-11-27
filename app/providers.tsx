'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import { MaintenanceGuard } from '@/components/MaintenanceGuard';
import { ChatButton } from '@/components/chat/ChatButton';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MaintenanceGuard />
      {children}
      <ChatButton />
      <Toaster position="top-right" />
    </SessionProvider>
  );
}

