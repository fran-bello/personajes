import React from 'react';
import { soundService } from '../services/sound';
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

export function ActionCard({ icon, title, description, onClick, badge, silent = true }) {
  const handleClick = (e) => {
    // No reproducir sonido por defecto en ActionCard (ya que se usa para navegación)
    // Ejecutar el onClick original si existe
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <div className="action-card" onClick={handleClick}>
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
