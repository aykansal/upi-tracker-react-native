import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { PieChart } from "react-native-chart-kit";

import { CategoryType, CategoryInfo } from "@/types/transaction";
import {
  DEFAULT_CATEGORY_LIST,
  categoryListToRecord,
} from "@/constants/categories";
import { getCategories } from "@/services/category-storage";
import {
  Colors,
  FontSizes,
  Spacing,
  BorderRadius,
  Fonts,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const SCREEN_WIDTH = Dimensions.get("window").width;

interface CategoryPieChartProps {
  categoryBreakdown: Record<CategoryType, number>;
  total: number;
}

export function CategoryPieChart({
  categoryBreakdown,
  total,
}: CategoryPieChartProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const [categories, setCategories] = useState<CategoryInfo[]>(
    DEFAULT_CATEGORY_LIST
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const loaded = await getCategories();
      setCategories(loaded);
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const categoryRecord = categoryListToRecord(categories);

  // Prepare data for pie chart - only include categories with values > 0
  const chartData = Object.entries(categoryBreakdown)
    .filter(([_, amount]) => amount > 0)
    .map(([key, amount]) => {
      const cat = categoryRecord[key] || { label: key, color: "#6B7280" };
      return {
        name: cat.label,
        amount,
        color: cat.color,
        legendFontColor: colors.textSecondary,
        legendFontSize: 12,
      };
    });

  // If loading, show spinner
  if (isLoading) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
        <ActivityIndicator size="small" color={colors.tint} />
      </View>
    );
  }

  // If no data, show empty state
  if (chartData.length === 0 || total === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No spending data yet
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
          Start tracking your expenses!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PieChart
        data={chartData}
        width={SCREEN_WIDTH - Spacing.lg * 2}
        height={180}
        chartConfig={{
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        }}
        accessor="amount"
        backgroundColor="transparent"
        paddingLeft="0"
        absolute={false}
        hasLegend={false}
      />

      {/* Custom Legend */}
      <View style={styles.legend}>
        {chartData.map((item) => {
          const percentage = ((item.amount / total) * 100).toFixed(0);
          return (
            <View key={item.name} style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: item.color }]}
              />
              <Text
                style={[styles.legendLabel, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text style={[styles.legendValue, { color: colors.text }]}>
                ₹{item.amount.toLocaleString("en-IN")}
              </Text>
              <Text
                style={[
                  styles.legendPercentage,
                  { color: colors.textSecondary },
                ]}
              >
                {percentage}%
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  emptyContainer: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 150,
  },
  emptyText: {
    fontSize: FontSizes.md,
    fontWeight: "500",
    marginBottom: Spacing.xs,
    fontFamily: Fonts?.sans || "regular-font",
  },
  emptySubtext: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts?.sans || "regular-font",
  },
  legend: {
    width: "100%",
    marginTop: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  legendLabel: {
    flex: 1,
    fontSize: FontSizes.sm,
  },
  legendValue: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    marginRight: Spacing.md,
  },
  legendPercentage: {
    fontSize: FontSizes.sm,
    width: 40,
    textAlign: "right",
  },
});
