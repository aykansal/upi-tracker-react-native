import React, { createContext, useContext } from 'react';

type ColorScheme = 'light';

interface ThemeContextType {
  themeMode: 'light';
  colorScheme: ColorScheme;
  setThemeMode: (mode: 'light') => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always use light mode - dark mode removed
  const colorScheme: ColorScheme = 'light';

  const setThemeMode = async (_mode: 'light') => {
    // No-op since we only support light mode
    return Promise.resolve();
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode: 'light',
        colorScheme,
        setThemeMode,
        isLoading: false, // No async loading needed
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// For backwards compatibility with existing code
export function useColorScheme(): ColorScheme {
  const context = useContext(ThemeContext);
  // Always return light mode
  if (context === undefined) {
    return 'light';
  }
  return context.colorScheme;
}

