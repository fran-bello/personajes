import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Modal } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function InputOverlay({ value, label, isVisible }) {
  const [shouldShow, setShouldShow] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const show = isVisible && value && value.length > 0;
    setShouldShow(show);

    if (show) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, value, fadeAnim]);

  if (!shouldShow) return null;

  const overlayWidth = Math.min(300, SCREEN_WIDTH * 0.95);

  return (
    <Modal
      visible={shouldShow}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={() => {}}
    >
      <View style={styles.modalContainer} pointerEvents="none">
        <Animated.View 
          style={[
            styles.overlay,
            {
              width: overlayWidth,
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.content}>
            {label && (
              <Text style={styles.label}>{label}</Text>
            )}
            <Text style={styles.text}>{value}</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 10,
    backgroundColor: 'transparent',
  },
  overlay: {
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#1a1a2e',
    borderWidth: 2,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    minWidth: 200,
    width: '100%',
  },
  label: {
    fontSize: 11,
    color: '#00d4ff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    fontWeight: '600',
    opacity: 0.8,
    fontFamily: 'Truculenta',
  },
  text: {
    fontSize: 18,
    color: '#ffffff',
    fontFamily: 'Truculenta',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
