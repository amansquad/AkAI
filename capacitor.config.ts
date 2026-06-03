import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'nextjs_tailwind_shadcn_ts',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
