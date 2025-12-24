import React from 'react';
import './Button.css';

export function Button({
  title,
  onClick,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  style = {},
  className = '',
  type = 'button',
  silent = false, // Prop mantenida por compatibilidad pero no se usa
}) {
  const buttonClasses = [
    'button',
    variant === 'outline' ? 'outline' : '',
    variant === 'danger' ? 'danger' : '',
    size,
    loading ? 'loading' : '',
    className,
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    // Ejecutar el onClick original si existe
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      className={buttonClasses}
      style={style}
    >
      {loading && <span>⏳</span>}
      {icon && <span>{icon}</span>}
      {title}
    </button>
  );
}
