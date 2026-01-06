import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BorderRadius, Colors, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { UPI_APPS } from '@/constants/upi-config';

export interface UPIApp {
  packageName: string;
  name: string;
  icon: any;
}

interface UPIAppPickerProps {
  visible: boolean;
  onSelectApp: (app: UPIApp) => void;
  onClose: () => void;
}

export function UPIAppPicker({
  visible,
  onSelectApp,
  onClose,
}: UPIAppPickerProps) {
  const colors = Colors.light;
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Snap points for bottom sheet - adapts to content
  const snapPoints = useMemo(() => {
    // Use a reasonable height that fits the content
    // For 1-5 apps, 30-40% should be sufficient
    return ['40%'];
  }, []);

  // Control sheet visibility
  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleSelect = useCallback((app: UPIApp) => {
    onSelectApp(app);
    onClose();
  }, [onSelectApp, onClose]);

  // Custom backdrop component
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: colors.card,
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
      }}
      handleIndicatorStyle={{
        backgroundColor: colors.border,
        width: 40,
        height: 4,
      }}
    >
      <BottomSheetView
        style={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + Spacing.md },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Choose UPI App
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* App List */}
        <View style={styles.appsContainer}>
          {UPI_APPS.map((app) => (
            <TouchableOpacity
              key={app.packageName}
              style={[
                styles.appItem,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              activeOpacity={0.7}
              onPress={() => handleSelect(app)}
            >
              <View style={styles.iconWrapper}>
                <Image
                  source={app.icon as ImageSourcePropType}
                  style={styles.appIcon}
                  resizeMode="contain"
                />
              </View>

              <Text style={[styles.appName, { color: colors.text }]}>
                {app.name}
              </Text>

              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.lg,
    marginTop: Spacing.sm,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    fontFamily: Fonts?.sans || 'regular-font',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
  },
  appsContainer: {
    gap: Spacing.sm,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  appIcon: {
    width: 36,
    height: 36,
  },
  appName: {
    flex: 1,
    fontSize: FontSizes.md,
    fontWeight: '500',
    fontFamily: Fonts?.sans || 'regular-font',
  },
});
