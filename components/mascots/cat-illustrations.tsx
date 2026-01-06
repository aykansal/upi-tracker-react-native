import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

/**
 * Small calm cat illustration for headers
 * Subtle, decorative only
 */
export function CatHeader() {
  return (
    <Svg width={50} height={50} viewBox="0 0 100 100" style={styles.container}>
      {/* Cat head */}
      <Circle cx="50" cy="50" r="20" fill="#D4A574" opacity={0.3} />
      {/* Left ear */}
      <Path
        d="M 35 35 L 42 28 L 38 42 Z"
        fill="#D4A574"
        opacity={0.4}
      />
      {/* Right ear */}
      <Path
        d="M 65 35 L 58 28 L 62 42 Z"
        fill="#D4A574"
        opacity={0.4}
      />
      {/* Left eye */}
      <Ellipse cx="43" cy="48" rx="2.5" ry="4" fill="#6B6B6B" />
      {/* Right eye */}
      <Ellipse cx="57" cy="48" rx="2.5" ry="4" fill="#6B6B6B" />
      {/* Nose */}
      <Path
        d="M 50 54 L 47 58 L 53 58 Z"
        fill="#C88BA8"
        opacity={0.5}
      />
    </Svg>
  );
}

/**
 * Calm cat lying or sitting for empty states
 * Larger, more detailed, calm expression
 */
export function CatEmptyState() {
  return (
    <Svg width={120} height={120} viewBox="0 0 100 100" style={styles.container}>
      {/* Cat body - lying down */}
      <Ellipse cx="50" cy="70" rx="30" ry="20" fill="#D4A574" opacity={0.25} />
      
      {/* Cat head */}
      <Circle cx="50" cy="45" r="22" fill="#D4A574" opacity={0.4} />
      
      {/* Left ear */}
      <Path
        d="M 32 30 L 40 20 L 36 38 Z"
        fill="#D4A574"
        opacity={0.5}
      />
      {/* Right ear */}
      <Path
        d="M 68 30 L 60 20 L 64 38 Z"
        fill="#D4A574"
        opacity={0.5}
      />
      
      {/* Left eye - calm, closed or half-closed */}
      <Ellipse cx="43" cy="42" rx="3" ry="5" fill="#6B6B6B" />
      {/* Right eye */}
      <Ellipse cx="57" cy="42" rx="3" ry="5" fill="#6B6B6B" />
      
      {/* Nose */}
      <Path
        d="M 50 48 L 47 52 L 53 52 Z"
        fill="#C88BA8"
        opacity={0.6}
      />
      
      {/* Mouth - calm, subtle smile */}
      <Path
        d="M 50 52 Q 45 56 40 54"
        stroke="#9A9A9A"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
        opacity={0.4}
      />
      <Path
        d="M 50 52 Q 55 56 60 54"
        stroke="#9A9A9A"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
        opacity={0.4}
      />
      
      {/* Paws - subtle */}
      <Circle cx="35" cy="75" r="6" fill="#D4A574" opacity={0.3} />
      <Circle cx="65" cy="75" r="6" fill="#D4A574" opacity={0.3} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    opacity: 1,
  },
});

