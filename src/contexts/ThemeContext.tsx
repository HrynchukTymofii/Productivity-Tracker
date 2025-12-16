import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Theme, ColorPalette } from '../types';
import { lightTheme, darkTheme, colorPalettes, getPaletteById, getDefaultPalette } from '../constants/colors';
import { getSettings, updateDarkMode, updateColorPalette } from '../database/queries';

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleDarkMode: () => Promise<void>;
  setDarkMode: (dark: boolean) => Promise<void>;
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentPalette, setCurrentPalette] = useState<ColorPalette>(getDefaultPalette());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await getSettings();
      setIsDarkMode(settings.dark_mode);
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

  const toggleDarkMode = useCallback(async () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    await updateDarkMode(newValue);
  }, [isDarkMode]);

  const setDarkModeValue = useCallback(async (dark: boolean) => {
    setIsDarkMode(dark);
    await updateDarkMode(dark);
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

  const theme = isDarkMode ? darkTheme : lightTheme;

  const value: ThemeContextType = {
    theme,
    isDarkMode,
    toggleDarkMode,
    setDarkMode: setDarkModeValue,
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
