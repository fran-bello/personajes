import React, { useEffect, useState } from 'react';
import './InputOverlay.css';

export function InputOverlay({ value, label, isVisible, inputRef }) {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Solo mostrar si hay texto y está visible
    setShouldShow(isVisible && value && value.length > 0);
  }, [isVisible, value]);

  if (!shouldShow) return null;

  return (
    <div className="input-overlay">
      <div className="input-overlay-content">
        {label && (
          <div className="input-overlay-label">{label}</div>
        )}
        <div className="input-overlay-text">{value}</div>
      </div>
    </div>
  );
}



