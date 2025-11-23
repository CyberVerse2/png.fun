import type React from 'react';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { auth } from '@/auth';
import ClientProviders from '@/providers';
import '@worldcoin/mini-apps-ui-kit-react/styles.css';
import './globals.css';

const _geist = Geist({ subsets: ['latin'] });
const _geistMono = Geist_Mono({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PNG.FUN - Social Photo Gaming',
  description: 'Capture moments, vote & judge, win prizes',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)'
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)'
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml'
      }
    ],
    apple: '/apple-icon.png'
  }
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ClientProviders session={session}>{children}</ClientProviders>
      </body>
    </html>
  );
}
