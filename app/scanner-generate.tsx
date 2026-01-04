import { Ionicons } from '@expo/vector-icons';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { File, Paths } from 'expo-file-system';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BorderRadius, Colors, FontSizes, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { parseUPIQRCode } from '@/services/upi-parser';
import { UPIPaymentData } from '@/types/transaction';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.7;

/**
 * Method 2: Auto-scan + Generate QR
 * - Automatically scans QR using barcode scanner
 * - Parses the UPI data from scanned QR
 * - Generates a new QR image from the parsed data
 * - Both generated image and data are sent to payment screen
 */
export default function ScannerGenerateScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState('');
  const [pendingPaymentData, setPendingPaymentData] = useState<UPIPaymentData | null>(null);
  const [qrDataToGenerate, setQrDataToGenerate] = useState<string | null>(null);
  const qrRef = useRef<any>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  // Generate and save QR when data is ready
  useEffect(() => {
    if (qrDataToGenerate && pendingPaymentData && qrRef.current) {
      generateAndNavigate();
    }
  }, [qrDataToGenerate, pendingPaymentData]);

  const generateAndNavigate = async () => {
    if (!qrRef.current || !pendingPaymentData) return;

    setProcessStatus('Generating QR image...');

    try {
      // Get the QR code as base64 data URL
      qrRef.current.toDataURL(async (dataURL: string) => {
        try {
          // Remove the data:image/png;base64, prefix
          const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
          
          // Convert base64 string to Uint8Array
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          // Create file using new API
          const fileName = `qr_${Date.now()}.png`;
          const file = new File(Paths.cache, fileName);
          
          // Create and write the file
          file.create({ overwrite: true });
          file.write(bytes);

          setProcessStatus('Redirecting...');

          // Navigate to payment screen with parsed data and generated image
          router.replace({
            pathname: '/payment',
            params: {
              upiId: pendingPaymentData.upiId,
              payeeName: pendingPaymentData.payeeName,
              amount: pendingPaymentData.amount?.toString() || '',
              transactionNote: pendingPaymentData.transactionNote || '',
              originalQRData: pendingPaymentData.originalQRData || '',
              isMerchant: pendingPaymentData.isMerchant ? 'true' : 'false',
              merchantCategory: pendingPaymentData.merchantParams?.mc || '',
              organizationId: pendingPaymentData.merchantParams?.orgid || '',
              qrImageUri: file.uri,
              generatedQR: 'true', // Flag to indicate QR was generated
            },
          });
        } catch (error) {
          console.error('Error saving QR image:', error);
          Alert.alert('Error', 'Failed to generate QR image. Please try again.');
          resetState();
        }
      });
    } catch (error) {
      console.error('Error generating QR:', error);
      Alert.alert('Error', 'Failed to generate QR image. Please try again.');
      resetState();
    }
  };

  const resetState = () => {
    setScanned(false);
    setIsProcessing(false);
    setProcessStatus('');
    setPendingPaymentData(null);
    setQrDataToGenerate(null);
  };

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    if (scanned || isProcessing) return;

    setScanned(true);
    setIsProcessing(true);
    setProcessStatus('QR detected! Parsing data...');

    const qrData = result.data;

    // Parse the UPI QR code
    const paymentData = parseUPIQRCode(qrData);

    if (paymentData) {
      setProcessStatus('Data parsed! Generating new QR...');
      setPendingPaymentData(paymentData);
      // Use the original QR data to generate the QR image
      setQrDataToGenerate(paymentData.originalQRData || qrData);
    } else {
      setIsProcessing(false);
      Alert.alert(
        'Invalid QR Code',
        'This QR code is not a valid UPI payment code. Please try scanning another code.',
        [
          {
            text: 'Try Again',
            onPress: resetState,
          },
          {
            text: 'Go Back',
            onPress: () => router.back(),
            style: 'cancel',
          },
        ]
      );
    }
  };

  const handleClose = () => {
    router.back();
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.message, { color: colors.text }]}>
          Requesting camera permission...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.title, { color: colors.text }]}>
            Camera Access Required
          </Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Please allow camera access to scan UPI QR codes
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: colors.tint }]}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={handleClose}
          >
            <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show processing screen with hidden QR generator
  if (isProcessing) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#14B8A6" />
            <Text style={styles.loadingText}>{processStatus}</Text>
            {pendingPaymentData && (
              <Text style={styles.loadingSubtext}>
                {pendingPaymentData.payeeName}
              </Text>
            )}
          </View>
        </View>
        
        {/* Hidden QR Code generator */}
        {qrDataToGenerate && (
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
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Top section */}
        <View style={[styles.overlaySection, { paddingTop: insets.top }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.methodBadge}>
            <Text style={styles.methodBadgeText}>Method 2: Auto-scan + Generate</Text>
          </View>
        </View>

        {/* Middle section with scan area */}
        <View style={styles.middleSection}>
          <View style={styles.overlaySection} />
          <View style={styles.scanArea}>
            {/* Corner markers */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <View style={styles.overlaySection} />
        </View>

        {/* Bottom section */}
        <View style={styles.overlaySection}>
          <Text style={styles.instructionText}>
            Point camera at UPI QR code
          </Text>
          <Text style={styles.subInstructionText}>
            Auto-detects and generates clean QR
          </Text>
          {scanned && !isProcessing && (
            <TouchableOpacity
              style={styles.rescanButton}
              onPress={resetState}
            >
              <Text style={styles.rescanButtonText}>Tap to Scan Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  permissionButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: FontSizes.md,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  overlaySection: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleSection: {
    flexDirection: 'row',
    height: SCAN_AREA_SIZE,
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#14B8A6', // Teal for Method 2
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#14B8A6',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  methodBadgeText: {
    color: '#fff',
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  instructionText: {
    color: '#fff',
    fontSize: FontSizes.md,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  subInstructionText: {
    color: '#9CA3AF',
    fontSize: FontSizes.sm,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  rescanButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    backgroundColor: '#14B8A6',
    borderRadius: BorderRadius.md,
  },
  rescanButtonText: {
    color: '#fff',
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: '#1F2937',
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    minWidth: 200,
  },
  loadingText: {
    color: '#fff',
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  loadingSubtext: {
    color: '#9CA3AF',
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  hiddenQR: {
    position: 'absolute',
    top: -1000,
    left: -1000,
  },
});

