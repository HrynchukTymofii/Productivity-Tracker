import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { Theme, ColorPalette, ThemeMode } from '../types';
import { lightTheme, darkTheme, colorPalettes, getPaletteById, getDefaultPalette } from '../constants/colors';
import { getSettings, updateThemeMode, updateColorPalette } from '../database/queries';

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  currentPalette: ColorPalette;
  setPalette: (paletteId: string) => Promise<void>;
  getTaskColor: (index: number) => string;
  allPalettes: ColorPalette[];
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [currentPalette, setCurrentPalette] = useState<ColorPalette>(getDefaultPalette());
  const [isLoading, setIsLoading] = useState(true);

  // Compute isDarkMode based on themeMode and system preference
  const isDarkMode = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await getSettings();
      setThemeModeState(settings.theme_mode);
      const palette = getPaletteById(settings.color_palette);
      if (palette) {
        setCurrentPalette(palette);
      }
    } catch (error) {
      console.error('Error loading theme settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await updateThemeMode(mode);
  }, []);

  const setPalette = useCallback(async (paletteId: string) => {
    const palette = getPaletteById(paletteId);
    if (palette) {
      setCurrentPalette(palette);
      await updateColorPalette(paletteId);
    }
  }, []);

  const getTaskColor = useCallback(
    (index: number) => {
      return currentPalette.colors[index % currentPalette.colors.length];
    },
    [currentPalette]
  );

  // Create theme with dynamic primary color from current palette
  const theme = useMemo<Theme>(() => {
    const baseTheme = isDarkMode ? darkTheme : lightTheme;
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: currentPalette.colors[0], // Use first color from palette as primary
      },
    };
  }, [isDarkMode, currentPalette]);

  const value: ThemeContextType = {
    theme,
    isDarkMode,
    themeMode,
    setThemeMode,
    currentPalette,
    setPalette,
    getTaskColor,
    allPalettes: colorPalettes,
    isLoading,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
