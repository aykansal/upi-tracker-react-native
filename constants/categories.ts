import { CategoryInfo, CategoryType } from '@/types/transaction';

// Default categories as a static fallback (used for synchronous access)
export const DEFAULT_CATEGORIES: Record<string, CategoryInfo> = {
  food: {
    key: 'food',
    label: 'Food',
    icon: 'restaurant',
    color: '#F59E0B', // Amber
  },
  utility: {
    key: 'utility',
    label: 'Utility',
    icon: 'flash',
    color: '#3B82F6', // Blue
  },
  college: {
    key: 'college',
    label: 'College',
    icon: 'school',
    color: '#8B5CF6', // Purple
  },
  rent: {
    key: 'rent',
    label: 'Rent',
    icon: 'home',
    color: '#EC4899', // Pink
  },
  other: {
    key: 'other',
    label: 'Other',
    icon: 'pricetag',
    color: '#6B7280', // Gray
  },
};

export const DEFAULT_CATEGORY_LIST: CategoryInfo[] = Object.values(DEFAULT_CATEGORIES);

/**
 * Get category color with fallback
 */
export const getCategoryColor = (category: CategoryType, categoryList?: CategoryInfo[]): string => {
  const list = categoryList || DEFAULT_CATEGORY_LIST;
  const found = list.find(c => c.key === category);
  return found?.color || DEFAULT_CATEGORIES.other.color;
};

/**
 * Get category icon with fallback
 */
export const getCategoryIcon = (category: CategoryType, categoryList?: CategoryInfo[]): string => {
  const list = categoryList || DEFAULT_CATEGORY_LIST;
  const found = list.find(c => c.key === category);
  return found?.icon || DEFAULT_CATEGORIES.other.icon;
};

/**
 * Get category label with fallback
 */
export const getCategoryLabel = (category: CategoryType, categoryList?: CategoryInfo[]): string => {
  const list = categoryList || DEFAULT_CATEGORY_LIST;
  const found = list.find(c => c.key === category);
  return found?.label || DEFAULT_CATEGORIES.other.label;
};

/**
 * Convert category list to record format
 */
export const categoryListToRecord = (list: CategoryInfo[]): Record<string, CategoryInfo> => {
  return list.reduce((acc, cat) => {
    acc[cat.key] = cat;
    return acc;
  }, {} as Record<string, CategoryInfo>);
};

