import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal as RNModal } from 'react-native';
import { Button } from './Button';
import { theme } from '../theme';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  onConfirm, 
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar', 
  variant = 'danger' 
}) {
  if (!isOpen) return null;

  return (
    <RNModal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity 
          activeOpacity={1}
          style={styles.content}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttons}>
            <Button
              title={cancelText}
              onPress={onClose}
              variant="secondary"
              size="medium"
              style={{ flex: 1 }}
            />
            <View style={{ width: 12 }} />
            <Button
              title={confirmText}
              onPress={onConfirm}
              variant={variant}
              size="medium"
              style={{ flex: 1 }}
            />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 24,
    maxWidth: 400,
    width: '100%',
    borderWidth: 2,
    borderColor: theme.colors.danger,
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontFamily: 'Truculenta-Bold',
    marginBottom: 12,
  },
  message: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 24,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});

