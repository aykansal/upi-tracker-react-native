import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { BorderRadius, Colors, FontSizes, Fonts, Spacing } from '@/constants/theme';

// Calm flat cat mascot illustration - positioned bottom-right
function CatMascot() {
  return (
    <Svg width={120} height={120} viewBox="0 0 100 100" style={styles.catContainer}>
      {/* Cat body - rounded and calm */}
      <Ellipse cx="50" cy="65" rx="28" ry="25" fill="#D4A574" opacity={0.25} />
      
      {/* Cat head */}
      <Circle cx="50" cy="42" r="24" fill="#D4A574" opacity={0.4} />
      
      {/* Left ear */}
      <Path
        d="M 33 25 L 42 18 L 38 30 Z"
        fill="#D4A574"
        opacity={0.5}
      />
      {/* Right ear */}
      <Path
        d="M 67 25 L 58 18 L 62 30 Z"
        fill="#D4A574"
        opacity={0.5}
      />
      
      {/* Left eye - calm expression */}
      <Ellipse cx="43" cy="40" rx="3" ry="5" fill="#6B6B6B" />
      {/* Right eye */}
      <Ellipse cx="57" cy="40" rx="3" ry="5" fill="#6B6B6B" />
      
      {/* Nose */}
      <Path
        d="M 50 46 L 47 50 L 53 50 Z"
        fill="#C88BA8"
        opacity={0.6}
      />
      
      {/* Mouth - subtle calm smile */}
      <Path
        d="M 50 50 Q 46 54 42 52"
        stroke="#9A9A9A"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
        opacity={0.5}
      />
      <Path
        d="M 50 50 Q 54 54 58 52"
        stroke="#9A9A9A"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
        opacity={0.5}
      />
    </Svg>
  );
}

export default function WelcomeScreen() {
  const colors = Colors.light;

  const handleGetStarted = () => {
    router.push('/onboarding/profile-setup');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />

      {/* Main container */}
      <View style={styles.mainContainer}>
        {/* Top section */}
        <View style={styles.topSection}>
          <Text style={[styles.appName, { color: colors.text }]}>UPI Tracker</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your data stays on your device.{'\n'}Private, secure, and yours alone.
          </Text>
        </View>

        {/* Bottom section */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.tint }]}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Get started</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cat mascot - bottom-right, decorative */}
      <View style={styles.catWrapper}>
        <CatMascot />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  appName: {
    fontSize: FontSizes.display,
    fontFamily: Fonts?.rounded || 'cute-font',
    fontWeight: '600',
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts?.sans || 'regular-font',
    lineHeight: FontSizes.md * 1.5,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  bottomSection: {
    alignItems: 'center',
  },
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl * 1.5,
    borderRadius: BorderRadius.full,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts?.sans || 'regular-font',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  catWrapper: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.lg,
    opacity: 0.5, // Slightly reduced opacity
  },
  catContainer: {
    opacity: 1,
  },
});
