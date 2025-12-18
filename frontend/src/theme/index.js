// Tema vibrante y moderno inspirado en diseño moderno de apps móviles
export const colors = {
  // Colores principales con gradientes
  primary: '#0ea5e9',
  primaryLight: '#38bdf8',
  primaryDark: '#0369a1',
  primaryGradient: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
  
  secondary: '#d946ef',
  secondaryLight: '#e879f9',
  secondaryDark: '#a21caf',
  secondaryGradient: 'linear-gradient(135deg, #d946ef 0%, #e879f9 100%)',
  
  // Colores adicionales vibrantes
  purple: '#9C27B0',
  purpleLight: '#C05BE0',
  purpleGradient: 'linear-gradient(135deg, #9C27B0 0%, #C05BE0 100%)',
  
  pink: '#FF69B4',
  pinkLight: '#FF9ECF',
  pinkGradient: 'linear-gradient(135deg, #FF69B4 0%, #FF9ECF 100%)',
  
  // Fondos con gradientes
  background: '#1E254A',
  backgroundGradient: 'linear-gradient(180deg, #1E254A 0%, #28325C 50%, #2F90B1 100%)',
  backgroundDark: '#0f172a',
  
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
  successGradient: 'linear-gradient(135deg, #8BC34A 0%, #AED581 100%)',
  
  warning: '#FFA500',
  warningLight: '#FFC947',
  warningGradient: 'linear-gradient(135deg, #FFA500 0%, #FFC947 100%)',
  
  danger: '#ef4444',
  dangerLight: '#f87171',
  dangerGradient: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
  
  // Bordes y separadores
  border: 'rgba(255, 255, 255, 0.2)',
  borderLight: 'rgba(255, 255, 255, 0.1)',
};

// Utilidades para gradientes
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

// Efectos de sombra modernos
export const shadows = {
  sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
  md: '0 4px 8px rgba(0, 0, 0, 0.15)',
  lg: '0 8px 16px rgba(0, 0, 0, 0.2)',
  glow: '0 0 20px rgba(14, 165, 233, 0.4)',
  glowPurple: '0 0 20px rgba(217, 70, 239, 0.4)',
  glowSuccess: '0 0 20px rgba(139, 195, 74, 0.4)',
};

export const theme = {
  colors,
  gradients,
  shadows,
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
  },
};
