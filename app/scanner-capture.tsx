import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BorderRadius, Colors, FontSizes, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.7;

/**
 * Method 1: Manual Capture Scanner
 * - User manually captures the QR image
 * - Image is sent to payment screen
 * - GPay reads the QR from the shared image
 * 
 * Note: QR decoding from static images in React Native requires native modules.
 * For this implementation, we capture the image and let GPay read the QR.
 */
export default function ScannerCaptureScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState('');
  const cameraRef = useRef<CameraView>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleCapture = async () => {
    if (isProcessing || !cameraRef.current) return;

    setIsProcessing(true);
    setProcessStatus('Capturing image...');

    try {
      // Capture the photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (!photo?.uri) {
        throw new Error('Failed to capture image');
      }

      const qrImageUri = photo.uri;
      setProcessStatus('Image captured! Decoding QR...');

      // Try to decode QR from image
      // Note: jsQR needs ImageData which is complex in RN
      // For this implementation, we'll use expo-camera's barcode scanner
      // as a fallback after capture, or prompt user to use Method 2
      
      // For testing purposes, let's prompt user that manual decode isn't fully working
      // and offer to proceed with just the image (GPay will read it)
      
      Alert.alert(
        'QR Image Captured',
        'The QR image has been captured. Note: Direct QR decoding from images requires native modules. Would you like to proceed with just the image? Google Pay will read the QR when you share it.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setIsProcessing(false);
              setProcessStatus('');
            },
          },
          {
            text: 'Proceed',
            onPress: () => {
              // Navigate with just the image - payment screen will show warning
              // but user can still share to GPay which will read the QR
              router.replace({
                pathname: '/payment',
                params: {
                  upiId: '',
                  payeeName: 'Unknown (from image)',
                  amount: '',
                  transactionNote: '',
                  originalQRData: '',
                  isMerchant: 'false',
                  merchantCategory: '',
                  organizationId: '',
                  qrImageUri: qrImageUri,
                  // Flag to indicate this is image-only mode
                  imageOnlyMode: 'true',
                },
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error capturing:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
      setIsProcessing(false);
      setProcessStatus('');
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
            Please allow camera access to capture QR codes
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

  // Show processing screen
  if (isProcessing) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#14B8A6" />
            <Text style={styles.loadingText}>{processStatus}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
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
            <Text style={styles.methodBadgeText}>Method 1: Manual Capture</Text>
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

        {/* Bottom section with capture button */}
        <View style={styles.bottomSection}>
          <Text style={styles.instructionText}>
            Position QR code in frame and tap capture
          </Text>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCapture}
            activeOpacity={0.7}
          >
            <View style={styles.captureButtonInner}>
              <Ionicons name="camera" size={32} color="#fff" />
            </View>
          </TouchableOpacity>
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
    borderColor: '#F59E0B', // Orange for Method 1
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
    backgroundColor: '#F59E0B',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  methodBadgeText: {
    color: '#fff',
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  bottomSection: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Spacing.xl,
  },
  instructionText: {
    color: '#fff',
    fontSize: FontSizes.md,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
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
});

