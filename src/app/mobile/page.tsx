'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamic import to prevent SSR issues with mobile-specific features
const MobileKeyboardApp = dynamic(
  () => import('@/components/mobile/mobile-keyboard-app'),
  { ssr: false }
);

export default function MobilePage() {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <MobileKeyboardApp />
    </div>
  );
}
