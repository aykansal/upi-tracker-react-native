import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryDonutChart, CategoryLegend } from '@/components/charts/category-donut-chart';
import { CatHeader } from '@/components/mascots/cat-illustrations';
import { TransactionCard } from '@/components/transactions/transaction-card';
import { BorderRadius, Colors, Fonts, FontSizes, Spacing } from '@/constants/theme';
import {
  deleteTransaction,
  getCurrentMonthKey,
  getMonthlyStats,
  getRecentTransactions,
} from '@/services/storage';
import { getUserProfile } from '@/services/user-storage';
import { MonthlyStats, Transaction } from '@/types/transaction';

export default function HomeScreen() {
  const colors = Colors.light;
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState<string>('');
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const currentMonthKey = getCurrentMonthKey();

  const loadData = useCallback(async () => {
    try {
      // Load username from AsyncStorage
      const profile = await getUserProfile();
      if (profile) {
        setUsername(profile.name);
      }

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tint}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with greeting and cat */}
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            <Text style={[styles.greeting, { color: colors.text }]}>
              Hey, {username || 'there'}
            </Text>
          </View>
          <View style={styles.catContainer}>
            <CatHeader />
          </View>
        </View>

        {/* Combined Monthly Total and Donut Chart */}
        {monthlyStats && monthlyStats.total > 0 ? (
          <View style={[styles.combinedCard, { backgroundColor: colors.card }]}>
            {/* Chart Centered */}
            <View style={styles.chartContainer}>
              <CategoryDonutChart
                categoryBreakdown={monthlyStats.categoryBreakdown}
                total={monthlyStats.total}
                showLegend={false}
              />
            </View>
            {/* Legend Below */}
            <View style={styles.legendContainer}>
              <CategoryLegend
                categoryBreakdown={monthlyStats.categoryBreakdown}
                total={monthlyStats.total}
              />
            </View>
          </View>
        ) : (
          <View style={[styles.totalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.totalAmount, { color: colors.text }]}>
              ₹0
            </Text>
            <Text style={[styles.totalSubtitle, { color: colors.textSecondary }]}>
              This month
            </Text>
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
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

        {/* Bottom padding for fixed actions */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Bottom Actions - Above Tab Bar */}
      <View
        style={[
          styles.bottomActions,
          {
            paddingBottom: insets.bottom + Spacing.md,
            // backgroundColor: colors.background,
          },
        ]}
      >
        {/* Primary: Scan QR */}
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.tint }]}
          onPress={handleScanQR}
          activeOpacity={0.8}
        >
          <Ionicons name="qr-code" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Scan QR</Text>
        </TouchableOpacity>

        {/* Secondary: Manual Entry */}
        <TouchableOpacity
          style={[
            styles.secondaryButton,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
          onPress={handleManualEntry}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={20} color={colors.text} />
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
            Manual Entry
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontFamily: Fonts?.rounded || 'cute-font',
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
  },
  catContainer: {
    opacity: 0.4,
  },
  totalCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  combinedCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  legendContainer: {
    width: '100%',
  },
  totalAmount: {
    fontFamily: Fonts?.sans || 'regular-font',
    fontSize: FontSizes.display,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  totalSubtitle: {
    fontFamily: Fonts?.sans || 'regular-font',
    fontSize: FontSizes.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Fonts?.sans || 'regular-font',
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  seeAllButton: {
    fontFamily: Fonts?.sans || 'regular-font',
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  transactionsSection: {
    marginBottom: Spacing.xl,
  },
  emptyState: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: Fonts?.sans || 'regular-font',
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontFamily: Fonts?.sans || 'regular-font',
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  bottomActions: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  primaryButtonText: {
    fontFamily: Fonts?.sans || 'regular-font',
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  secondaryButtonText: {
    fontFamily: Fonts?.sans || 'regular-font',
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
});
