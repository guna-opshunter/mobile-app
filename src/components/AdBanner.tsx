import React, { useState, memo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { getBannerAdUnitId } from '../utils/adConfig';

/**
 * Reusable AdBanner component for NexaPlay.
 * 
 * Displays a Google AdMob adaptive banner ad.
 * - Gracefully handles errors (collapses to zero height on failure)
 * - Themed container that blends with the app
 * - Safe to place at the bottom of any ScrollView
 */

interface AdBannerProps {
  /** Optional custom style for the container */
  style?: object;
}

const AdBanner = memo(({ style }: AdBannerProps) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  // Don't render anything if ad failed to load
  if (adError) return null;

  return (
    <View style={[styles.container, !adLoaded && styles.hidden, style]}>
      <BannerAd
        unitId={getBannerAdUnitId()}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => setAdLoaded(true)}
        onAdFailedToLoad={(error) => {
          console.log('Ad failed to load:', error);
          setAdError(true);
        }}
      />
    </View>
  );
});

AdBanner.displayName = 'AdBanner';
export default AdBanner;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 16,
    marginBottom: 8,
    overflow: 'hidden',
    borderRadius: 8,
  },
  hidden: {
    opacity: 0,
    height: 0,
    overflow: 'hidden',
  },
});
