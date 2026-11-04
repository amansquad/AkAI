import { Capacitor } from '@capacitor/core';

/**
 * The Android app ships as a static bundle with no server, so relative
 * `/api/*` calls resolve against the WebView's own origin and 404. On native
 * platforms, route API calls to the deployed site instead; on web, relative
 * paths already work and this returns ''.
 */
export function getApiBaseUrl(): string {
  if (Capacitor.isNativePlatform()) {
    return process.env.NEXT_PUBLIC_API_BASE_URL || '';
  }
  return '';
}
