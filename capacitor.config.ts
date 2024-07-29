import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.axiomarobotics.radiotaxi',
  appName: 'RadioTaxi',
  webDir: 'build',
  plugins: {
    VolumeButtonPlugin: {}
  }
};

export default config;