import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';
import { colors } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: any;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  style,
}: ButtonProps) {
  const getButtonColor = () => {
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'success':
        return colors.success;
      case 'danger':
        return colors.danger;
      case 'outline':
        return 'transparent';
      default:
        return colors.primary;
    }
  };

  const getGlowColor = () => {
    switch (variant) {
      case 'primary':
        return 'rgba(14, 165, 233, 0.6)';
      case 'secondary':
        return 'rgba(217, 70, 239, 0.6)';
      case 'success':
        return 'rgba(139, 195, 74, 0.6)';
      case 'danger':
        return 'rgba(239, 68, 68, 0.6)';
      default:
        return 'rgba(14, 165, 233, 0.6)';
    }
  };

  const getTextColor = () => {
    return variant === 'outline' ? colors.primary : colors.text;
  };

  const getMode = (): 'contained' | 'outlined' | 'text' => {
    return variant === 'outline' ? 'outlined' : 'contained';
  };

  const getPadding = () => {
    switch (size) {
      case 'small':
        return 4;
      case 'medium':
        return 8;
      case 'large':
        return 12;
      default:
        return 8;
    }
  };

  const getShadowColor = () => {
    switch (variant) {
      case 'primary':
        return '#0ea5e9';
      case 'secondary':
        return '#d946ef';
      case 'success':
        return '#8BC34A';
      case 'danger':
        return '#ef4444';
      default:
        return '#0ea5e9';
    }
  };

  const getShadowStyle = () => {
    if (variant === 'outline') {
      return {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
      };
    }
    return {
      shadowColor: getShadowColor(),
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 24,
      elevation: 16,
    };
  };

  return (
    <View style={[styles.shadowContainer, getShadowStyle(), style]}>
      <PaperButton
        mode={getMode()}
        onPress={onPress}
        loading={loading}
        disabled={disabled || loading}
        icon={icon}
        buttonColor={getButtonColor()}
        textColor={getTextColor()}
        contentStyle={[styles.content, { paddingVertical: getPadding() }]}
        style={styles.button}
        labelStyle={styles.label}
      >
        {title}
      </PaperButton>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowContainer: {
    borderRadius: 16,
  },
  button: {
    borderRadius: 16,
  },
  content: {
    paddingHorizontal: 16,
  },
  label: {
    fontWeight: '700',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
