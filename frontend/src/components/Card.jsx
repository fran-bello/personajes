import React from 'react';
import './Card.css';

export function Card({ children, style = {}, className = '', onClick }) {
  const cardClasses = [
    'card',
    onClick ? 'clickable' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClasses}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
}

export function ActionCard({ icon, title, description, onClick, badge }) {
  return (
    <div className="action-card" onClick={onClick}>
      <span className="action-card-icon">{icon}</span>
      <div className="action-card-content">
        <h3 className="action-card-title">{title}</h3>
        <p className="action-card-description">{description}</p>
        {badge && (
          <span className="action-card-badge">
            {badge}
          </span>
        )}
      </div>
      <span className="action-card-arrow">→</span>
    </div>
  );
}
