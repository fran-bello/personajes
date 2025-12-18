import { useState } from 'react';
import './AvatarSelector.css';

const AVATARS = [
  '🦊', '🐼', '🦁', '🐯', '🐻',
  '🐨', '🐸', '🦉', '🦄', '🐲'
];

function AvatarSelector({ selectedAvatar, onSelect, className = '' }) {
  return (
    <div className={`avatar-selector ${className}`}>
      <h3 className="avatar-selector-title">Selecciona tu avatar</h3>
      <div className="avatar-grid">
        {AVATARS.map((avatar, index) => (
          <button
            key={index}
            className={`avatar-option ${selectedAvatar === avatar ? 'selected' : ''}`}
            onClick={() => onSelect(avatar)}
            type="button"
          >
            <span className="avatar-emoji">{avatar}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default AvatarSelector;
export { AVATARS };
