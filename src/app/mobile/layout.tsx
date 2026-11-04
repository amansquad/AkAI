import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'AkAI Mobile Keyboard',
  description: 'Redesigned mobile keyboard with Samsung layout and live themes',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AkAI Keyboard',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
};

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
