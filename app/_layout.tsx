import {
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { ThemeProvider } from "@/contexts/theme-context";

// Light theme only - warm, playful, cute-but-clean aesthetic
const CustomLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.light.background,
    card: Colors.light.surface,
    text: Colors.light.text,
    border: Colors.light.border,
    primary: Colors.light.tint,
  },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "regular-font": require("@/assets/fonts/regular-font.ttf"),
    "cute-font": require("@/assets/fonts/cute-font.ttf"),
  });
  // Show loading state while checking onboarding or loading fonts
  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.light.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ThemedText>Loading...</ThemedText>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <NavigationThemeProvider value={CustomLightTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              animation: "none",
            }}
          />
          <Stack.Screen
            name="onboarding"
            options={{
              animation: "fade",
            }}
          />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="scanner-generate"
            options={{
              presentation: "fullScreenModal",
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="payment"
            options={{
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="manual-entry"
            options={{
              presentation: "modal",
              animation: "slide_from_left",
            }}
          />
          <Stack.Screen
            name="category-manager"
            options={{
              animation: "slide_from_right",
            }}
          />
        </Stack>
        <StatusBar style="dark" />
      </NavigationThemeProvider>
    </ThemeProvider>
  );
}
