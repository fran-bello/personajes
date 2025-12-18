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
}) {
  const buttonClasses = [
    'button',
    variant === 'outline' ? 'outline' : '',
    variant === 'danger' ? 'danger' : '',
    size,
    loading ? 'loading' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      onClick={onClick}
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
