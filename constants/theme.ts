/**
 * UPI Tracker Theme Configuration
 * Light, playful, cute-but-clean indie aesthetic
 * Warm cream background with calm teal accents
 */

import { Platform } from 'react-native';

// Primary accent color - Calm teal
const tintColor = '#229799'; // rgb(34, 151, 153)

export const Colors = {
  light: {
    text: '#2C2C2C', // Deep near-black with soft warmth (not pure black)
    textSecondary: '#6B6B6B', // Muted secondary text
    background: '#F8F6E3', // Warm cream - rgb(248, 246, 227)
    surface: '#F5F3E0', // Slightly darker cream for surfaces
    card: '#FCFAF5', // Slightly lighter cream for cards (elevated feel)
    tint: tintColor, // Calm teal CTA/accent
    icon: '#6B6B6B', // Muted icons
    tabIconDefault: '#9A9A9A', // Subtle inactive tab icons
    tabIconSelected: tintColor, // Teal for active tabs
    border: '#E8E6D8', // Barely visible, warm, subtle borders
    success: '#4A9B8E', // Muted teal-green for success
    error: '#D67B7B', // Soft muted red for errors
    warning: '#D4A574', // Warm muted orange for warnings
  },
};

// Category colors - muted saturation, cute and friendly
export const CategoryColors = {
  food: '#D4A574', // Warm muted orange
  utility: '#7BA3C7', // Soft muted blue
  college: '#A88BC4', // Muted purple
  rent: '#C88BA8', // Soft muted pink
  other: '#9A9A9A', // Neutral muted gray
};

// Chart colors matching category theme
export const ChartColors = [
  CategoryColors.food,
  CategoryColors.utility,
  CategoryColors.college,
  CategoryColors.rent,
  CategoryColors.other,
];

// Spacing scale
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius scale
export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Font sizes
export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 48,
};

export const Fonts = Platform.select({
  ios: {
    sans: 'regular-font', // Custom rounded friendly font
    serif: 'ui-serif',
    rounded: 'cute-font', // Cute font for playful elements
    mono: 'ui-monospace',
  },
  default: {
    sans: 'regular-font', // Custom rounded friendly font
    serif: 'serif',
    rounded: 'cute-font', // Cute font for playful elements
    mono: 'monospace',
  },
  web: {
    sans: "'regular-font', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'cute-font', 'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Shadow styles for cards - subtle tone-based elevation
export const Shadows = {
  light: {
    card: {
      shadowColor: '#2C2C2C',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03, // Very subtle shadow
      shadowRadius: 4,
      elevation: 1, // Minimal elevation for Android
    },
  },
};
