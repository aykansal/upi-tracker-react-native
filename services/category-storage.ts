import { DEFAULT_CATEGORY_LIST } from '@/constants/categories';
import { CategoryInfo } from '@/types/transaction';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CATEGORIES_KEY = '@upitracker_categories';

// Available icons for categories
export const AVAILABLE_ICONS = [
  'restaurant',
  'flash',
  'school',
  'home',
  'pricetag',
  'cart',
  'car',
  'medkit',
  'airplane',
  'gift',
  'fitness',
  'film',
  'musical-notes',
  'game-controller',
  'shirt',
  'cut',
  'cafe',
  'beer',
  'pizza',
  'wallet',
  'card',
  'cash',
  'business',
  'briefcase',
  'construct',
  'hammer',
  'bulb',
  'water',
  'wifi',
  'phone-portrait',
  'desktop',
  'laptop',
  'tv',
  'headset',
  'book',
  'library',
  'newspaper',
  'document-text',
  'people',
  'person',
  'heart',
  'paw',
  'leaf',
  'flower',
  'globe',
  'train',
  'bus',
  'boat',
  'bicycle',
];

// Available colors for categories
export const AVAILABLE_COLORS = [
  '#F59E0B', // Amber
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#10B981', // Emerald
  '#EF4444', // Red
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#84CC16', // Lime
  '#06B6D4', // Cyan
  '#A855F7', // Violet
  '#F43F5E', // Rose
  '#78716C', // Stone
];

/**
 * Get all categories from storage
 * Returns default categories if none are stored
 */
export const getCategories = async (): Promise<CategoryInfo[]> => {
  try {
    const data = await AsyncStorage.getItem(CATEGORIES_KEY);
    if (!data) {
      // Initialize with default categories as an array
      await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORY_LIST));
      return DEFAULT_CATEGORY_LIST;
    }

    return JSON.parse(data); // must be an array
  } catch (error) {
    console.error('[getCategories] Error getting categories:', error);
    return DEFAULT_CATEGORY_LIST;
  }
};
/**
 * Add a new category
 */
export const addCategory = async (category: Omit<CategoryInfo, 'key'>): Promise<CategoryInfo> => {
  try {
    const categories = await getCategories();

    // Generate a unique key from the label
    const baseKey = category.label.toLowerCase().replace(/\s+/g, '-');
    let key = baseKey;
    let counter = 1;

    // Ensure key is unique
    while (categories.some(c => c.key === key)) {
      key = `${baseKey}-${counter}`;
      counter++;
    }

    const newCategory: CategoryInfo = {
      ...category,
      key,
    };

    categories.push(newCategory);
    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));

    return newCategory;
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
};

/**
 * Update an existing category
 */
export const updateCategory = async (key: string, updates: Partial<Omit<CategoryInfo, 'key'>>): Promise<boolean> => {
  try {
    const categories = await getCategories();
    const index = categories.findIndex(c => c.key === key);

    if (index === -1) {
      return false;
    }

    categories[index] = {
      ...categories[index],
      ...updates,
    };

    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    return true;
  } catch (error) {
    console.error('Error updating category:', error);
    return false;
  }
};

/**
 * Delete a category
 * Note: 'other' category cannot be deleted as it's the fallback
 */
export const deleteCategory = async (key: string): Promise<boolean> => {
  try {
    if (key === 'other') {
      console.warn('Cannot delete the "other" category');
      return false;
    }

    const categories = await getCategories();
    const filtered = categories.filter(c => c.key !== key);

    if (filtered.length === categories.length) {
      return false; // Category not found
    }

    // Ensure we always have at least 'other' category
    if (filtered.length === 0) {
      const otherCategory = DEFAULT_CATEGORY_LIST.find(c => c.key === 'other')!;
      filtered.push(otherCategory);
    }

    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting category:', error);
    return false;
  }
};

/**
 * Get a single category by key
 */
export const getCategoryByKey = async (key: string): Promise<CategoryInfo | null> => {
  try {
    const categories = await getCategories();
    return categories.find(c => c.key === key) || null;
  } catch (error) {
    console.error('Error getting category:', error);
    return null;
  }
};

/**
 * Reset categories to defaults
 */
export const resetCategoriesToDefaults = async (): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORY_LIST));
    return true;
  } catch (error) {
    console.error('Error resetting categories:', error);
    return false;
  }
};

/**
 * Get category color (with fallback)
 */
export const getCategoryColorAsync = async (key: string): Promise<string> => {
  const category = await getCategoryByKey(key);
  return category?.color || '#6B7280';
};

/**
 * Get category icon (with fallback)
 */
export const getCategoryIconAsync = async (key: string): Promise<string> => {
  const category = await getCategoryByKey(key);
  return category?.icon || 'pricetag';
};

/**
 * Get category label (with fallback)
 */
export const getCategoryLabelAsync = async (key: string): Promise<string> => {
  const category = await getCategoryByKey(key);
  return category?.label || 'Other';
};

