import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeMode, ThemeColors, DarkThemeColors, LightThemeColors } from '../types/theme';

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const THEME_STORAGE_KEY = '@plantation_app_theme_mode';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Requirement: Dark theme by default
  const [theme, setTheme] = useState<ThemeMode>('dark');

  useEffect(() => {
    // Load persisted theme preference if previously chosen by user
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((savedTheme) => {
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setTheme(savedTheme);
        }
      })
      .catch((err) => console.log('Error reading theme from storage:', err));
  }, []);

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    AsyncStorage.setItem(THEME_STORAGE_KEY, nextTheme).catch(console.error);
  };

  const setThemeMode = (mode: ThemeMode) => {
    setTheme(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(console.error);
  };

  const colors = theme === 'dark' ? DarkThemeColors : LightThemeColors;
  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, isDark, colors, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
