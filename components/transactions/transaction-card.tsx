import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { Transaction, CategoryInfo } from '@/types/transaction';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { getCategories, AVAILABLE_ICONS } from '@/services/category-storage';
import { Colors, BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface TransactionCardProps {
  transaction: Transaction;
  onDelete?: (id: string) => void;
  showDeleteButton?: boolean;
}

export function TransactionCard({
  transaction,
  onDelete,
  showDeleteButton = true,
}: TransactionCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const [categoryInfo, setCategoryInfo] = useState<CategoryInfo>(
    DEFAULT_CATEGORIES[transaction.category] || DEFAULT_CATEGORIES.other
  );

  useEffect(() => {
    loadCategory();
  }, [transaction.category]);

  const loadCategory = async () => {
    try {
      const categories = await getCategories();
      const found = categories.find(c => c.key === transaction.category);
      if (found) {
        setCategoryInfo(found);
      }
    } catch (error) {
      // Use default category on error
    }
  };

  const getIconName = (icon: string): keyof typeof Ionicons.glyphMap => {
    if (AVAILABLE_ICONS.includes(icon)) {
      return icon as keyof typeof Ionicons.glyphMap;
    }
    return 'pricetag';
  };

  const formattedDate = format(new Date(transaction.timestamp), 'MMM d, yyyy');
  const formattedTime = format(new Date(transaction.timestamp), 'h:mm a');

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* Category Icon */}
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: `${categoryInfo.color}20` },
        ]}
      >
        <Ionicons
          name={getIconName(categoryInfo.icon)}
          size={20}
          color={categoryInfo.color}
        />
      </View>

      {/* Transaction Details */}
      <View style={styles.details}>
        <Text style={[styles.reason, { color: colors.text }]} numberOfLines={1}>
          {transaction.reason || transaction.category}
        </Text>
        <Text
          style={[styles.payee, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {transaction.upiId}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {formattedDate} • {formattedTime}
          </Text>
        </View>
      </View>

      {/* Amount & Delete */}
      <View style={styles.rightSection}>
        <Text style={[styles.amount, { color: colors.text }]}>
          ₹{transaction.amount.toLocaleString('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })}
        </Text>
        {showDeleteButton && onDelete && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(transaction.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  details: {
    flex: 1,
  },
  reason: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: Fonts?.sans || 'regular-font',
  },
  payee: {
    fontSize: FontSizes.sm,
    marginBottom: 4,
    fontFamily: Fonts?.sans || 'regular-font',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts?.sans || 'regular-font',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    fontFamily: Fonts?.sans || 'regular-font',
  },
  deleteButton: {
    padding: Spacing.xs,
  },
});

