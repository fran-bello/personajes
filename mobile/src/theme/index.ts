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
    background: '#1E254A',
    surface: 'rgba(255, 255, 255, 0.1)',
    surfaceVariant: 'rgba(255, 255, 255, 0.15)',
    error: '#ef4444',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onBackground: '#ffffff',
    onSurface: '#ffffff',
    onSurfaceVariant: '#E0E0E0',
    outline: 'rgba(255, 255, 255, 0.2)',
  },
  fonts: configureFonts({ config: fontConfig }),
};

export const colors = {
  // Colores principales con variantes
  primary: '#0ea5e9',
  primaryLight: '#38bdf8',
  primaryDark: '#0369a1',
  
  secondary: '#d946ef',
  secondaryLight: '#e879f9',
  secondaryDark: '#a21caf',
  
  // Colores adicionales vibrantes
  purple: '#9C27B0',
  purpleLight: '#C05BE0',
  
  pink: '#FF69B4',
  pinkLight: '#FF9ECF',
  
  // Fondos
  background: '#1E254A',
  backgroundDark: '#0f172a',
  
  // Superficies translúcidas (frosted glass)
  surface: 'rgba(255, 255, 255, 0.1)',
  surfaceLight: 'rgba(255, 255, 255, 0.15)',
  surfaceMedium: 'rgba(255, 255, 255, 0.2)',
  surfaceDark: 'rgba(30, 37, 74, 0.8)',
  surfaceSolid: '#1e293b', // Para compatibilidad con componentes que necesitan color sólido
  
  // Texto
  text: '#ffffff',
  textSecondary: '#E0E0E0',
  textMuted: '#B0B0B0',
  
  // Colores funcionales
  success: '#8BC34A',
  successLight: '#AED581',
  
  warning: '#FFA500',
  warningLight: '#FFC947',
  
  danger: '#ef4444',
  dangerLight: '#f87171',
  
  // Bordes y separadores
  border: 'rgba(255, 255, 255, 0.2)',
  borderLight: 'rgba(255, 255, 255, 0.1)',
  borderSolid: '#475569', // Para compatibilidad
};

