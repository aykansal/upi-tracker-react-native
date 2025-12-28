import { CategoryInfo, CategoryType } from '@/types/transaction';

export const CATEGORIES: Record<CategoryType, CategoryInfo> = {
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

export const CATEGORY_LIST: CategoryInfo[] = Object.values(CATEGORIES);

export const getCategoryColor = (category: CategoryType): string => {
  return CATEGORIES[category]?.color || CATEGORIES.other.color;
};

export const getCategoryIcon = (category: CategoryType): string => {
  return CATEGORIES[category]?.icon || CATEGORIES.other.icon;
};

export const getCategoryLabel = (category: CategoryType): string => {
  return CATEGORIES[category]?.label || CATEGORIES.other.label;
};

