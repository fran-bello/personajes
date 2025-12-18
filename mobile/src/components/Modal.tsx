import React from 'react';
import { View, Text, Modal as RNModal, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
}

export function Modal({
  isOpen,
  onClose,
  title,
  message,
  onConfirm,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
}: ModalProps) {
  return (
    <RNModal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { borderColor: variant === 'danger' ? colors.danger : colors.primary }]}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonsRow}>
            <Button
              title={cancelText}
              onPress={onClose}
              variant="secondary"
              size="medium"
            />
            <View style={{ width: 12 }} />
            <Button
              title={confirmText}
              onPress={onConfirm}
              variant={variant}
              size="medium"
            />
          </View>
        </View>
      </View>
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
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  message: {
    color: colors.textSecondary,
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 24,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
