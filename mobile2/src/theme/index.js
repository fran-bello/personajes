// Tema vibrante y moderno inspirado en diseño moderno de apps móviles
export const colors = {
  // Colores principales con gradientes
  primary: '#0ea5e9',
  primaryLight: '#38bdf8',
  primaryDark: '#0369a1',
  primaryGradient: ['#0ea5e9', '#38bdf8'],
  
  secondary: '#d946ef',
  secondaryLight: '#e879f9',
  secondaryDark: '#a21caf',
  secondaryGradient: ['#d946ef', '#e879f9'],
  
  // Colores adicionales vibrantes
  purple: '#9C27B0',
  purpleLight: '#C05BE0',
  purpleGradient: ['#9C27B0', '#C05BE0'],
  
  pink: '#FF69B4',
  pinkLight: '#FF9ECF',
  pinkGradient: ['#FF69B4', '#FF9ECF'],
  
  // Fondos con gradientes (Tomados de frontend/src/index.css)
  background: '#11111b',
  backgroundGradient: ['#11111b', '#11121b'],
  backgroundDark: '#0a0a0f',
  
  // Superficies translúcidas (frosted glass)
  surface: 'rgba(255, 255, 255, 0.1)',
  surfaceLight: 'rgba(255, 255, 255, 0.15)',
  surfaceMedium: 'rgba(255, 255, 255, 0.2)',
  surfaceDark: 'rgba(30, 37, 74, 0.8)',
  
  // Texto
  text: '#ffffff',
  textSecondary: '#E0E0E0',
  textMuted: '#B0B0B0',
  
  // Colores funcionales
  success: '#8BC34A',
  successLight: '#AED581',
  successGradient: ['#8BC34A', '#AED581'],
  
  warning: '#FFA500',
  warningLight: '#FFC947',
  warningGradient: ['#FFA500', '#FFC947'],
  
  danger: '#ef4444',
  dangerLight: '#f87171',
  dangerGradient: ['#ef4444', '#f87171'],
  
  // Bordes y separadores
  border: 'rgba(255, 255, 255, 0.2)',
  borderLight: 'rgba(255, 255, 255, 0.1)',
};

export const gradients = {
  primary: colors.primaryGradient,
  secondary: colors.secondaryGradient,
  purple: colors.purpleGradient,
  pink: colors.pinkGradient,
  success: colors.successGradient,
  warning: colors.warningGradient,
  danger: colors.dangerGradient,
  background: colors.backgroundGradient,
};

// Efectos de sombra modernos adaptados para React Native
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
};

export const theme = {
  colors,
  gradients,
  shadows,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
};

