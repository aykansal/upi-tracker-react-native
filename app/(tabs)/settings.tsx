import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  BorderRadius,
  Colors,
  FontSizes,
  Spacing,
  TextStyles,
} from "@/constants/theme";
import { CatHeader } from "@/components/mascots/cat-illustrations";
import { getCategories } from "@/services/category-storage";
import { exportToPDF } from "@/services/pdf-export";
import { clearAllData, getAllTransactions } from "@/services/storage";
import { getUserProfile } from "@/services/user-storage";
import { getGitCommitHash } from "@/utils/git-version";

export default function SettingsScreen() {
  const colors = Colors.light;

  const [username, setUsername] = useState<string>("");
  const [avatarId, setAvatarId] = useState<string>("");
  const [transactionCount, setTransactionCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      // Load user profile
      const profile = await getUserProfile();
      if (profile) {
        setUsername(profile.name);
        setAvatarId(profile.avatarId);
      }

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
      loadData();
    }, [loadData])
  );

  const handleEditProfile = () => {
    router.push("/settings/edit-profile" as any);
  };

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

  const handleOpenGitHub = () => {
    Linking.openURL("https://github.com/aykansal");
  };

  const appVersion = Constants.expoConfig?.version || "2.0.0";
  const commitHash = getGitCommitHash();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={styles.profileContent}
            onPress={handleEditProfile}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.avatarContainer,
                { backgroundColor: colors.surface },
              ]}
            >
              <Text style={styles.avatarText}>{avatarId || "🐱"}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {username || "User"}
              </Text>
              <Text
                style={[styles.profileSubtext, { color: colors.textSecondary }]}
              >
                Tap to edit your profile
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            CATEGORIES
          </Text>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
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
                Commit Hash
              </Text>
              <Text
                style={[styles.aboutValue, { color: colors.textSecondary }]}
              >
                {commitHash}
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

        {/* Built by Love Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.builtByContainer}
            onPress={handleOpenGitHub}
            activeOpacity={0.7}
          >
            <Text style={[styles.builtByText, { color: colors.textSecondary }]}>
              Built with{" "}
              <Ionicons name="heart" size={14} color={colors.error} />
              by{" "}
              <Text style={[styles.githubLink, { color: colors.tint }]}>
                aykansal
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    ...TextStyles.default,
    fontSize: FontSizes.xxl,
  },
  catContainer: {
    opacity: 0.4,
  },
  profileCard: {
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
    overflow: "hidden",
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: FontSizes.xxl,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...TextStyles.default,
    fontSize: FontSizes.lg,
    marginBottom: Spacing.xs,
  },
  profileSubtext: {
    ...TextStyles.default,
    fontSize: FontSizes.sm,
  },
  section: {
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.xs,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
    ...TextStyles.default,
  },
  card: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
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
    ...TextStyles.default,
    fontSize: FontSizes.md,
    marginBottom: 2,
  },
  menuItemDescription: {
    ...TextStyles.default,
    fontSize: FontSizes.sm,
  },
  divider: {
    height: 1,
    marginHorizontal: Spacing.md,
  },
  aboutItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
  },
  aboutLabel: {
    ...TextStyles.default,
    fontSize: FontSizes.md,
  },
  aboutValue: {
    ...TextStyles.default,
    fontSize: FontSizes.md,
  },
  footer: {
    alignItems: "center",
    marginTop: 12,
    // marginBottom: Spacing.sm,
  },
  builtByContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  builtByText: {
    ...TextStyles.default,
    fontSize: FontSizes.sm,
  },
  githubLink: {
    ...TextStyles.default,
  },
  commitHash: {
    ...TextStyles.default,
    fontSize: FontSizes.xs,
    fontFamily: "monospace",
  },
});
