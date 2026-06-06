import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

/**
 * Centralized Ad Configuration for NexaPlay
 * 
 * Publisher ID: ca-app-pub-1463643965641951
 * 
 * IMPORTANT: Currently using Google TEST ad unit IDs for safe development.
 * Before publishing to production, replace the ad unit IDs below with your
 * real ones from your AdMob dashboard (admob.google.com).
 * 
 * To create production ad units:
 * 1. Go to admob.google.com
 * 2. Select your app (or add it)
 * 3. Create a Banner ad unit
 * 4. Copy the ad unit ID and paste below
 */

// Set to true when you're ready to use real ads in production
const USE_PRODUCTION_ADS = false;

// Replace these with your real ad unit IDs from AdMob dashboard
const PRODUCTION_AD_UNITS = {
  BANNER_ANDROID: 'ca-app-pub-1463643965641951/XXXXXXXXXX', // Replace with real Android banner unit ID
  BANNER_IOS: 'ca-app-pub-1463643965641951/XXXXXXXXXX',     // Replace with real iOS banner unit ID
};

/**
 * Returns the appropriate banner ad unit ID based on platform and environment.
 * Uses test IDs in development to avoid AdMob policy violations.
 */
export const getBannerAdUnitId = (): string => {
  if (!USE_PRODUCTION_ADS || __DEV__) {
    // Always use test IDs during development
    return TestIds.ADAPTIVE_BANNER;
  }

  return Platform.select({
    android: PRODUCTION_AD_UNITS.BANNER_ANDROID,
    ios: PRODUCTION_AD_UNITS.BANNER_IOS,
    default: TestIds.ADAPTIVE_BANNER,
  }) as string;
};

/**
 * AdMob App IDs (also configured in app.json)
 * These are the TEST app IDs — replace in app.json for production.
 */
export const AD_APP_IDS = {
  ANDROID: 'ca-app-pub-3940256099942544~3347511713', // Google test App ID
  IOS: 'ca-app-pub-3940256099942544~1458002511',     // Google test App ID
  // Production (your real App IDs):
  // ANDROID: 'ca-app-pub-1463643965641951~XXXXXXXXXX',
  // IOS: 'ca-app-pub-1463643965641951~XXXXXXXXXX',
};
