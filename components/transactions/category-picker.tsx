import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { CategoryType, CategoryInfo } from '@/types/transaction';
import { CATEGORY_LIST } from '@/constants/categories';
import { Colors, BorderRadius, FontSizes, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface CategoryPickerProps {
  selectedCategory: CategoryType | null;
  onSelectCategory: (category: CategoryType) => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function CategoryButton({
  category,
  isSelected,
  onPress,
}: {
  category: CategoryInfo;
  isSelected: boolean;
  onPress: () => void;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(isSelected ? 1.05 : 1, {
            damping: 15,
            stiffness: 150,
          }),
        },
      ],
    };
  }, [isSelected]);

  const getIconName = (icon: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      restaurant: 'restaurant',
      flash: 'flash',
      school: 'school',
      home: 'home',
      pricetag: 'pricetag',
    };
    return iconMap[icon] || 'pricetag';
  };

  return (
    <AnimatedTouchable
      style={[
        styles.categoryButton,
        {
          backgroundColor: isSelected ? category.color : colors.card,
          borderColor: isSelected ? category.color : colors.border,
        },
        animatedStyle,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: isSelected
              ? 'rgba(255, 255, 255, 0.2)'
              : `${category.color}20`,
          },
        ]}
      >
        <Ionicons
          name={getIconName(category.icon)}
          size={20}
          color={isSelected ? '#fff' : category.color}
        />
      </View>
      <Text
        style={[
          styles.categoryLabel,
          {
            color: isSelected ? '#fff' : colors.text,
          },
        ]}
        numberOfLines={1}
      >
        {category.label}
      </Text>
    </AnimatedTouchable>
  );
}

export function CategoryPicker({
  selectedCategory,
  onSelectCategory,
}: CategoryPickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Category
      </Text>
      <View style={styles.categoriesContainer}>
        {CATEGORY_LIST.map((category) => (
          <CategoryButton
            key={category.key}
            category={category}
            isSelected={selectedCategory === category.key}
            onPress={() => onSelectCategory(category.key)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
});

