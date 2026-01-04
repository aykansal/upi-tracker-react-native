import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Sharing from 'expo-sharing';

import { Colors, BorderRadius, FontSizes, Spacing } from '@/constants/theme';
import { CategoryType, UPIPaymentData } from '@/types/transaction';
import { CategoryPicker } from '@/components/transactions/category-picker';
import { saveTransaction } from '@/services/storage';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function PaymentScreen() {
  const params = useLocalSearchParams<{
    upiId: string;
    payeeName: string;
    amount: string;
    transactionNote: string;
    // Merchant support fields
    originalQRData: string;
    isMerchant: string;
    merchantCategory: string;
    organizationId: string;
    // QR image for sharing to UPI apps
    qrImageUri: string;
    // Method flags
    imageOnlyMode: string; // Method 1: only has image, no parsed data
    generatedQR: string;   // Method 2: QR was generated from data
  }>();

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const insets = useSafeAreaInsets();

  // Determine mode and transaction type
  const isMerchant = params.isMerchant === 'true';
  const isImageOnlyMode = params.imageOnlyMode === 'true';
  const isGeneratedQR = params.generatedQR === 'true';

  const [amount, setAmount] = useState(params.amount || '');
  const [category, setCategory] = useState<CategoryType | null>(null);
  const [reason, setReason] = useState(params.transactionNote || '');
  const [isLoading, setIsLoading] = useState(false);

  const paymentData: UPIPaymentData = {
    upiId: params.upiId || '',
    payeeName: params.payeeName || 'Unknown',
    amount: parseFloat(amount) || undefined,
    isMerchant: isMerchant,
    originalQRData: params.originalQRData || undefined,
  };

  const qrImageUri = params.qrImageUri || '';
  const hasQrImage = !!qrImageUri;

  // For image-only mode, we only need the image and amount for tracking
  // For normal mode, we need upiId, amount, category, and image
  const canPay = isImageOnlyMode
    ? hasQrImage && amount && parseFloat(amount) > 0 && category
    : paymentData.upiId && amount && parseFloat(amount) > 0 && category && hasQrImage;

  const handlePay = async () => {
    if (!canPay) {
      if (!hasQrImage) {
        Alert.alert('QR Image Missing', 'Could not capture QR image. Please scan again.');
      } else {
        Alert.alert('Missing Information', 'Please fill in all required fields.');
      }
      return;
    }

    setIsLoading(true);

    try {
      const amountNum = parseFloat(amount);

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          'Sharing Not Available',
          'Sharing is not available on this device.',
          [{ text: 'OK' }]
        );
        setIsLoading(false);
        return;
      }

      // Save transaction for tracking (before sharing in case user doesn't complete payment)
      await saveTransaction(
        paymentData,
        category!,
        reason.trim() || undefined,
        amountNum,
        isMerchant ? 'merchant' : 'p2p',
        params.merchantCategory || undefined,
        params.organizationId || undefined
      );

      // Share QR image to UPI app via share sheet
      await Sharing.shareAsync(qrImageUri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Pay with UPI App',
      });

      // Navigate back to home after sharing
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Failed to share QR image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    Alert.alert(
      'Discard Payment?',
      'Are you sure you want to cancel this payment?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: () => router.back(), style: 'destructive' },
      ]
    );
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
          {isImageOnlyMode ? 'Image Capture Mode' : isGeneratedQR ? 'Generated QR Mode' : 'New Payment'}
        </Text>
        <View style={styles.headerButton} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Payee Info Card */}
          <View style={[styles.payeeCard, { backgroundColor: colors.card }]}>
            <View style={styles.payeeIconContainer}>
              <Ionicons 
                name={isMerchant ? "storefront" : "person-circle"} 
                size={48} 
                color={colors.tint} 
              />
            </View>
            <View style={styles.payeeInfo}>
              <Text
                style={[styles.payeeName, { color: colors.text }]}
                numberOfLines={1}
              >
                {paymentData.payeeName}
              </Text>
              <Text
                style={[styles.upiId, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {paymentData.upiId}
              </Text>
              {isMerchant && (
                <View style={[styles.merchantBadge, { backgroundColor: colors.tint + '20' }]}>
                  <Ionicons name="shield-checkmark" size={12} color={colors.tint} />
                  <Text style={[styles.merchantBadgeText, { color: colors.tint }]}>
                    Verified Merchant
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* QR Image Warning */}
          {!hasQrImage && (
            <View style={[styles.warningCard, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="warning" size={20} color="#D97706" />
              <Text style={styles.warningText}>
                QR image not captured. Please go back and scan again.
              </Text>
            </View>
          )}

          {/* Amount Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Amount (for tracking) *
            </Text>
            <View
              style={[
                styles.amountInputContainer,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.currencySymbol, { color: colors.tint }]}>
                ₹
              </Text>
              <TextInput
                style={[
                  styles.amountInput, 
                  { color: colors.text },
                ]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </View>
            <Text style={[styles.trackingNote, { color: colors.textSecondary }]}>
              This amount is for tracking only. Actual payment amount is in the QR.
            </Text>
          </View>

          {/* Category Picker */}
          <CategoryPicker
            selectedCategory={category}
            onSelectCategory={setCategory}
          />

          {/* Reason Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Reason (optional)
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={reason}
              onChangeText={setReason}
              placeholder="e.g., Groceries, Lunch, etc."
              placeholderTextColor={colors.textSecondary}
              maxLength={50}
              returnKeyType="done"
            />
          </View>
        </ScrollView>

        {/* Pay Button */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.surface,
              paddingBottom: insets.bottom + Spacing.md,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.payButton,
              {
                backgroundColor: canPay ? colors.tint : colors.border,
              },
            ]}
            onPress={handlePay}
            disabled={!canPay || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <Text style={styles.payButtonText}>Opening...</Text>
            ) : (
              <>
                <Ionicons name="share-outline" size={20} color="#fff" />
                <Text style={styles.payButtonText}>
                  Open in UPI App
                </Text>
              </>
            )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  payeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  payeeIconContainer: {
    marginRight: Spacing.md,
  },
  payeeInfo: {
    flex: 1,
  },
  payeeName: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: 2,
  },
  upiId: {
    fontSize: FontSizes.sm,
  },
  merchantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
    gap: 4,
  },
  merchantBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  currencySymbol: {
    fontSize: FontSizes.xxl,
    fontWeight: '600',
    marginRight: Spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: FontSizes.xxl,
    fontWeight: '600',
    paddingVertical: Spacing.md,
  },
  trackingNote: {
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: '#92400E',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.md,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  payButtonText: {
    color: '#fff',
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
});
