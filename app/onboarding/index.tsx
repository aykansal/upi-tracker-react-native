import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { BorderRadius, Colors, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { completeOnboardingWithProfile } from '@/services/user-storage';

// Calm flat cat mascot illustration - subtle and friendly
function CatMascot() {
  return (
    <Svg width={100} height={100} viewBox="0 0 100 100" style={styles.catContainer}>
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

// Simple avatar options - numbered 1-5
const AVATAR_OPTIONS = ['1', '2', '3', '4', '5'];

export default function WelcomeScreen() {
  const colors = Colors.light;
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGetStarted = async () => {
    // Validate name
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Please enter your name to continue.');
      return;
    }

    if (trimmedName.length < 2) {
      Alert.alert('Name too short', 'Please enter at least 2 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Save profile and mark onboarding complete
      await completeOnboardingWithProfile({
        name: trimmedName,
        avatarId: selectedAvatar,
      });

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to save your information. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Cat mascot - subtle, positioned top-left area */}
        <View style={styles.catWrapper}>
          <CatMascot />
        </View>

        {/* App name */}
        <Text style={[styles.appName, { color: colors.text }]}>UPI Tracker</Text>

        {/* Friendly privacy message */}
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          Your data stays on your device.{'\n'}Private, secure, and yours alone.
        </Text>

        {/* Name input */}
        <View style={styles.inputSection}>
          <Text style={[styles.label, { color: colors.text }]}>What's your name?</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Enter your name"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
            autoFocus
            maxLength={50}
          />
        </View>

        {/* Avatar selection */}
        <View style={styles.avatarSection}>
          <Text style={[styles.label, { color: colors.text }]}>Choose an avatar</Text>
          <View style={styles.avatarGrid}>
            {AVATAR_OPTIONS.map((avatarId) => (
              <TouchableOpacity
                key={avatarId}
                style={[
                  styles.avatarOption,
                  {
                    backgroundColor:
                      selectedAvatar === avatarId ? colors.tint : colors.card,
                    borderColor:
                      selectedAvatar === avatarId ? colors.tint : colors.border,
                  },
                ]}
                onPress={() => setSelectedAvatar(avatarId)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.avatarText,
                    {
                      color:
                        selectedAvatar === avatarId
                          ? '#FFFFFF'
                          : colors.textSecondary,
                    },
                  ]}
                >
                  {avatarId}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Primary action button */}
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: colors.tint,
              opacity: isSubmitting ? 0.6 : 1,
            },
          ]}
          onPress={handleGetStarted}
          activeOpacity={0.8}
          disabled={isSubmitting}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? 'Saving...' : 'Get started'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputSection: {
    width: '100%',
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  label: {
    fontSize: FontSizes.md,
    fontFamily: Fonts?.sans || 'regular-font',
    fontWeight: '500',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    maxWidth: 300,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: FontSizes.md,
    fontFamily: Fonts?.sans || 'regular-font',
    textAlign: 'center',
  },
  avatarSection: {
    width: '100%',
    marginBottom: Spacing.xxl,
    alignItems: 'center',
  },
  avatarGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  avatarOption: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts?.rounded || 'cute-font',
    fontWeight: '600',
  },
  catWrapper: {
    position: 'absolute',
    top: Spacing.xl,
    left: Spacing.md,
    opacity: 0.4, // Very subtle, not dominant
  },
  catContainer: {
    opacity: 1,
  },
  appName: {
    fontSize: FontSizes.display,
    fontFamily: Fonts?.rounded || 'cute-font',
    fontWeight: '600',
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  message: {
    fontSize: FontSizes.md,
    fontFamily: Fonts?.sans || 'regular-font',
    lineHeight: FontSizes.md * 1.5,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
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
});

