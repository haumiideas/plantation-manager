export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  mode: ThemeMode;
  background: string;
  card: string;
  cardBorder: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  accent: string;
  border: string;
  notification: string;
  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;
  danger: string;
  success: string;
  warning: string;
  surfaceSubtle: string;
}

export const DarkThemeColors: ThemeColors = {
  mode: 'dark',
  background: '#0E1510',
  card: '#16221A',
  cardBorder: '#23382A',
  text: '#F1F5F2',
  textMuted: '#8EA193',
  primary: '#10B981',
  primaryLight: '#34D399',
  accent: '#F59E0B',
  border: '#23382A',
  notification: '#EF4444',
  tabBarBackground: '#121D15',
  tabBarActive: '#34D399',
  tabBarInactive: '#6B8272',
  danger: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',
  surfaceSubtle: '#1C2D22',
};

export const LightThemeColors: ThemeColors = {
  mode: 'light',
  background: '#F4F7F4',
  card: '#FFFFFF',
  cardBorder: '#D1DDD4',
  text: '#131F16',
  textMuted: '#5C7063',
  primary: '#059669',
  primaryLight: '#10B981',
  accent: '#D97706',
  border: '#E2E8F0',
  notification: '#DC2626',
  tabBarBackground: '#FFFFFF',
  tabBarActive: '#059669',
  tabBarInactive: '#8A9E90',
  danger: '#DC2626',
  success: '#059669',
  warning: '#D97706',
  surfaceSubtle: '#EBF2EC',
};
