import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.4d2c846e441c428993a7b3f8eea64344',
  appName: 'drogaria-route-flow',
  webDir: 'dist',
  server: {
    url: 'https://4d2c846e-441c-4289-93a7-b3f8eea64344.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    BackgroundGeolocation: {
      locationProvider: 'DISTANCE_FILTER_PROVIDER',
      desiredAccuracy: 'HIGH_ACCURACY',
      stationaryRadius: 50,
      distanceFilter: 50,
      notificationTitle: 'Rastreamento Ativo',
      notificationText: 'Sua localização está sendo rastreada',
      debug: false,
      startOnBoot: false,
      stopOnTerminate: true,
      locationProvider_android: 'DISTANCE_FILTER_PROVIDER',
      locationProvider_ios: 'DISTANCE_FILTER_PROVIDER',
      interval: 10000,
      fastestInterval: 5000,
      activitiesInterval: 10000,
      stopOnStillActivity: true
    }
  }
};

export default config;