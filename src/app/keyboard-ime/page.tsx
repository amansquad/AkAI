'use client';

import dynamic from 'next/dynamic';

// Load keyboard with no SSR to avoid hydration issues in WebView
const KeyboardImeShell = dynamic(() => import('@/components/keyboard-ime-shell'), { ssr: false });

export default function KeyboardImePage() {
  return <KeyboardImeShell />;
}
