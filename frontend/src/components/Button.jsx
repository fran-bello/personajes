import React from 'react';
import { colors, shadows } from '../theme';

export function Button({
  title,
  onClick,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  style = {},
  type = 'button',
}) {
  const getButtonColor = () => {
    switch (variant) {
      case 'primary':
        return colors.primaryGradient;
      case 'secondary':
        return colors.secondaryGradient;
      case 'success':
        return colors.successGradient;
      case 'danger':
        return colors.dangerGradient;
      case 'outline':
        return 'transparent';
      default:
        return colors.primaryGradient;
    }
  };

  const getTextColor = () => {
    return variant === 'outline' ? colors.primaryLight : colors.text;
  };

  const getPadding = () => {
    switch (size) {
      case 'small':
        return '8px 16px';
      case 'medium':
        return '12px 24px';
      case 'large':
        return '16px 32px';
      default:
        return '12px 24px';
    }
  };

  const getGlowShadow = () => {
    if (variant === 'outline') return 'none';
    switch (variant) {
      case 'primary':
        return '0 0 20px rgba(14, 165, 233, 0.6), 0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
      case 'secondary':
        return '0 0 20px rgba(217, 70, 239, 0.6), 0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
      case 'success':
        return '0 0 20px rgba(139, 195, 74, 0.6), 0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
      case 'danger':
        return '0 0 20px rgba(239, 68, 68, 0.6), 0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
      default:
        return '0 0 20px rgba(14, 165, 233, 0.6), 0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
    }
  };

  const getHoverGlowShadow = () => {
    if (variant === 'outline') return 'none';
    switch (variant) {
      case 'primary':
        return '0 0 30px rgba(14, 165, 233, 0.8), 0 12px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
      case 'secondary':
        return '0 0 30px rgba(217, 70, 239, 0.8), 0 12px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
      case 'success':
        return '0 0 30px rgba(139, 195, 74, 0.8), 0 12px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
      case 'danger':
        return '0 0 30px rgba(239, 68, 68, 0.8), 0 12px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
      default:
        return '0 0 30px rgba(14, 165, 233, 0.8), 0 12px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
    }
  };

  const buttonStyle = {
    background: variant === 'outline' ? 'transparent' : getButtonColor(),
    backgroundColor: variant === 'outline' ? 'transparent' : undefined,
    color: getTextColor(),
    border: variant === 'outline' ? `2px solid ${colors.primaryLight}` : 'none',
    borderRadius: '16px',
    padding: getPadding(),
    fontSize: size === 'small' ? '14px' : size === 'large' ? '18px' : '16px',
    fontWeight: '700',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    boxShadow: getGlowShadow(),
    textShadow: variant === 'outline' ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.3)',
    transform: 'translateY(0)',
    ...style,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={buttonStyle}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = getHoverGlowShadow();
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = getGlowShadow();
        }
      }}
      onMouseDown={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(1px)';
        }
      }}
      onMouseUp={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
    >
      {loading && <span>⏳</span>}
      {icon && <span>{icon}</span>}
      {title}
    </button>
  );
}
