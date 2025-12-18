import React from 'react';
import { colors, shadows } from '../theme';

export function Card({ children, style = {}, onClick }) {
  const cardStyle = {
    backgroundColor: colors.surfaceDark || 'rgba(30, 37, 74, 0.9)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: '20px',
    padding: '20px',
    border: `1px solid ${colors.border}`,
    boxShadow: shadows.lg,
    cursor: onClick ? 'pointer' : 'default',
    transition: 'all 0.3s ease',
    ...style,
  };

  if (onClick) {
    return (
      <div
        onClick={onClick}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = shadows.lg;
          e.currentTarget.style.backgroundColor = 'rgba(30, 37, 74, 0.95)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = shadows.lg;
          e.currentTarget.style.backgroundColor = colors.surfaceDark || 'rgba(30, 37, 74, 0.9)';
        }}
        style={cardStyle}
      >
        {children}
      </div>
    );
  }

  return <div style={cardStyle}>{children}</div>;
}

export function ActionCard({ icon, title, description, onClick, badge }) {
  const cardStyle = {
    backgroundColor: colors.surfaceDark || 'rgba(30, 37, 74, 0.9)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: '20px',
    padding: '20px',
    marginBottom: '16px',
    border: `1px solid ${colors.border}`,
    boxShadow: shadows.lg,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '0.8';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '1';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
      style={cardStyle}
    >
      <span style={{ fontSize: '36px' }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <h3 style={{ color: colors.text, fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
          {title}
        </h3>
        <p style={{ color: colors.textMuted, fontSize: '14px', margin: 0 }}>
          {description}
        </p>
        {badge && (
          <span
            style={{
              backgroundColor: 'rgba(14, 165, 233, 0.2)',
              color: colors.primaryLight,
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '500',
              display: 'inline-block',
              marginTop: '8px',
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <span style={{ color: colors.textMuted, fontSize: '20px' }}>→</span>
    </div>
  );
}
