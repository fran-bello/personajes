import React, { useState } from 'react';
import './Input.css';

export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  style = {},
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  const inputClasses = [
    'input',
    isPassword ? 'password' : '',
    error ? 'error' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="input-container">
      {label && (
        <label className="input-label">
          {label}
        </label>
      )}
      <div className="input-wrapper">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClasses}
          style={style}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="input-toggle-button"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <img 
              src={showPassword ? '/img/ojo-abierto.png' : '/img/ojo-cerrado.png'} 
              alt={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="input-toggle-icon"
            />
          </button>
        )}
      </div>
      {error && (
        <p className="input-error">
          {error}
        </p>
      )}
    </div>
  );
}
