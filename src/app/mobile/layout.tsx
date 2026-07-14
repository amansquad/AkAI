import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AkAI Mobile Keyboard',
  description: 'Redesigned mobile keyboard with Samsung layout and live themes',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: '#000000',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AkAI Keyboard',
  },
};

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
