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

import { Colors, BorderRadius, FontSizes, Spacing } from '@/constants/theme';
import { CategoryType, UPIPaymentData } from '@/types/transaction';
import { CategoryPicker } from '@/components/transactions/category-picker';
import { saveTransaction } from '@/services/storage';
import { launchPayment } from '@/services/upi-launcher';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function PaymentScreen() {
  const params = useLocalSearchParams<{
    upiId: string;
    payeeName: string;
    amount: string;
    transactionNote: string;
  }>();

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const insets = useSafeAreaInsets();

  const [amount, setAmount] = useState(params.amount || '');
  const [category, setCategory] = useState<CategoryType | null>(null);
  const [reason, setReason] = useState(params.transactionNote || '');
  const [isLoading, setIsLoading] = useState(false);

  const paymentData: UPIPaymentData = {
    upiId: params.upiId || '',
    payeeName: params.payeeName || 'Unknown',
    amount: parseFloat(amount) || undefined,
  };

  const canPay =
    paymentData.upiId &&
    amount &&
    parseFloat(amount) > 0 &&
    category;

  const handlePay = async () => {
    if (!canPay) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    setIsLoading(true);

    try {
      const amountNum = parseFloat(amount);

      // Try to launch payment first
      const launched = await launchPayment({
        upiId: paymentData.upiId,
        payeeName: paymentData.payeeName,
        amount: amountNum,
        transactionNote: reason.trim() || undefined,
      });

      if (!launched) {
        // Don't save transaction if no UPI app was found
        Alert.alert(
          'No UPI App Found',
          'Could not find a UPI app on your device. Please install a UPI app to make payments.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Only save transaction if payment was successfully launched
      await saveTransaction(
        paymentData,
        category!,
        reason.trim() || undefined,
        amountNum
      );

      // Navigate back to home after launching payment
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Failed to process payment. Please try again.');
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
          New Payment
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
              <Ionicons name="person-circle" size={48} color={colors.tint} />
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
            </View>
          </View>

          {/* Amount Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Amount *
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
                style={[styles.amountInput, { color: colors.text }]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </View>
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
              <Text style={styles.payButtonText}>Processing...</Text>
            ) : (
              <>
                <Ionicons name="wallet" size={20} color="#fff" />
                <Text style={styles.payButtonText}>
                  Pay {amount ? `₹${amount}` : 'Now'}
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

