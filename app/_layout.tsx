import {
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
// If using Expo Router, import your CSS file in the app/_layout.tsx file

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { ThemeProvider } from "@/contexts/theme-context";

export const unstable_settings = {
  anchor: "(tabs)",
};

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

function RootLayoutNav() {
  const [fontsLoaded] = useFonts({
    "regular-font": require("@/assets/fonts/regular-font.ttf"),
    "cute-font": require("@/assets/fonts/cute-font.ttf"),
  });

  return (
    <>
      {fontsLoaded ? (
        <NavigationThemeProvider value={CustomLightTheme}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen
              name="onboarding/index"
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
                animation: "slide_from_bottom",
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
      ) : (
        <>
          <ThemedText>Loading fonts...</ThemedText>
        </>
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}
