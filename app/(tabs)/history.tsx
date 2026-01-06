import { Ionicons } from "@expo/vector-icons";
import { format, isSameDay, isWithinInterval, startOfDay } from "date-fns";
import { useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  LayoutAnimation,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WeeklyBarChart } from "@/components/charts/weekly-bar-chart";
import { DaySelector } from "@/components/day-selector";
import { CatEmptyState } from "@/components/mascots/cat-illustrations";
import { TransactionCard } from "@/components/transactions/transaction-card";
import {
  BorderRadius,
  Colors,
  FontSizes,
  Fonts,
  Spacing,
} from "@/constants/theme";
import { deleteTransaction, getAllTransactions } from "@/services/storage";
import { Transaction } from "@/types/transaction";
import { addMockDataForPastWeeks } from "@/utils/add-mock-data";

// Group transactions by date for scroll-to-date functionality
interface GroupedTransaction {
  date: Date;
  transactions: Transaction[];
}

export default function HistoryScreen() {
  const colors = Colors.light;
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [isChartExpanded, setIsChartExpanded] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  const today = useMemo(() => startOfDay(new Date()), []);

  // Calculate rolling date window: 7-day window ending on selectedDate
  const endDate = useMemo(() => startOfDay(selectedDate), [selectedDate]);
  const startDate = useMemo(() => {
    const date = new Date(endDate);
    date.setDate(date.getDate() - 6); // 7-day window (inclusive)
    return startOfDay(date);
  }, [endDate]);

  // Find earliest transaction date
  const earliestDate = useMemo(() => {
    if (allTransactions.length === 0) return null;
    const timestamps = allTransactions.map((tx) => tx.timestamp);
    const earliest = Math.min(...timestamps);
    return startOfDay(new Date(earliest));
  }, [allTransactions]);

  // Filter transactions for the rolling date window (for bar chart only)
  const visibleTransactions = useMemo(() => {
    return allTransactions.filter((tx) => {
      const txDate = startOfDay(new Date(tx.timestamp));
      return isWithinInterval(txDate, { start: startDate, end: endDate });
    });
  }, [allTransactions, startDate, endDate]);

  // Apply search filter to ALL transactions (not just visible window)
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) {
      return allTransactions; // Show all transactions, not filtered by week
    }
    const lowerQuery = searchQuery.toLowerCase().trim();
    return allTransactions.filter((tx) => {
      return (
        tx.reason?.toLowerCase().includes(lowerQuery) ||
        tx.category.toLowerCase().includes(lowerQuery) ||
        tx.payeeName.toLowerCase().includes(lowerQuery) ||
        tx.upiId.toLowerCase().includes(lowerQuery)
      );
    });
  }, [allTransactions, searchQuery]);

  // Group transactions by date for scroll-to-date
  const groupedTransactions = useMemo(() => {
    const groups: GroupedTransaction[] = [];
    const dateMap = new Map<string, Transaction[]>();

    filteredTransactions.forEach((tx) => {
      const txDate = startOfDay(new Date(tx.timestamp));
      const dateKey = format(txDate, "yyyy-MM-dd");
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey)!.push(tx);
    });

    // Convert to array and sort by date (newest first)
    dateMap.forEach((transactions, dateKey) => {
      const date = new Date(dateKey);
      groups.push({ date, transactions });
    });

    return groups.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [filteredTransactions]);

  // Flatten grouped transactions for FlatList
  const flatTransactions = useMemo(() => {
    return groupedTransactions.flatMap((group) => group.transactions);
  }, [groupedTransactions]);

  // Compute daily totals for the rolling window
  const dailyData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      return startOfDay(date);
    });

    return days.map((date) => {
      const dayTransactions = visibleTransactions.filter((tx) => {
        const txDate = startOfDay(new Date(tx.timestamp));
        return isSameDay(txDate, date);
      });

      const amount = dayTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      return {
        date,
        amount,
        dayLabel: format(date, "EEE"), // Mon, Tue, etc.
      };
    });
  }, [visibleTransactions, startDate]);

  const maxDailyAmount = useMemo(() => {
    return Math.max(...dailyData.map((d) => d.amount), 0);
  }, [dailyData]);

  // Total for all transactions (for summary)
  const allTransactionsTotal = useMemo(() => {
    return filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  }, [filteredTransactions]);

  const loadTransactions = useCallback(async () => {
    try {
      const all = await getAllTransactions();
      // If no transactions, add mock data for testing
      // if (all.length === 0) {
      //   await addMockDataForPastWeeks();
      //   const refreshed = await getAllTransactions();
      //   setAllTransactions(refreshed);
      // }
      setAllTransactions(all);
    } catch (error) {
      console.error("Error loading transactions:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteTransaction(id);
            loadTransactions();
          },
        },
      ]
    );
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const handleDateSelect = (date: Date) => {
    const newSelectedDate = startOfDay(date);
    setSelectedDate(newSelectedDate);
    setSearchQuery(""); // Clear search when changing date

    // Scroll to the selected date's transactions in ALL transactions
    setTimeout(() => {
      // Group ALL transactions by date (not just visible window)
      const dateMap = new Map<string, Transaction[]>();
      allTransactions.forEach((tx) => {
        const txDate = startOfDay(new Date(tx.timestamp));
        const dateKey = format(txDate, "yyyy-MM-dd");
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, []);
        }
        dateMap.get(dateKey)!.push(tx);
      });

      // Flatten and sort for index calculation (newest first)
      const allFlat: Transaction[] = [];
      dateMap.forEach((transactions) => {
        allFlat.push(...transactions);
      });
      allFlat.sort((a, b) => b.timestamp - a.timestamp);

      // Find transactions for the selected date
      const dateKey = format(newSelectedDate, "yyyy-MM-dd");
      const targetTransactions = dateMap.get(dateKey) || [];

      if (targetTransactions.length > 0 && allFlat.length > 0) {
        // Find the index of the first transaction for this date
        const firstTx = targetTransactions[0];
        const index = allFlat.findIndex((tx) => tx.id === firstTx.id);

        // Proper bounds checking - ensure index is valid
        if (index >= 0 && index < allFlat.length) {
          try {
            flatListRef.current?.scrollToIndex({
              index,
              animated: true,
              viewPosition: 0.1,
            });
          } catch (error) {
            // Fallback to offset scroll if index scroll fails
            console.warn("scrollToIndex failed, using offset fallback:", error);
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          }
        } else {
          // Index out of bounds - this shouldn't happen but handle gracefully
          console.warn(
            `Index ${index} out of bounds for array length ${allFlat.length}`
          );
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }
      } else {
        // If no transactions for this date, scroll to top
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
    }, 300);
  };

  const toggleChart = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsChartExpanded(!isChartExpanded);
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TransactionCard
      transaction={item}
      onDelete={handleDelete}
      showDeleteButton
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <CatEmptyState />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {searchQuery ? "Nothing found" : "No transactions in this period"}
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
        {searchQuery
          ? "Try a different search"
          : "Your transactions for this period will appear here"}
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <StatusBar style="dark" />

      {/* Header with Search */}
      <View style={styles.header}>
        {/* Search Bar */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons
            name="search"
            size={20}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search transactions..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Day Selector */}
        <DaySelector
          selectedDate={selectedDate}
          onSelectDate={handleDateSelect}
          earliestDate={earliestDate}
          today={today}
        />

        {/* Collapsible Chart Section */}
        <View style={styles.chartSection}>
          <TouchableOpacity
            style={styles.chartHeader}
            onPress={toggleChart}
            activeOpacity={0.7}
          >
            <Text style={[styles.chartHeaderText, { color: colors.text }]}>
              Weekly spending
            </Text>
            <Ionicons
              name={isChartExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {isChartExpanded && (
            <WeeklyBarChart dailyData={dailyData} maxAmount={maxDailyAmount} />
          )}
        </View>

        {/* Summary Row */}
        <View style={styles.summary}>
          <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
            {filteredTransactions.length} transaction
            {filteredTransactions.length !== 1 ? "s" : ""}
          </Text>
          <Text style={[styles.summaryAmount, { color: colors.text }]}>
            ₹{allTransactionsTotal.toLocaleString("en-IN")}
          </Text>
        </View>
      </View>

      {/* Transaction List */}
      <FlatList
        ref={flatListRef}
        data={flatTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        contentContainerStyle={[
          styles.listContent,
          flatTransactions.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tint}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        getItemLayout={(data, index) => {
          // Approximate item height: card height + margin
          const ITEM_HEIGHT = 80; // Approximate height of TransactionCard + margin
          return {
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          };
        }}
        onScrollToIndexFailed={(info) => {
          // Proper bounds checking and fallback
          const targetIndex = Math.min(info.index, flatTransactions.length - 1);
          if (targetIndex >= 0 && targetIndex < flatTransactions.length) {
            const wait = new Promise((resolve) => setTimeout(resolve, 500));
            wait.then(() => {
              try {
                flatListRef.current?.scrollToIndex({
                  index: targetIndex,
                  animated: true,
                  viewPosition: 0.1,
                });
              } catch (error) {
                // Final fallback: scroll to offset
                console.warn(
                  "scrollToIndex retry failed, using offset:",
                  error
                );
                flatListRef.current?.scrollToOffset({
                  offset: 0,
                  animated: true,
                });
              }
            });
          } else {
            // Index out of bounds, scroll to top
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.md,
    fontFamily: Fonts?.sans || "regular-font",
  },
  clearButton: {
    padding: Spacing.xs,
  },
  chartSection: {
    marginBottom: Spacing.md,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  chartHeaderText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts?.sans || "regular-font",
    fontWeight: "600",
  },
  summary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.md,
  },
  summaryText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts?.sans || "regular-font",
  },
  summaryAmount: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts?.sans || "regular-font",
    fontWeight: "700",
  },
  listContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts?.sans || "regular-font",
    fontWeight: "600",
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts?.sans || "regular-font",
    textAlign: "center",
  },
});
