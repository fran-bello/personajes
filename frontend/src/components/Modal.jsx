import { useEffect } from 'react';
import { colors } from '../theme';
import { Button } from './index';

function Modal({ isOpen, onClose, title, message, onConfirm, confirmText = 'Confirmar', cancelText = 'Cancelar', variant = 'danger' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: colors.surface,
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '400px',
          width: '100%',
          border: `2px solid ${variant === 'danger' ? colors.danger : colors.primary}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ color: colors.text, fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>
          {title}
        </h2>
        <p style={{ color: colors.textSecondary, fontSize: '16px', marginBottom: '24px', lineHeight: '24px' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Button
            title={cancelText}
            onClick={onClose}
            variant="secondary"
            size="medium"
          />
          <Button
            title={confirmText}
            onClick={onConfirm}
            variant={variant}
            size="medium"
          />
        </div>
      </div>
    </div>
  );
}

export default Modal;
