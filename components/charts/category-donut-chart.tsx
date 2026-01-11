import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { G, Path } from "react-native-svg";

import {
  DEFAULT_CATEGORY_LIST,
  categoryListToRecord,
} from "@/constants/categories";
import {
  BorderRadius,
  Colors,
  FontSizes,
  Fonts,
  Spacing,
} from "@/constants/theme";
import { getCategories } from "@/services/category-storage";
import { CategoryInfo, CategoryType } from "@/types/transaction";

// const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_SIZE = 200;
const CHART_RADIUS = 80;
const CHART_INNER_RADIUS = 50; // Creates the donut hole
const CHART_CENTER = CHART_SIZE / 2;

interface CategoryDonutChartProps {
  categoryBreakdown: Record<CategoryType, number>;
  total: number;
}

export function CategoryDonutChart({
  categoryBreakdown,
  total,
}: CategoryDonutChartProps) {
  const colors = Colors.light;
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

  // Prepare data for donut chart - only include categories with values > 0
  const chartData = Object.entries(categoryBreakdown)
    .filter(([_, amount]) => amount > 0)
    .map(([key, amount]) => {
      const cat = categoryRecord[key] || { label: key, color: "#6B7280" };
      return {
        name: cat.label,
        amount,
        color: cat.color,
        percentage: (amount / total) * 100,
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

  // Generate SVG paths for donut chart
  let currentAngle = -90; // Start from top
  const paths = chartData.map((item) => {
    const angle = (item.percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    // Convert angles to radians
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    // Calculate outer arc coordinates
    const x1 = CHART_CENTER + CHART_RADIUS * Math.cos(startRad);
    const y1 = CHART_CENTER + CHART_RADIUS * Math.sin(startRad);
    const x2 = CHART_CENTER + CHART_RADIUS * Math.cos(endRad);
    const y2 = CHART_CENTER + CHART_RADIUS * Math.sin(endRad);

    // Calculate inner arc coordinates
    const x3 = CHART_CENTER + CHART_INNER_RADIUS * Math.cos(endRad);
    const y3 = CHART_CENTER + CHART_INNER_RADIUS * Math.sin(endRad);
    const x4 = CHART_CENTER + CHART_INNER_RADIUS * Math.cos(startRad);
    const y4 = CHART_CENTER + CHART_INNER_RADIUS * Math.sin(startRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    // Create donut segment path
    const pathData = `M ${x1} ${y1} A ${CHART_RADIUS} ${CHART_RADIUS} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${CHART_INNER_RADIUS} ${CHART_INNER_RADIUS} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;

    currentAngle = endAngle;

    return (
      <Path
        key={item.name}
        d={pathData}
        fill={item.color}
        stroke={colors.background}
        strokeWidth={2}
      />
    );
  });

  return (
    <View style={styles.container}>
      <View style={styles.chartWrapper}>
        <Svg width={CHART_SIZE} height={CHART_SIZE} viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}>
          <G>{paths}</G>
        </Svg>
        {/* Center text showing total */}
        <View style={styles.centerText}>
          <Text style={[styles.centerAmount, { color: colors.text }]}>
            ₹{total.toLocaleString("en-IN", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </Text>
          <Text style={[styles.centerLabel, { color: colors.textSecondary }]}>
            Total
          </Text>
        </View>
      </View>

      {/* Custom Legend */}
      <View style={styles.legend}>
        {chartData.map((item) => {
          const percentage = item.percentage.toFixed(0);
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
  chartWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  centerText: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: CHART_SIZE,
    height: CHART_SIZE,
  },
  centerAmount: {
    fontSize: FontSizes.sm,
    fontWeight: "700",
    fontFamily: Fonts?.sans || "regular-font",
  },
  centerLabel: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts?.sans || "regular-font",
    marginTop: 2,
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
    fontFamily: Fonts?.sans || "regular-font",
  },
  legendValue: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    marginRight: Spacing.md,
    fontFamily: Fonts?.sans || "regular-font",
  },
  legendPercentage: {
    fontSize: FontSizes.sm,
    width: 40,
    textAlign: "right",
    fontFamily: Fonts?.sans || "regular-font",
  },
});

