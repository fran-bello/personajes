import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  style = {},
}) {
  const isOutline = variant === 'outline';
  const isDanger = variant === 'danger';

  let colors = ['#ff66ff', '#cc00cc', '#990099'];
  let borderColor = '#660066';
  let shadowColor = 'rgba(102, 0, 102, 0.9)';

  if (isDanger) {
    colors = ['#ff6666', '#cc0000', '#990000'];
    borderColor = '#660000';
    shadowColor = 'rgba(102, 0, 0, 0.9)';
  }

  const paddingHorizontal = size === 'small' ? 18 : size === 'large' ? 40 : 32;
  const paddingVertical = size === 'small' ? 10 : size === 'large' ? 18 : 14;
  const fontSize = size === 'small' ? 14 : size === 'large' ? 22 : 20;
  const letterSpacing = size === 'small' ? 1.1 : 1.6;
  const minHeight = size === 'small' ? 36 : size === 'large' ? 56 : 46;

  const content = (
    <View style={[
      styles.content, 
      { paddingHorizontal, paddingVertical, minHeight },
      isOutline && styles.outlineContent,
      isOutline && { borderColor: '#ff00ff' }
    ]}>
      {loading ? (
        <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
      ) : icon ? (
        <View style={{ marginRight: 8 }}>{icon}</View>
      ) : null}
      <Text style={[
        styles.text, 
        { fontSize, letterSpacing },
        isOutline && { color: '#ff00ff' }
      ]}>
        {title}
      </Text>
    </View>
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.container,
        { shadowColor, minHeight },
        isOutline && styles.outlineContainer,
        isOutline && { borderColor: '#ff00ff' },
        !isOutline && { borderColor },
        disabled && styles.disabled,
        style
      ]}
    >
      {isOutline ? (
        content
      ) : (
        <LinearGradient
          colors={colors}
          style={[styles.gradient, { minHeight }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          {content}
        </LinearGradient>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 25,
    marginVertical: 8,
    borderWidth: 6,
    backgroundColor: 'transparent',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.9,
    shadowRadius: 18,
    elevation: 12,
  },
  gradient: {
    flex: 1,
    width: '100%',
    borderRadius: 19, // Ajustado para el borde de 6px (25 - 6)
  },
  outlineContainer: {
    backgroundColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    fontFamily: 'Truculenta-Bold',
    textShadowColor: '#420042',
    textShadowOffset: { width: 1.5, height: 2 },
    textShadowRadius: 6,
  },
  disabled: {
    opacity: 0.6,
  },
});

