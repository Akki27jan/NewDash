"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

export type PresetTheme = 'default' | 'matrix' | 'cyberpink' | 'catppuccin' | 'tokyo-night' | 'osaka-jade' | 'nord' | 'matte-black' | 'custom';

export interface CustomColors {
  bg: string;
  primary: string;
  secondary: string;
  muted: string;
  border: string;
  accent: string;
  success: string;
  warning: string;
  borderBg: string;
  accentBg: string;
  successBg: string;
}

interface ThemeContextType {
  theme: PresetTheme;
  setTheme: (theme: PresetTheme) => void;
  customColors: CustomColors;
  setCustomColors: (colors: CustomColors) => void;
}

const defaultCustomColors: CustomColors = {
  bg: '#000000',
  primary: '#3b82f6',
  secondary: '#60a5fa',
  muted: '#1e40af',
  border: '#1e3a8a',
  accent: '#ef4444',
  success: '#22c55e',
  warning: '#eab308',
  borderBg: '#1e3a8a33',
  accentBg: '#450a0a',
  successBg: '#052e16',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<PresetTheme>('default');
  const [customColors, setCustomColorsState] = useState<CustomColors>(defaultCustomColors);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Load from local storage
    const savedTheme = localStorage.getItem('user_theme') as PresetTheme;
    if (savedTheme) setThemeState(savedTheme);

    const savedCustom = localStorage.getItem('user_custom_colors');
    if (savedCustom) {
      try {
        setCustomColorsState(JSON.parse(savedCustom));
      } catch (e) {
        // ignore
      }
    }
    
    setIsMounted(true);
  }, []);

  // Update DOM and local storage
  const setTheme = (newTheme: PresetTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('user_theme', newTheme);
  };

  const setCustomColors = (colors: CustomColors) => {
    setCustomColorsState(colors);
    localStorage.setItem('user_custom_colors', JSON.stringify(colors));
  };

  useEffect(() => {
    if (!isMounted) return;
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme, isMounted]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, customColors, setCustomColors }}>
      {/* Inject Custom Colors as CSS Variables if 'custom' is selected */}
      {isMounted && theme === 'custom' && (
        <style dangerouslySetInnerHTML={{
          __html: `
            :root[data-theme="custom"] {
              --theme-bg: ${customColors.bg};
              --theme-primary: ${customColors.primary};
              --theme-secondary: ${customColors.secondary};
              --theme-muted: ${customColors.muted};
              --theme-border: ${customColors.border};
              --theme-border-bg: ${customColors.borderBg};
              --theme-accent: ${customColors.accent};
              --theme-accent-bg: ${customColors.accentBg};
              --theme-success: ${customColors.success};
              --theme-success-bg: ${customColors.successBg};
              --theme-warning: ${customColors.warning};
            }
          `
        }} />
      )}
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
