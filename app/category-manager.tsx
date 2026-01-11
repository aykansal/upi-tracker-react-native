import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { Colors, BorderRadius, FontSizes, Spacing } from '@/constants/theme';
import { CategoryInfo } from '@/types/transaction';
import {
  getCategories,
  addCategory,
  deleteCategory,
  AVAILABLE_ICONS,
  AVAILABLE_COLORS,
  resetCategoriesToDefaults,
} from '@/services/category-storage';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function CategoryManagerScreen() {
  const colors = Colors.light;
  const insets = useSafeAreaInsets();

  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New category form state
  const [newLabel, setNewLabel] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('pricetag');
  const [selectedColor, setSelectedColor] = useState(AVAILABLE_COLORS[0]);

  const loadCategories = useCallback(async () => {
    try {
      const loaded = await getCategories();
      setCategories(loaded);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [loadCategories])
  );

  const handleClose = () => {
    router.back();
  };

  const handleDeleteCategory = (category: CategoryInfo) => {
    if (category.key === 'other') {
      Alert.alert('Cannot Delete', 'The "Other" category cannot be deleted as it serves as a fallback.');
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.label}"? Existing transactions with this category will retain the category key.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteCategory(category.key);
            if (success) {
              loadCategories();
            } else {
              Alert.alert('Error', 'Failed to delete category.');
            }
          },
        },
      ]
    );
  };

  const handleAddCategory = async () => {
    const trimmedLabel = newLabel.trim();
    
    if (!trimmedLabel) {
      Alert.alert('Required', 'Please enter a category name.');
      return;
    }

    if (trimmedLabel.length < 2) {
      Alert.alert('Invalid', 'Category name must be at least 2 characters.');
      return;
    }

    // Check for duplicate labels
    const exists = categories.some(
      c => c.label.toLowerCase() === trimmedLabel.toLowerCase()
    );
    if (exists) {
      Alert.alert('Duplicate', 'A category with this name already exists.');
      return;
    }

    try {
      await addCategory({
        label: trimmedLabel,
        icon: selectedIcon,
        color: selectedColor,
      });
      
      setShowAddModal(false);
      setNewLabel('');
      setSelectedIcon('pricetag');
      setSelectedColor(AVAILABLE_COLORS[0]);
      loadCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      Alert.alert('Error', 'Failed to add category. Please try again.');
    }
  };

  const handleResetDefaults = () => {
    Alert.alert(
      'Reset to Defaults',
      'This will replace all categories with the default ones. Existing transactions will retain their category keys.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const success = await resetCategoriesToDefaults();
            if (success) {
              loadCategories();
              Alert.alert('Success', 'Categories reset to defaults.');
            } else {
              Alert.alert('Error', 'Failed to reset categories.');
            }
          },
        },
      ]
    );
  };

  const getIconName = (icon: string): keyof typeof Ionicons.glyphMap => {
    if (AVAILABLE_ICONS.includes(icon)) {
      return icon as keyof typeof Ionicons.glyphMap;
    }
    return 'pricetag';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + Spacing.sm,
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Manage Categories
        </Text>
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={styles.headerButton}
        >
          <Ionicons name="add" size={24} color={colors.tint} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Categories List */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {categories.map((category, index) => (
            <View key={category.key}>
              <View style={styles.categoryItem}>
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: `${category.color}20` },
                  ]}
                >
                  <Ionicons
                    name={getIconName(category.icon)}
                    size={20}
                    color={category.color}
                  />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={[styles.categoryLabel, { color: colors.text }]}>
                    {category.label}
                  </Text>
                  <Text style={[styles.categoryKey, { color: colors.textSecondary }]}>
                    {category.key}
                  </Text>
                </View>
                {category.key !== 'other' && (
                  <TouchableOpacity
                    onPress={() => handleDeleteCategory(category)}
                    style={styles.deleteButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
              {index < categories.length - 1 && (
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              )}
            </View>
          ))}
        </View>

        {/* Reset Button */}
        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: colors.card }]}
          onPress={handleResetDefaults}
        >
          <Ionicons name="refresh" size={20} color={colors.textSecondary} />
          <Text style={[styles.resetButtonText, { color: colors.textSecondary }]}>
            Reset to Default Categories
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Category Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
                paddingBottom: insets.bottom + Spacing.lg,
              },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                New Category
              </Text>
              <TouchableOpacity onPress={handleAddCategory}>
                <Text style={[styles.modalSave, { color: colors.tint }]}>
                  Add
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Category Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Name
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={newLabel}
                  onChangeText={setNewLabel}
                  placeholder="e.g., Shopping, Entertainment"
                  placeholderTextColor={colors.textSecondary}
                  maxLength={20}
                  autoFocus
                />
              </View>

              {/* Preview */}
              <View style={styles.previewContainer}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Preview
                </Text>
                <View
                  style={[
                    styles.previewBadge,
                    {
                      backgroundColor: selectedColor,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.previewIcon,
                      { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                    ]}
                  >
                    <Ionicons
                      name={getIconName(selectedIcon)}
                      size={20}
                      color="#fff"
                    />
                  </View>
                  <Text style={styles.previewLabel}>
                    {newLabel || 'Category'}
                  </Text>
                </View>
              </View>

              {/* Color Picker */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Color
                </Text>
                <View style={styles.colorGrid}>
                  {AVAILABLE_COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        selectedColor === color && styles.colorSelected,
                      ]}
                      onPress={() => setSelectedColor(color)}
                    >
                      {selectedColor === color && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Icon Picker */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Icon
                </Text>
                <View style={styles.iconGrid}>
                  {AVAILABLE_ICONS.slice(0, 30).map((icon) => (
                    <TouchableOpacity
                      key={icon}
                      style={[
                        styles.iconOption,
                        { backgroundColor: colors.card },
                        selectedIcon === icon && {
                          backgroundColor: selectedColor,
                        },
                      ]}
                      onPress={() => setSelectedIcon(icon)}
                    >
                      <Ionicons
                        name={getIconName(icon)}
                        size={20}
                        color={selectedIcon === icon ? '#fff' : colors.text}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  card: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    marginBottom: 2,
  },
  categoryKey: {
    fontSize: FontSizes.xs,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  divider: {
    height: 1,
    marginLeft: Spacing.md + 44 + Spacing.md,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  resetButtonText: {
    fontSize: FontSizes.md,
  },
  infoCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalCancel: {
    fontSize: FontSizes.md,
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  modalSave: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  modalScroll: {
    paddingHorizontal: Spacing.lg,
  },
  inputGroup: {
    marginTop: Spacing.lg,
  },
  inputLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.md,
  },
  previewContainer: {
    marginTop: Spacing.lg,
    alignItems: 'flex-start',
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  previewIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: '#fff',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

