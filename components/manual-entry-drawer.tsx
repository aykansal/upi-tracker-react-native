import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BorderRadius, Colors, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { buildUPIUrl } from '@/constants/upi-config';
import { formatUPIId, isValidUPIId } from '@/services/upi-parser';

interface ManualEntryDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export function ManualEntryDrawer({
  visible,
  onClose,
}: ManualEntryDrawerProps) {
  const colors = Colors.light;
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [upiId, setUpiId] = useState('');
  const [isValid, setIsValid] = useState(false);

  // Snap points for bottom sheet - use higher percentage to accommodate keyboard
  const snapPoints = useMemo(() => ['75%'], []);

  // Control sheet visibility
  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
      // Reset form when opening
      setUpiId('');
      setIsValid(false);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleUpiIdChange = (text: string) => {
    setUpiId(text);
    setIsValid(isValidUPIId(text));
  };

  const handleContinue = useCallback(() => {
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

    // Build UPI URL (without amount - user will enter in payment screen)
    const upiUrl = buildUPIUrl({
      upiId: formattedUpiId,
      payeeName: payeeName.charAt(0).toUpperCase() + payeeName.slice(1),
    });

    // Close drawer first
    onClose();

    // Navigate to payment screen - QR will be generated there with user's amount
    setTimeout(() => {
      router.push({
        pathname: '/payment',
        params: {
          upiId: formattedUpiId,
          payeeName: payeeName.charAt(0).toUpperCase() + payeeName.slice(1),
          amount: '',
          transactionNote: '',
          // Manual entry is always P2P (not merchant)
          originalQRData: upiUrl,
          isMerchant: 'false',
          merchantCategory: '',
          organizationId: '',
          qrImageUri: '', // No QR yet - will be generated in payment screen with user's amount
          generatedQR: 'false',
          amountLocked: 'false',
        },
      });
    }, 300);
  }, [upiId, onClose]);

  // Custom backdrop component
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: colors.card,
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
      }}
      handleIndicatorStyle={{
        backgroundColor: colors.border,
        width: 40,
        height: 4,
      }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      <BottomSheetScrollView
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + Spacing.md },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Manual Entry
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Enter UPI ID
        </Text>

        {/* Input Container */}
        <View style={styles.inputContainer}>
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: colors.surface,
                borderColor: isValid && upiId.trim()
                  ? colors.tint
                  : colors.border,
              },
            ]}
          >
            <BottomSheetTextInput
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
                (isValid && upiId.trim()) ? colors.tint : colors.border,
            },
          ]}
          onPress={handleContinue}
          disabled={!isValid || !upiId.trim()}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    fontFamily: Fonts?.sans || 'regular-font',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  subtitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.xl,
    fontFamily: Fonts?.sans || 'regular-font',
  },
  inputContainer: {
    marginBottom: Spacing.xl,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.md,
    paddingVertical: Spacing.md,
    fontFamily: Fonts?.sans || 'regular-font',
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
    fontFamily: Fonts?.sans || 'regular-font',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: FontSizes.md,
    fontWeight: '600',
    fontFamily: Fonts?.sans || 'regular-font',
  },
});

