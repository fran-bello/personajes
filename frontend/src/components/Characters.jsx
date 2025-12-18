import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card } from './index';
import { colors } from '../theme';

function Characters() {
  const [characters, setCharacters] = useState([]);
  const [newCharacter, setNewCharacter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const { user, fetchUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    try {
      const response = await api.getCharacters();
      setCharacters(response.characters);
    } catch (err) {
      setError('Error al cargar personajes');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e?.preventDefault();
    if (!newCharacter.trim()) return;

    setAdding(true);
    setError('');

    try {
      const response = await api.addCharacter(newCharacter.trim());
      setCharacters(response.characters);
      setNewCharacter('');
      await fetchUser();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al agregar personaje');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (character) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${character}"?`)) {
      return;
    }

    try {
      const response = await api.deleteCharacter(character);
      setCharacters(response.characters);
      await fetchUser();
    } catch (err) {
      setError('Error al eliminar personaje');
    }
  };

  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  if (loading) {
    return (
      <div className="loading">
        <div style={{ textAlign: 'center', color: colors.textMuted }}>
          Cargando personajes...
        </div>
      </div>
    );
  }

  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: 'transparent',
    padding: '24px',
    paddingBottom: '40px',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  };

  const addCardStyle = {
    marginBottom: '16px',
  };

  const addRowStyle = {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end',
  };

  const inputContainerStyle = {
    flex: 1,
  };

  const countRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: colors.surfaceLight,
    borderRadius: '12px',
  };

  const characterGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '12px',
  };

  const characterCardStyle = {
    position: 'relative',
  };

  const characterContentStyle = {
    padding: '16px',
    textAlign: 'center',
  };

  const deleteButtonStyle = {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '28px',
    height: '28px',
    borderRadius: '14px',
    backgroundColor: `${colors.danger}30`,
    border: 'none',
    color: colors.danger,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    transition: 'all 0.2s',
  };

  const emptyCardStyle = {
    textAlign: 'center',
    padding: '40px 20px',
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>👤</span>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: colors.text, margin: 0, textTransform: 'uppercase' }}>
            Mis Personajes
          </h1>
        </div>
        <Button title="Volver" onClick={() => navigate(-1)} variant="secondary" size="small" />
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            backgroundColor: `${colors.danger}20`,
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            color: colors.danger,
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}

      {/* Add Form */}
      <Card style={addCardStyle}>
        <h3 style={{ color: colors.text, fontWeight: 'bold', marginBottom: '12px' }}>
          Agregar nuevo personaje
        </h3>
        <form onSubmit={handleAdd}>
          <div style={addRowStyle}>
            <div style={inputContainerStyle}>
              <Input
                placeholder="Nombre del personaje"
                value={newCharacter}
                onChange={setNewCharacter}
              />
            </div>
            <Button
              title="Agregar"
              onClick={handleAdd}
              loading={adding}
              disabled={adding || !newCharacter.trim()}
            />
          </div>
        </form>
      </Card>

      {/* Count */}
      <div style={countRowStyle}>
        <span style={{ color: colors.text, fontWeight: '500' }}>
          Total: {characters.length} personajes
        </span>
        {characters.length < 10 && (
          <span style={{ color: colors.warning, fontSize: '12px' }}>
            Necesitas al menos 10 para jugar online
          </span>
        )}
      </div>

      {/* List */}
      {characters.length === 0 ? (
        <Card style={emptyCardStyle}>
          <img 
            src="/img/logo-personajes.png" 
            alt="Personajes" 
            style={{ 
              maxWidth: '120px', 
              maxHeight: '120px', 
              marginBottom: '16px',
              objectFit: 'contain'
            }} 
          />
          <h3 style={{ color: colors.text, fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
            Sin personajes
          </h3>
          <p style={{ color: colors.textMuted, fontSize: '14px' }}>
            Agrega algunos personajes para comenzar a jugar
          </p>
        </Card>
      ) : (
        <div style={characterGridStyle}>
          {characters.map((character, index) => (
            <Card key={index} style={characterCardStyle}>
              <div style={characterContentStyle}>
                <button
                  style={deleteButtonStyle}
                  onClick={() => handleDelete(character)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.danger;
                    e.currentTarget.style.color = colors.text;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = `${colors.danger}30`;
                    e.currentTarget.style.color = colors.danger;
                  }}
                >
                  ✕
                </button>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎭</div>
                <div style={{ color: colors.text, fontSize: '16px', fontWeight: '600' }}>
                  {capitalize(character)}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default Characters;
