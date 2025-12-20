import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { theme } from '../theme';

export default function Toast({ message, type = 'error', isVisible, onClose, duration = 5000 }) {
  const translateY = new Animated.Value(-100);

  useEffect(() => {
    if (isVisible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();

      if (duration > 0) {
        const timer = setTimeout(() => {
          hide();
        }, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible]);

  const hide = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  if (!isVisible || !message) return null;

  return (
    <Animated.View style={[
      styles.container,
      styles[type],
      { transform: [{ translateY }] }
    ]}>
      <View style={styles.content}>
        <Text style={styles.icon}>
          {type === 'error' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️'}
        </Text>
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity onPress={hide} style={styles.closeButton}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 9999,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  error: {
    backgroundColor: '#ef4444',
  },
  success: {
    backgroundColor: '#10b981',
  },
  info: {
    backgroundColor: '#3b82f6',
  },
  icon: {
    fontSize: 20,
    marginRight: 10,
  },
  message: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    fontFamily: 'Truculenta',
  },
  closeButton: {
    padding: 4,
    marginLeft: 10,
  },
  closeText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Truculenta-Bold',
  },
});

