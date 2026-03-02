import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.korebularyjoapps.app',
  appName: 'korebulary',
  webDir: 'build',
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000, // 3 segundos de splash
      launchAutoHide: true,
      backgroundColor: "#ffffffff", // Color de fondo en hex
      androidScaleType: "CENTER_CROP"
    },
  },
};

export default config;
