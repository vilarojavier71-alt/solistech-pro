import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.solistech.pro',
  appName: 'SolisTechPro',
  webDir: 'public',
  server: {
    url: 'http://169.254.242.213:3000',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
