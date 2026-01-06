import { Ionicons } from "@expo/vector-icons";
import { File, Paths } from "expo-file-system";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CategoryPicker } from "@/components/transactions/category-picker";
import { UPIApp, UPIAppPicker } from "@/components/upi-app-picker";
import { BorderRadius, Colors, FontSizes, Spacing } from "@/constants/theme";
import { modifyUPIUrl } from "@/constants/upi-config";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ExpoUpiAppLauncherModule } from "@/modules/expo-upi-app-launcher";
import { saveTransaction } from "@/services/storage";
import { CategoryType, UPIPaymentData } from "@/types/transaction";

export default function PaymentScreen() {
  const params = useLocalSearchParams<{
    upiId: string;
    payeeName: string;
    amount: string;
    transactionNote: string;
    // Merchant support fields
    originalQRData: string;
    isMerchant: string;
    merchantCategory: string;
    organizationId: string;
    // QR image for sharing to UPI apps
    qrImageUri: string;
    // Method flags
    imageOnlyMode: string; // Method 1: only has image, no parsed data
    generatedQR: string; // Method 2: QR was generated from data
    amountLocked: string; // If true, amount was in original QR and can't be changed
  }>();

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const insets = useSafeAreaInsets();

  // Determine mode and transaction type
  const isMerchant = params.isMerchant === "true";
  const isImageOnlyMode = params.imageOnlyMode === "true";
  const isGeneratedQR = params.generatedQR === "true";
  const amountLocked = params.amountLocked === "true";

  const [amount, setAmount] = useState(params.amount || "");
  const [category, setCategory] = useState<CategoryType | null>(null);
  const [reason, setReason] = useState(params.transactionNote || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrDataToGenerate, setQrDataToGenerate] = useState<string | null>(null);
  const [showUPIPicker, setShowUPIPicker] = useState(false);
  const [pendingQrUri, setPendingQrUri] = useState<string | null>(null);
  const qrRef = useRef<any>(null);

  const paymentData: UPIPaymentData = {
    upiId: params.upiId || "",
    payeeName: params.payeeName || "Unknown",
    amount: parseFloat(amount) || undefined,
    isMerchant: isMerchant,
    originalQRData: params.originalQRData || undefined,
  };

  const qrImageUri = params.qrImageUri || "";
  const hasQrImage = !!qrImageUri;

  // For amount-locked mode (QR with amount), we have the QR already
  // For unlocked mode (no amount in QR), we need to generate QR with user's amount
  const canPay = isImageOnlyMode
    ? hasQrImage && amount && parseFloat(amount) > 0 && category
    : paymentData.upiId && amount && parseFloat(amount) > 0 && category;

  // Generate QR and show picker
  const generateAndShare = async (qrUri: string) => {
    try {
      const amountNum = parseFloat(amount);

      // Save transaction for tracking
      await saveTransaction(
        paymentData,
        category!,
        reason.trim() || undefined,
        amountNum,
        isMerchant ? "merchant" : "p2p",
        params.merchantCategory || undefined,
        params.organizationId || undefined
      );
      
      // Store QR URI and show picker
      setPendingQrUri(qrUri);
      setShowUPIPicker(true);
      setIsLoading(false);
      setIsGeneratingQR(false);
    } catch (error) {
      console.error("Payment error:", error);
      Alert.alert("Failed to prepare QR image. Please try again.");
      setIsLoading(false);
      setIsGeneratingQR(false);
    }
  };

  // Handle UPI app selection
  const handleAppSelect = (app: UPIApp) => {
    if (!pendingQrUri) return;

    try {
      ExpoUpiAppLauncherModule.shareTo(app.packageName, pendingQrUri);
      
      // Navigate back to home after sharing
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 500);
    } catch (error) {
      // console.error("Error sharing to app:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Full error details:", errorMessage);
      // if (errorMessage.includes("No Activity found to handle Intent")) {
      //   setToastMessage(`${app.name} is not available. Try another app.`);
      // }
      Alert.alert('uncool!!', `${app.name} is not available. you better change it.`);
    }
  };

  // Handle QR generation when we need to create QR with user's amount
  const handleQRGenerated = async () => {
    if (!qrRef.current) return;

    qrRef.current.toDataURL(async (dataURL: string) => {
      try {
        const base64Data = dataURL.replace(/^data:image\/png;base64,/, "");
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const fileName = `qr_${Date.now()}.png`;
        const file = new File(Paths.cache, fileName);
        await file.create({ overwrite: true });
        await file.write(bytes);

        // Now share the generated QR
        await generateAndShare(file.uri);
      } catch (error) {
        console.error("QR generation error:", error);
        Alert.alert("Failed to generate QR image. Please try again.");
        setIsLoading(false);
        setIsGeneratingQR(false);
      }
    });
  };

  const handlePay = async () => {
    if (!canPay) {
      Alert.alert("Missing Information", "Please fill in all required fields.");
      return;
    }

    setIsLoading(true);

    if (hasQrImage) {
      // QR already exists (amount was locked), just share it
      await generateAndShare(qrImageUri);
    } else {
      // Need to generate QR with user's amount
      const amountNum = parseFloat(amount);
      const originalUrl = params.originalQRData || "";

      // Modify the original URL to include user's amount and reason
      const modifiedUrl = modifyUPIUrl(
        originalUrl,
        amountNum,
        reason.trim() || undefined
      );

      setQrDataToGenerate(modifiedUrl);
      setIsGeneratingQR(true);

      // QR generation will be handled by useEffect when qrRef is ready
      setTimeout(() => {
        if (qrRef.current) {
          handleQRGenerated();
        }
      }, 200);
    }
  };

  const handleClose = () => {
    Alert.alert(
      "Discard Payment?",
      "Are you sure you want to cancel this payment?",
      [
        { text: "No", style: "cancel" },
        { text: "Yes", onPress: () => router.back(), style: "destructive" },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />

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
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isImageOnlyMode
            ? "Image Capture Mode"
            : isGeneratedQR
            ? "Generated QR Mode"
            : "New Payment"}
        </Text>
        <View style={styles.headerButton} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Payee Info Card */}
          <View style={[styles.payeeCard, { backgroundColor: colors.card }]}>
            <View style={styles.payeeIconContainer}>
              <Ionicons
                name={isMerchant ? "storefront" : "person-circle"}
                size={48}
                color={colors.tint}
              />
            </View>
            <View style={styles.payeeInfo}>
              <Text
                style={[styles.payeeName, { color: colors.text }]}
                numberOfLines={1}
              >
                {paymentData.payeeName}
              </Text>
              <Text
                style={[styles.upiId, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {paymentData.upiId}
              </Text>
              {isMerchant && (
                <View
                  style={[
                    styles.merchantBadge,
                    { backgroundColor: colors.tint + "20" },
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark"
                    size={12}
                    color={colors.tint}
                  />
                  <Text
                    style={[styles.merchantBadgeText, { color: colors.tint }]}
                  >
                    Verified Merchant
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Amount Locked Info */}
          {amountLocked && (
            <View
              style={[styles.infoCard, { backgroundColor: colors.tint + "15" }]}
            >
              <Ionicons name="lock-closed" size={18} color={colors.tint} />
              <Text style={[styles.infoText, { color: colors.tint }]}>
                Amount is fixed in the QR code and cannot be changed.
              </Text>
            </View>
          )}

          {/* Amount Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Amount *
            </Text>
            <View
              style={[
                styles.amountInputContainer,
                {
                  backgroundColor: amountLocked
                    ? colors.border + "30"
                    : colors.card,
                  borderColor: amountLocked ? colors.tint : colors.border,
                },
              ]}
            >
              <Text style={[styles.currencySymbol, { color: colors.tint }]}>
                ₹
              </Text>
              <TextInput
                style={[
                  styles.amountInput,
                  { color: amountLocked ? colors.textSecondary : colors.text },
                ]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                returnKeyType="done"
                editable={!amountLocked}
              />
              {amountLocked && (
                <Ionicons
                  name="lock-closed"
                  size={18}
                  color={colors.tint}
                  style={{ marginLeft: Spacing.sm }}
                />
              )}
            </View>
            {!amountLocked && (
              <Text
                style={[styles.helperNote, { color: colors.textSecondary }]}
              >
                Enter the amount to pay. QR will be generated with this amount.
              </Text>
            )}
          </View>

          {/* Category Picker */}
          <CategoryPicker
            selectedCategory={category}
            onSelectCategory={setCategory}
          />

          {/* Reason Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Reason (optional)
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
              value={reason}
              onChangeText={setReason}
              placeholder="e.g., Groceries, Lunch, etc."
              placeholderTextColor={colors.textSecondary}
              maxLength={50}
              returnKeyType="done"
            />
          </View>
        </ScrollView>

        {/* Pay Button */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.surface,
              paddingBottom: insets.bottom + Spacing.md,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.payButton,
              {
                backgroundColor:
                  canPay && !isLoading ? colors.tint : colors.border,
              },
            ]}
            onPress={handlePay}
            disabled={!canPay || isLoading || isGeneratingQR}
            activeOpacity={0.8}
          >
            {isLoading || isGeneratingQR ? (
              <Text style={styles.payButtonText}>
                {isGeneratingQR ? "Generating QR..." : "Opening..."}
              </Text>
            ) : (
              <>
                <Ionicons name="share-outline" size={20} color="#fff" />
                <Text style={styles.payButtonText}>Open in UPI App</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Hidden QR Generator for when we need to generate QR with user's amount */}
      {isGeneratingQR && qrDataToGenerate && (
        <View style={styles.hiddenQR}>
          <QRCode
            value={qrDataToGenerate}
            size={300}
            backgroundColor="white"
            color="black"
            getRef={(ref) => (qrRef.current = ref)}
          />
        </View>
      )}

      {/* UPI App Picker */}
      <UPIAppPicker
        visible={showUPIPicker}
        onSelectApp={handleAppSelect}
        onClose={() => {
          setShowUPIPicker(false);
          setPendingQrUri(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  payeeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  payeeIconContainer: {
    marginRight: Spacing.md,
  },
  payeeInfo: {
    flex: 1,
  },
  payeeName: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
    marginBottom: 2,
  },
  upiId: {
    fontSize: FontSizes.sm,
  },
  merchantBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
    gap: 4,
  },
  merchantBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: "500",
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  currencySymbol: {
    fontSize: FontSizes.xxl,
    fontWeight: "600",
    marginRight: Spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: FontSizes.xxl,
    fontWeight: "600",
    paddingVertical: Spacing.md,
  },
  helperNote: {
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontWeight: "500",
  },
  hiddenQR: {
    position: "absolute",
    top: -1000,
    left: -1000,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.md,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  payButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  payButtonText: {
    color: "#fff",
    fontSize: FontSizes.lg,
    fontWeight: "600",
  },
});
