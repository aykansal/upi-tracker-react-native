import { BorderRadius, Colors, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { differenceInDays, format, isSameDay, startOfDay } from 'date-fns';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DaySelectorProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  earliestDate: Date | null; // Earliest transaction date
  today: Date;
}

export function DaySelector({ selectedDate, onSelectDate, earliestDate, today }: DaySelectorProps) {
  const colors = Colors.light;

  // Generate dates from earliest transaction to today
  const availableDates = useMemo(() => {
    if (!earliestDate) {
      // If no transactions, show last 30 days
      const dates: Date[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dates.push(startOfDay(date));
      }
      return dates;
    }

    const dates: Date[] = [];
    const daysDiff = differenceInDays(today, earliestDate);
    const maxDays = Math.min(daysDiff, 365); // Limit to 1 year for performance

    // Generate dates from earliest to today
    for (let i = maxDays; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(startOfDay(date));
    }

    return dates;
  }, [earliestDate, today]);

  // Find index of selected date to scroll to it
  const selectedIndex = useMemo(() => {
    return availableDates.findIndex((date) => isSameDay(date, selectedDate));
  }, [availableDates, selectedDate]);

  const scrollViewRef = React.useRef<ScrollView>(null);

  React.useEffect(() => {
    if (selectedIndex >= 0 && scrollViewRef.current) {
      // Scroll to selected date
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: selectedIndex * 60, // Approximate width per item
          animated: true,
        });
      }, 100);
    }
  }, [selectedIndex]);

  const isToday = (date: Date) => isSameDay(date, today);

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scrollView}
    >
      {availableDates.map((date, index) => {
        const isSelected = isSameDay(date, selectedDate);
        const dayLabel = format(date, 'EEE'); // Mon, Tue, etc.
        const dayNumber = format(date, 'd'); // 1, 2, etc.
        const isTodayDate = isToday(date);

        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayButton,
              {
                backgroundColor: isSelected ? colors.tint : colors.card,
                borderColor: isSelected ? colors.tint : isTodayDate ? colors.tint : colors.border,
                borderWidth: isTodayDate && !isSelected ? 2 : 1,
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
            {isTodayDate && !isSelected && (
              <View style={[styles.todayIndicator, { backgroundColor: colors.tint }]} />
            )}
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    position: 'relative',
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
  todayIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

