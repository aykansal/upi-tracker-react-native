import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BorderRadius, Colors, FontSizes, Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/theme-context";
import { getCategories } from "@/services/category-storage";
import { exportToPDF } from "@/services/pdf-export";
import { clearAllData, getAllTransactions } from "@/services/storage";

export default function SettingsScreen() {
  const colors = Colors.light;
  const insets = useSafeAreaInsets();

  const [transactionCount, setTransactionCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const [transactions, categories] = await Promise.all([
        getAllTransactions(),
        getCategories(),
      ]);
      setTransactionCount(transactions.length);
      setCategoryCount(categories.length);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const handleClearData = () => {
    if (transactionCount === 0) {
      Alert.alert("No Data", "There is no data to clear.");
      return;
    }

    Alert.alert(
      "Clear All Data",
      `This will permanently delete all ${transactionCount} transaction${
        transactionCount !== 1 ? "s" : ""
      }. This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            const success = await clearAllData();
            if (success) {
              setTransactionCount(0);
              Alert.alert("Success", "All data has been cleared.");
            } else {
              Alert.alert("Error", "Failed to clear data. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleExportAll = async () => {
    if (transactionCount === 0) {
      Alert.alert("No Data", "There are no transactions to export.");
      return;
    }

    setIsExporting(true);
    try {
      await exportToPDF();
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert("Error", "Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const appVersion = Constants.expoConfig?.version || "1.0.0";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            CATEGORIES
          </Text>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {/* Manage Categories */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/category-manager")}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: `${colors.tint}20` },
                  ]}
                >
                  <Ionicons
                    name="pricetags-outline"
                    size={20}
                    color={colors.tint}
                  />
                </View>
                <View style={styles.menuItemText}>
                  <Text style={[styles.menuItemLabel, { color: colors.text }]}>
                    Manage Categories
                  </Text>
                  <Text
                    style={[
                      styles.menuItemDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {categoryCount} categor{categoryCount !== 1 ? "ies" : "y"}{" "}
                    configured
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            DATA
          </Text>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {/* Export PDF */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleExportAll}
              disabled={isExporting}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: `${colors.tint}20` },
                  ]}
                >
                  <Ionicons
                    name="download-outline"
                    size={20}
                    color={colors.tint}
                  />
                </View>
                <View style={styles.menuItemText}>
                  <Text style={[styles.menuItemLabel, { color: colors.text }]}>
                    {isExporting ? "Exporting..." : "Export Transactions"}
                  </Text>
                  <Text
                    style={[
                      styles.menuItemDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Get PDF report of all transactions
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />

            {/* Clear Data */}
            <TouchableOpacity style={styles.menuItem} onPress={handleClearData}>
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: `${colors.error}20` },
                  ]}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={colors.error}
                  />
                </View>
                <View style={styles.menuItemText}>
                  <Text style={[styles.menuItemLabel, { color: colors.error }]}>
                    Clear All Data
                  </Text>
                  <Text
                    style={[
                      styles.menuItemDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {transactionCount} transaction
                    {transactionCount !== 1 ? "s" : ""} stored
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            ABOUT
          </Text>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.aboutItem}>
              <Text style={[styles.aboutLabel, { color: colors.text }]}>
                App Version
              </Text>
              <Text
                style={[styles.aboutValue, { color: colors.textSecondary }]}
              >
                {appVersion}
              </Text>
            </View>

            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />

            <View style={styles.aboutItem}>
              <Text style={[styles.aboutLabel, { color: colors.text }]}>
                Privacy
              </Text>
              <Text
                style={[styles.aboutValue, { color: colors.textSecondary }]}
              >
                All data stored locally
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: "700",
    marginBottom: Spacing.xl,
    fontFamily: Fonts?.sans || 'regular-font',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.xs,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
    fontFamily: Fonts?.sans || 'regular-font',
  },
  card: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  themeSelector: {
    flexDirection: "row",
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  themeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  themeOptionText: {
    fontSize: FontSizes.sm,
    fontWeight: "500",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemLabel: {
    fontSize: FontSizes.md,
    fontWeight: "500",
    marginBottom: 2,
    fontFamily: Fonts?.sans || 'regular-font',
  },
  menuItemDescription: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts?.sans || 'regular-font',
  },
  divider: {
    height: 1,
  },
  aboutItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
  },
  aboutLabel: {
    fontSize: FontSizes.md,
    fontFamily: Fonts?.sans || 'regular-font',
  },
  aboutValue: {
    fontSize: FontSizes.md,
    fontFamily: Fonts?.sans || 'regular-font',
  },
  infoCard: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  infoIcon: {
    marginRight: Spacing.md,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: FontSizes.sm,
    lineHeight: 20,
    fontFamily: Fonts?.sans || 'regular-font',
  },
});
