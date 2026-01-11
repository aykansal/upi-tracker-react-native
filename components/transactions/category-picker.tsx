import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';

import { CategoryType, CategoryInfo } from '@/types/transaction';
import { DEFAULT_CATEGORY_LIST } from '@/constants/categories';
import { getCategories, AVAILABLE_ICONS } from '@/services/category-storage';
import { Colors, BorderRadius, FontSizes, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface CategoryPickerProps {
  selectedCategory: CategoryType | null;
  onSelectCategory: (category: CategoryType) => void;
}


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
  const scale = useSharedValue(isSelected ? 1.05 : 1);

  useEffect(() => {
    scale.value = withSpring(isSelected ? 1.05 : 1, {
      damping: 15,
      stiffness: 150,
    });
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: scale.value,
        },
      ],
    };
  });

  const getIconName = (icon: string): keyof typeof Ionicons.glyphMap => {
    // Check if it's a valid Ionicons icon
    if (AVAILABLE_ICONS.includes(icon)) {
      return icon as keyof typeof Ionicons.glyphMap;
    }
    return 'pricetag';
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[
          styles.categoryButton,
          {
            backgroundColor: isSelected ? category.color : colors.card,
            borderColor: isSelected ? category.color : colors.border,
          },
          animatedStyle,
        ]}
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
      </Animated.View>
    </TouchableOpacity>
  );
}

export function CategoryPicker({
  selectedCategory,
  onSelectCategory,
}: CategoryPickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const [categories, setCategories] = useState<CategoryInfo[]>(DEFAULT_CATEGORY_LIST);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const loaded = await getCategories();
      setCategories(loaded);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Category
        </Text>
        <ActivityIndicator size="small" color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Category
      </Text>
      <View style={styles.categoriesContainer}>
        {categories.map((category) => (
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

