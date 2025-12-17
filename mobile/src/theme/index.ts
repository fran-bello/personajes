import { MD3DarkTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
  fontFamily: 'System',
};

export const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#0ea5e9',
    primaryContainer: '#075985',
    secondary: '#d946ef',
    secondaryContainer: '#86198f',
    background: '#0f172a',
    surface: '#1e293b',
    surfaceVariant: '#334155',
    error: '#ef4444',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onBackground: '#ffffff',
    onSurface: '#ffffff',
    onSurfaceVariant: '#94a3b8',
    outline: '#475569',
  },
  fonts: configureFonts({ config: fontConfig }),
};

export const colors = {
  primary: '#0ea5e9',
  primaryLight: '#38bdf8',
  primaryDark: '#0369a1',
  secondary: '#d946ef',
  secondaryLight: '#e879f9',
  secondaryDark: '#a21caf',
  background: '#0f172a',
  surface: '#1e293b',
  surfaceLight: '#334155',
  text: '#ffffff',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  border: '#475569',
};

