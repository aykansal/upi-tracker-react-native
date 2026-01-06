import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryPieChart } from '@/components/charts/category-pie-chart';
import { TransactionCard } from '@/components/transactions/transaction-card';
import { BorderRadius, Colors, FontSizes, Fonts, Spacing } from '@/constants/theme';
import {
  deleteTransaction,
  getCurrentMonthKey,
  getMonthlyStats,
  getRecentTransactions,
} from '@/services/storage';
import { MonthlyStats, Transaction } from '@/types/transaction';

export default function HomeScreen() {
  const colors = Colors.light;
  const insets = useSafeAreaInsets();

  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const currentMonthKey = getCurrentMonthKey();
  const currentMonthLabel = format(new Date(), 'MMMM yyyy');

  const loadData = useCallback(async () => {
    try {
      const [transactions, stats] = await Promise.all([
        getRecentTransactions(3),
        getMonthlyStats(currentMonthKey),
      ]);
      setRecentTransactions(transactions);
      setMonthlyStats(stats);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, [currentMonthKey]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
    loadData();
  };

  const handleScanQR = () => {
    router.push('/scanner-generate');
  };

  const handleManualEntry = () => {
    router.push('/manual-entry');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.md },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tint}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.appName, { color: colors.tint }]}>
            UPI Tracker
          </Text>
          <Text style={[styles.monthLabel, { color: colors.textSecondary }]}>
            {currentMonthLabel}
          </Text>
        </View>

        {/* Monthly Total Card */}
        <View style={[styles.totalCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
            Total Spent This Month
          </Text>
          <Text style={[styles.totalAmount, { color: colors.text }]}>
            ₹{(monthlyStats?.total || 0).toLocaleString('en-IN', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}
          </Text>
          <Text style={[styles.transactionCount, { color: colors.textSecondary }]}>
            {monthlyStats?.transactionCount || 0} transactions
          </Text>
        </View>

        {/* Category Breakdown */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Spending by Category
          </Text>
          {monthlyStats && (
            <CategoryPieChart
              categoryBreakdown={monthlyStats.categoryBreakdown}
              total={monthlyStats.total}
            />
          )}
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Transactions
            </Text>
            {recentTransactions.length > 0 && (
              <TouchableOpacity
                onPress={() => router.push('/history')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[styles.seeAllButton, { color: colors.tint }]}>
                  See All
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {recentTransactions.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <Ionicons
                name="receipt-outline"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No transactions yet
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Tap the button below to start tracking
              </Text>
            </View>
          ) : (
            recentTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                onDelete={handleDelete}
              />
            ))
          )}
        </View>

        {/* Bottom padding for FABs */}
        <View style={{ height: 15}} />
      </ScrollView>

      {/* Payment Options */}
      <View
        style={[
          styles.paymentOptions,
          {
            bottom: insets.bottom + Spacing.md,
          },
        ]}
      >
        {/* Scan QR */}
        <TouchableOpacity
          style={[
            styles.paymentButton,
            {
              backgroundColor: colors.tint,
            },
          ]}
          onPress={handleScanQR}
          activeOpacity={0.8}
        >
          <Ionicons name="qr-code" size={20} color="#fff" />
          <Text style={styles.paymentButtonText}>Scan QR</Text>
        </TouchableOpacity>

        {/* Manual Entry */}
        <TouchableOpacity
          style={[
            styles.paymentButton,
            {
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            },
          ]}
          onPress={handleManualEntry}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={20} color={colors.text} />
          <Text style={[styles.paymentButtonText, { color: colors.text }]}>Manual Entry</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  appName: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    fontFamily: Fonts?.rounded || 'cute-font',
  },
  monthLabel: {
    fontSize: FontSizes.md,
    fontFamily: Fonts?.sans || 'regular-font',
  },
  totalCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  totalLabel: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs,
    fontFamily: Fonts?.sans || 'regular-font',
  },
  totalAmount: {
    fontSize: FontSizes.display,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    fontFamily: Fonts?.sans || 'regular-font',
  },
  transactionCount: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts?.sans || 'regular-font',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: Spacing.md,
    fontFamily: Fonts?.sans || 'regular-font',
  },
  seeAllButton: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    fontFamily: Fonts?.sans || 'regular-font',
  },
  emptyState: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    fontFamily: Fonts?.sans || 'regular-font',
  },
  emptySubtext: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
    fontFamily: Fonts?.sans || 'regular-font',
  },
  paymentOptions: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  paymentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: FontSizes.md,
    fontWeight: '600',
    fontFamily: Fonts?.sans || 'regular-font',
  },
});
