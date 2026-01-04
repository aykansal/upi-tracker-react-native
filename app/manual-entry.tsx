import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { Colors, BorderRadius, FontSizes, Spacing } from '@/constants/theme';
import { isValidUPIId, formatUPIId } from '@/services/upi-parser';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ManualEntryScreen() {
  const [upiId, setUpiId] = useState('');
  const [isValid, setIsValid] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const insets = useSafeAreaInsets();

  const handleUpiIdChange = (text: string) => {
    setUpiId(text);
    setIsValid(isValidUPIId(text));
  };

  const handleContinue = () => {
    const trimmedUpiId = upiId.trim();
    
    if (!trimmedUpiId) {
      Alert.alert('Required', 'Please enter a UPI ID');
      return;
    }

    if (!isValidUPIId(trimmedUpiId)) {
      Alert.alert(
        'Invalid UPI ID',
        'Please enter a valid UPI ID in the format: firstname@lastname\n\nExample: john@paytm'
      );
      return;
    }

    // Extract payee name from UPI ID (part before @)
    const payeeName = trimmedUpiId.split('@')[0];
    const formattedUpiId = formatUPIId(trimmedUpiId);

    // Navigate to payment screen (manual entry is always P2P)
    router.replace({
      pathname: '/payment',
      params: {
        upiId: formattedUpiId,
        payeeName: payeeName.charAt(0).toUpperCase() + payeeName.slice(1),
        amount: '',
        transactionNote: '',
        // Manual entry is always P2P (not merchant)
        originalQRData: '',
        isMerchant: 'false',
        merchantCategory: '',
        organizationId: '',
      },
    });
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + Spacing.sm,
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Manual Entry
        </Text>
        <View style={styles.headerButton} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${colors.tint}20` },
            ]}
          >
            <Ionicons name="person-outline" size={48} color={colors.tint} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            Enter UPI ID
          </Text>
          {/* <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter the UPI ID in the format: username@bankname 
          </Text> */}

          {/* Input Container */}
          <View style={styles.inputContainer}>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.card,
                  borderColor: isValid && upiId.trim()
                    ? colors.tint
                    : colors.border,
                },
              ]}
            >
              {/* <Text style={[styles.atSymbol, { color: colors.textSecondary }]}>
                @
              </Text> */}
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={upiId}
                onChangeText={handleUpiIdChange}
                placeholder="username@bankname"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="done"
                onSubmitEditing={handleContinue}
                autoFocus
              />
              {isValid && upiId.trim() && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.tint}
                  style={styles.checkIcon}
                />
              )}
            </View>

            {/* Helper Text */}
            <View style={styles.helperContainer}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                Example: aditi@oksbi, rahul@ybl
              </Text>
            </View>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              {
                backgroundColor:
                  isValid && upiId.trim() ? colors.tint : colors.border,
              },
            ]}
            onPress={handleContinue}
            disabled={!isValid || !upiId.trim()}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  subtitle: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  inputContainer: {
    marginBottom: Spacing.xl,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  atSymbol: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    marginRight: Spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.lg,
    paddingVertical: Spacing.md,
  },
  checkIcon: {
    marginLeft: Spacing.sm,
  },
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    gap: Spacing.xs,
  },
  helperText: {
    fontSize: FontSizes.sm,
    flex: 1,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
});
