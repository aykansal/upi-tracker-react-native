import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ScrollView, View } from 'react-native';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Colors, BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';

interface WeekSelectorProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function WeekSelector({ selectedDate, onSelectDate }: WeekSelectorProps) {
  const colors = Colors.light;
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday as start
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scrollView}
    >
      {weekDays.map((date, index) => {
        const isSelected = isSameDay(date, selectedDate);
        const dayLabel = format(date, 'EEE'); // Mon, Tue, etc.
        const dayNumber = format(date, 'd'); // 1, 2, etc.

        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayButton,
              {
                backgroundColor: isSelected ? colors.tint : colors.card,
                borderColor: isSelected ? colors.tint : colors.border,
              },
            ]}
            onPress={() => onSelectDate(date)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.dayLabel,
                {
                  color: isSelected ? '#FFFFFF' : colors.textSecondary,
                },
              ]}
            >
              {dayLabel}
            </Text>
            <Text
              style={[
                styles.dayNumber,
                {
                  color: isSelected ? '#FFFFFF' : colors.text,
                },
              ]}
            >
              {dayNumber}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    marginBottom: Spacing.md,
  },
  container: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  dayButton: {
    width: 50,
    height: 70,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  dayLabel: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts?.sans || 'regular-font',
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  dayNumber: {
    fontSize: FontSizes.md,
    fontFamily: Fonts?.sans || 'regular-font',
    fontWeight: '600',
  },
});

