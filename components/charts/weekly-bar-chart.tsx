import { BorderRadius, Colors, FontSizes, Fonts, Spacing } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface DailyData {
  date: Date;
  amount: number;
  dayLabel: string; // e.g., "Mon", "Tue"
}

interface WeeklyBarChartProps {
  dailyData: DailyData[];
  maxAmount: number;
}

export function WeeklyBarChart({ dailyData, maxAmount }: WeeklyBarChartProps) {
  const colors = Colors.light;
  const maxBarHeight = 120;
  const barWidth = 40;
  const gap = Spacing.sm;

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.chartContainer}>
        {dailyData.map((day, index) => {
          const barHeight = maxAmount > 0 ? (day.amount / maxAmount) * maxBarHeight : 0;
          const percentage = maxAmount > 0 ? ((day.amount / maxAmount) * 100).toFixed(0) : '0';

          return (
            <View key={index} style={styles.barWrapper}>
              {/* Amount label above bar */}
              {day.amount > 0 && (
                <Text style={[styles.amountLabel, { color: colors.text }]}>
                  ₹{day.amount.toLocaleString('en-IN', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </Text>
              )}
              
              {/* Bar */}
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(barHeight, day.amount > 0 ? 4 : 0),
                      backgroundColor: day.amount > 0 ? colors.tint : colors.border,
                      opacity: day.amount > 0 ? 0.7 : 0.3,
                    },
                  ]}
                />
              </View>

              {/* Day label */}
              <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>
                {day.dayLabel}
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
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    minHeight: 150,
    paddingTop: Spacing.md,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  amountLabel: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts?.sans || 'regular-font',
    fontWeight: '600',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  barContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 120,
  },
  bar: {
    width: '70%',
    borderRadius: BorderRadius.sm,
    minHeight: 4,
  },
  dayLabel: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts?.sans || 'regular-font',
    marginTop: Spacing.xs,
  },
});

