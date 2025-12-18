import React, { useState } from 'react';
import { colors } from '../theme';

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

  const containerStyle = {
    position: 'relative',
    marginBottom: '16px',
  };

  // Asegurar que borderRadius siempre se aplique, incluso si viene en style
  const { borderRadius: customBorderRadius, ...restStyle } = style;
  const borderRadiusValue = customBorderRadius || '16px';
  
  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    paddingRight: isPassword ? '48px' : '16px',
    backgroundColor: colors.surfaceLight,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: `1px solid ${error ? colors.danger : colors.border}`,
    borderRadius: borderRadiusValue, // Siempre aplicar borderRadius
    WebkitBorderRadius: borderRadiusValue, // Para Safari
    MozBorderRadius: borderRadiusValue, // Para Firefox antiguos
    color: colors.text,
    fontSize: '16px',
    outline: 'none',
    WebkitAppearance: 'none', // Remover estilos nativos de Safari/iOS
    MozAppearance: 'none', // Remover estilos nativos de Firefox
    appearance: 'none',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    ...restStyle,
  };

  const toggleButtonStyle = {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: colors.textMuted,
    cursor: 'pointer',
    fontSize: '18px',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s',
    lineHeight: '1',
  };

  return (
    <div style={containerStyle}>
      {label && (
        <label
          style={{
            display: 'block',
            color: colors.textSecondary,
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '8px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={inputStyle}
          onFocus={(e) => {
            e.target.style.borderColor = colors.primaryLight;
            e.target.style.borderRadius = borderRadiusValue; // Mantener borderRadius en focus
            e.target.style.outline = `2px solid ${colors.primaryLight}33`;
            e.target.style.outlineOffset = '2px';
            e.target.style.boxShadow = '0 2px 8px rgba(14, 165, 233, 0.3)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? colors.danger : colors.border;
            e.target.style.borderRadius = borderRadiusValue; // Mantener borderRadius en blur
            e.target.style.outline = 'none';
            e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
          }}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={toggleButtonStyle}
            onMouseEnter={(e) => {
              e.target.style.color = colors.text;
            }}
            onMouseLeave={(e) => {
              e.target.style.color = colors.textMuted;
            }}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        )}
      </div>
      {error && (
        <p style={{ color: colors.danger, fontSize: '12px', margin: '4px 0 0 0' }}>
          {error}
        </p>
      )}
    </div>
  );
}
