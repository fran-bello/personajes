import React, { useState, useRef } from 'react';
import './Input.css';
import { InputOverlay } from './InputOverlay';

export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  style = {},
  showOverlay = true,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  const inputClasses = [
    'input',
    isPassword ? 'password' : '',
    error ? 'error' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <div className="input-container">
        {label && (
          <label className="input-label">
            {label}
          </label>
        )}
        <div className="input-wrapper">
          <input
            ref={inputRef}
            type={inputType}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
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
      {showOverlay && !isPassword && (
        <InputOverlay
          value={value}
          label={label}
          isVisible={isFocused}
          inputRef={inputRef}
        />
      )}
    </>
  );
}
