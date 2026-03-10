import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { PwaRegister } from '@/components/pwa-register';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'BatiGest — Gestion pour artisans',
  description: 'Logiciel de gestion tout-en-un pour artisans du batiment',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BatiGest',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#2563EB',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-gray-50 text-gray-900`}>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
