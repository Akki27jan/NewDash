import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, StyleSheet } from 'react-native';

export type PresetTheme = 'default' | 'matrix' | 'cyberpink' | 'catppuccin' | 'tokyo-night' | 'osaka-jade' | 'nord' | 'matte-black' | 'custom';

export interface CustomColors {
  bg: string;
  primary: string;
  secondary: string;
  muted: string;
  border: string;
  borderBg: string;
  accent: string;
  accentBg: string;
  success: string;
  successBg: string;
  warning: string;
}

const defaultCustomColors: CustomColors = {
  bg: '#000000',
  primary: '#3b82f6',
  secondary: '#60a5fa',
  muted: '#1e40af',
  border: '#1e3a8a',
  borderBg: 'rgba(30, 58, 138, 0.2)',
  accent: '#ef4444',
  accentBg: '#450a0a',
  success: '#22c55e',
  successBg: '#052e16',
  warning: '#eab308'
};

interface ThemeContextType {
  theme: PresetTheme;
  setTheme: (theme: PresetTheme) => void;
  customColors: CustomColors;
  setCustomColors: (colors: CustomColors) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<PresetTheme>('default');
  const [customColors, setCustomColorsState] = useState<CustomColors>(defaultCustomColors);

  useEffect(() => {
    (async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('app_theme');
        if (storedTheme) setThemeState(storedTheme as PresetTheme);
        
        const storedColors = await AsyncStorage.getItem('app_custom_colors');
        if (storedColors) setCustomColorsState(JSON.parse(storedColors));
      } catch (e) {
        console.error("Failed to load theme from storage", e);
      }
    })();
  }, []);

  const setTheme = async (newTheme: PresetTheme) => {
    setThemeState(newTheme);
    await AsyncStorage.setItem('app_theme', newTheme);
  };

  const setCustomColors = async (colors: CustomColors) => {
    setCustomColorsState(colors);
    await AsyncStorage.setItem('app_custom_colors', JSON.stringify(colors));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, customColors, setCustomColors }}>
      <ThemeInjector>{children}</ThemeInjector>
    </ThemeContext.Provider>
  );
}

// Injects the theme CSS variables at runtime
function ThemeInjector({ children }: { children: React.ReactNode }) {
  const { theme, customColors } = useTheme();

  // For preset themes, we rely on the global.css classes mapping (e.g. .theme-matrix).
  // For 'custom' theme, we must inject inline CSS variables if supported, 
  // but NativeWind v4 root vars injection via style is fully supported via standard React Native styles in web,
  // but on mobile, NativeWind root variables work best if defined via classes.
  // We will apply the theme class name to a root view wrapper.
  const themeClass = theme === 'default' ? '' : `theme-${theme}`;

  return (
    <View className={`flex-1 ${themeClass}`} style={theme === 'custom' ? (customColors as any) : {}}>
      {children}
    </View>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
