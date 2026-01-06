import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { BorderRadius, Colors, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { completeOnboardingWithProfile } from '@/services/user-storage';

// Small cat peeking from top-left - decorative only
function CatPeek() {
  return (
    <Svg width={60} height={60} viewBox="0 0 100 100" style={styles.catPeekContainer}>
      {/* Cat head - just peeking */}
      <Circle cx="50" cy="50" r="20" fill="#D4A574" opacity={0.3} />
      {/* Left ear */}
      <Path
        d="M 35 35 L 42 28 L 38 42 Z"
        fill="#D4A574"
        opacity={0.4}
      />
      {/* Right ear */}
      <Path
        d="M 65 35 L 58 28 L 62 42 Z"
        fill="#D4A574"
        opacity={0.4}
      />
      {/* Left eye */}
      <Ellipse cx="43" cy="48" rx="2.5" ry="4" fill="#6B6B6B" />
      {/* Right eye */}
      <Ellipse cx="57" cy="48" rx="2.5" ry="4" fill="#6B6B6B" />
      {/* Nose */}
      <Path
        d="M 50 54 L 47 58 L 53 58 Z"
        fill="#C88BA8"
        opacity={0.5}
      />
    </Svg>
  );
}

// Avatar options - numbered 1-9 for 3x3 grid
const AVATAR_OPTIONS = ['🐱', '🐶', '🐭', '🐹', '🐰', '🐻', '🐼', '🐨', '🐯'];

export default function ProfileSetupScreen() {
  const colors = Colors.light;
  const [username, setUsername] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = username.trim().length >= 2 && selectedAvatarId !== null;

  const handleContinue = async () => {
    if (!isFormValid) return;

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 2) {
      Alert.alert('Name too short', 'Please enter at least 2 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Save profile and mark onboarding complete
      await completeOnboardingWithProfile({
        name: trimmedUsername,
        avatarId: selectedAvatarId!.toString(),
      });

      // Reset navigation to main app
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to save your information. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />

      {/* Optional cat peeking from top-left */}
      <View style={styles.catPeekWrapper}>
        <CatPeek />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              what should we call you?
            </Text>
            <Text style={[styles.subtext, { color: colors.textSecondary }]}>
            to make this feel yours
            </Text>
          </View>

          {/* Name input */}
          <View style={styles.inputSection}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="mota bhai"
              placeholderTextColor={colors.textSecondary}
              value={username}
              onChangeText={setUsername}
              autoFocus
              maxLength={50}
            />
          </View>

          {/* Avatar section */}
          <View style={styles.avatarSection}>
            <Text style={[styles.avatarLabel, { color: colors.text }]}>pick your vibe</Text>
            <View style={styles.avatarGrid}>
              {AVATAR_OPTIONS.map((avatarId) => (
                <TouchableOpacity
                  key={avatarId}
                  style={[
                    styles.avatarCard,
                    {
                      backgroundColor: colors.card,
                      borderColor:
                        selectedAvatarId === avatarId ? colors.tint : colors.border,
                      borderWidth: selectedAvatarId === avatarId ? 3 : 1,
                    },
                  ]}
                  onPress={() => setSelectedAvatarId(avatarId)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.avatarNumber,
                      {
                        color:
                          selectedAvatarId === avatarId
                            ? colors.tint
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

          {/* Bottom padding for fixed button */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Primary CTA - Fixed at bottom */}
      <View style={[styles.buttonContainer, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: colors.tint,
              opacity: isFormValid && !isSubmitting ? 1 : 0.5,
            },
          ]}
          onPress={handleContinue}
          activeOpacity={0.8}
          disabled={!isFormValid || isSubmitting}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? 'Saving...' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  catPeekWrapper: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.md,
    zIndex: 1,
    opacity: 0.4,
  },
  catPeekContainer: {
    opacity: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontFamily: Fonts?.sans || 'regular-font',
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtext: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts?.sans || 'regular-font',
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  inputSection: {
    marginBottom: Spacing.xl,
  },
  input: {
    width: '100%',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: FontSizes.md,
    fontFamily: Fonts?.sans || 'regular-font',
    textAlign: 'center',
  },
  avatarSection: {
    marginBottom: Spacing.xl,
  },
  avatarLabel: {
    fontSize: FontSizes.md,
    fontFamily: Fonts?.sans || 'regular-font',
    fontWeight: '500',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  avatarCard: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarNumber: {
    fontSize: FontSizes.xxl,
    fontFamily: Fonts?.rounded || 'cute-font',
    fontWeight: '600',
  },
  buttonContainer: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  button: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
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

