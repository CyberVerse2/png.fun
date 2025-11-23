'use client';

import { MiniKitProvider } from '@worldcoin/minikit-js/minikit-provider';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/theme-provider';
import { ReactNode } from 'react';

interface ClientProvidersProps {
  children: ReactNode;
  session: any;
}

export default function ClientProviders({ children, session }: ClientProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
      <MiniKitProvider>
        <SessionProvider session={session}>{children}</SessionProvider>
      </MiniKitProvider>
    </ThemeProvider>
  );
}
