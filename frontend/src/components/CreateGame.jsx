import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Button, Input, Card, Toast } from './index';
import AvatarSelector, { AVATARS } from './AvatarSelector';
import { colors } from '../theme';
import './CreateGame.css';

function CreateGame() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'join' ? 'join' : 'create';
  const [mode, setMode] = useState(initialMode); // 'create' | 'join'
  const [numPlayers, setNumPlayers] = useState('4');
  const [gameMode, setGameMode] = useState('teams');
  const [charactersPerPlayer, setCharactersPerPlayer] = useState('2');
  const [characters, setCharacters] = useState(['', '']);
  const [timePerRound, setTimePerRound] = useState('60');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  
  // Estado para categorías
  const [useCategory, setUseCategory] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]); // Array de IDs de categorías seleccionadas
  const [useAllCategories, setUseAllCategories] = useState(false); // Flag para usar todas las categorías (Variados)
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [maxCharacters, setMaxCharacters] = useState('');

  // Cargar categorías al activar el modo categoría
  useEffect(() => {
    if (useCategory && categories.length === 0) {
      loadCategories();
    }
  }, [useCategory]);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Error al cargar categorías');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleCharacterChange = (index, value) => {
    const newCharacters = [...characters];
    newCharacters[index] = value;
    setCharacters(newCharacters);
  };

  const updateCharactersPerPlayer = (value) => {
    const num = parseInt(value) || 2;
    setCharactersPerPlayer(value);
    setCharacters(Array(num).fill(''));
  };

  // Filtrar categorías según búsqueda
  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(categorySearch.toLowerCase()))
  );

  const handleNumericInput = (value, setter) => {
    // Solo permitir números enteros
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue === '' || numericValue === '0') {
      setter('');
      return;
    }
    setter(numericValue);
  };

  const handleCreate = async () => {
    // Validaciones según el modo
    if (useCategory) {
      // Verificar si se puede crear el juego: debe tener Variados activo O categorías seleccionadas
      const canCreate = useAllCategories || (selectedCategories && selectedCategories.length > 0);
      
      if (!canCreate) {
        setError('Selecciona al menos una categoría o activa "Variados"');
        return;
      }
      
      // Calcular total de personajes disponibles
      let totalCharactersAvailable;
      if (useAllCategories) {
        // Si usa todas las categorías, sumar todas
        totalCharactersAvailable = categories.reduce((sum, cat) => sum + (cat.characterCount || 0), 0);
      } else {
        // Si usa categorías seleccionadas, sumar solo esas
        const selectedCats = categories.filter(cat => selectedCategories.includes(cat.id));
        totalCharactersAvailable = selectedCats.reduce((sum, cat) => sum + (cat.characterCount || 0), 0);
      }
      
      // Validar límite de personajes si se especifica
      if (maxCharacters) {
        const maxChars = parseInt(maxCharacters);
        if (isNaN(maxChars) || maxChars < 1) {
          setError('El límite de personajes debe ser un número mayor a 0');
          return;
        }
        if (maxChars > totalCharactersAvailable) {
          setError(`El límite no puede exceder ${totalCharactersAvailable} personajes (total combinado de las categorías seleccionadas)`);
          return;
        }
      }
    } else {
      const charsPerPlayer = parseInt(charactersPerPlayer) || 2;
      const trimmedChars = characters.map(c => c.trim()).filter(c => c);

      if (trimmedChars.length !== charsPerPlayer) {
        setError(`Debes ingresar ${charsPerPlayer} personajes`);
        return;
      }

      const uniqueChars = [...new Set(trimmedChars)];
      if (uniqueChars.length !== trimmedChars.length) {
        setError('Los personajes deben ser diferentes');
        return;
      }
    }

    setError('');
    setLoading(true);

    try {
      const gameData = {
        timePerRound: parseInt(timePerRound) || 60,
        numPlayers: parseInt(numPlayers) || 4,
        gameMode,
        avatar: selectedAvatar,
      };

      if (useCategory) {
        if (useAllCategories) {
          // Usar todas las categorías (Variados)
          gameData.useAllCategories = true;
        } else if (selectedCategories.length > 0) {
          // Usar categorías seleccionadas
          gameData.categoryIds = selectedCategories; // Enviar array de IDs
          // También enviar categoryId para compatibilidad si solo hay una categoría
          if (selectedCategories.length === 1) {
            gameData.categoryId = selectedCategories[0];
          }
        }
        gameData.charactersPerPlayer = parseInt(charactersPerPlayer) || 2;
        if (maxCharacters) {
          gameData.maxCharacters = parseInt(maxCharacters);
        }
      } else {
        gameData.characters = characters.map(c => c.trim()).filter(c => c);
        gameData.charactersPerPlayer = parseInt(charactersPerPlayer) || 2;
      }

      const response = await api.createGame(gameData);
      navigate(`/game/${response.game.roomCode}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear partida');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!roomCode.trim()) {
      setError('Ingresa el código de sala');
      return;
    }

    if (!selectedAvatar) {
      setError('Selecciona un avatar');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await api.joinGame(roomCode.trim().toUpperCase(), null, selectedAvatar);
      navigate(`/game/${roomCode.trim().toUpperCase()}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al unirse a la partida');
    } finally {
      setLoading(false);
    }
  };

  const totalCharactersNeeded = parseInt(numPlayers) * parseInt(charactersPerPlayer);

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

  const tabsContainerStyle = {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: '12px',
    padding: '4px',
    marginBottom: '24px',
  };

  const tabStyle = (active) => ({
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: active ? colors.primary : 'transparent',
    color: active ? colors.text : colors.textMuted,
    fontWeight: '500',
    transition: 'all 0.2s',
  });

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>🎮</span>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: colors.text, margin: 0, textTransform: 'uppercase' }}>
            Múltiples Dispositivos
          </h1>
        </div>
        <Button title="Volver" onClick={() => navigate('/dashboard')} variant="secondary" size="small" silent />
      </div>

      {/* Mode Tabs */}
      <div style={tabsContainerStyle}>
        <div
          style={tabStyle(mode === 'create')}
          onClick={() => setMode('create')}
        >
          Crear Partida
        </div>
        <div
          style={tabStyle(mode === 'join')}
          onClick={() => setMode('join')}
        >
          Unirse
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        message={error}
        type="error"
        isVisible={!!error}
        onClose={() => setError('')}
      />

      {mode === 'create' ? (
        <Card>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: colors.text, marginBottom: '16px', textTransform: 'uppercase' }}>
            Configurar Partida
          </h2>

          {/* Selector: Categoría vs Personajes propios */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: colors.textSecondary, fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
              Tipo de personajes
            </label>
            <div style={{ display: 'flex', backgroundColor: colors.surfaceLight, borderRadius: '12px', padding: '4px', gap: '4px' }}>
              <div
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: !useCategory ? colors.primary : 'transparent',
                  color: !useCategory ? colors.text : colors.textMuted,
                  fontWeight: '500',
                }}
                onClick={() => {
                  setUseCategory(false);
                  setSelectedCategories([]);
                  setUseAllCategories(false);
                  setCategorySearch('');
                  setMaxCharacters('');
                }}
              >
                ✏️ Propios
              </div>
              <div
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: useCategory ? colors.primary : 'transparent',
                  color: useCategory ? colors.text : colors.textMuted,
                  fontWeight: '500',
                }}
                onClick={() => setUseCategory(true)}
              >
                📚 Categoría
              </div>
            </div>
          </div>

          {/* Selector de categorías */}
          {useCategory && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: colors.textSecondary, fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                Selecciona categoría
              </label>
              
              {/* Opción Variados */}
              <div
                style={{
                  backgroundColor: useAllCategories ? colors.primary : colors.surfaceLight,
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '12px',
                  cursor: 'pointer',
                  border: `2px solid ${useAllCategories ? colors.primary : 'transparent'}`,
                  transition: 'all 0.2s'
                }}
                onClick={() => {
                  setUseAllCategories(!useAllCategories);
                  if (!useAllCategories) {
                    // Al activar Variados, limpiar selección de categorías
                    setSelectedCategories([]);
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    border: `2px solid ${useAllCategories ? colors.text : colors.textMuted}`,
                    backgroundColor: useAllCategories ? colors.text : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    color: useAllCategories ? colors.primary : colors.textMuted
                  }}>
                    {useAllCategories && '✓'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: 'bold', 
                      color: useAllCategories ? colors.text : colors.textMuted,
                      marginBottom: '4px'
                    }}>
                      🎲 Variados
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: useAllCategories ? colors.textSecondary : colors.textMuted 
                    }}>
                      Personajes aleatorios de todas las categorías
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Buscador de categorías */}
              {categories.length > 0 && (
                <Input
                  placeholder="🔍 Buscar categoría..."
                  value={categorySearch}
                  onChange={setCategorySearch}
                  style={{ marginBottom: '12px' }}
                />
              )}
              
              {!useAllCategories && loadingCategories ? (
                <div style={{ textAlign: 'center', padding: '16px', color: colors.textMuted }}>
                  Cargando categorías...
                </div>
              ) : !useAllCategories && categories.length === 0 ? (
                <div style={{ backgroundColor: colors.surfaceLight, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                  <p style={{ color: colors.textMuted, marginBottom: '12px' }}>No hay categorías disponibles</p>
                  <Button title="🔄 Reintentar" onClick={loadCategories} variant="outline" size="small" />
                </div>
              ) : !useAllCategories && filteredCategories.length === 0 ? (
                <div style={{ backgroundColor: colors.surfaceLight, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                  <p style={{ color: colors.textMuted, marginBottom: '12px' }}>No se encontraron categorías</p>
                  <Button title="Limpiar búsqueda" onClick={() => setCategorySearch('')} variant="outline" size="small" />
                </div>
              ) : !useAllCategories ? (
                <div className="categories-grid">
                  {filteredCategories.map((cat) => {
                    const isSelected = selectedCategories.includes(cat.id);
                    return (
                      <div
                        key={cat.id}
                        className={`category-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          if (isSelected) {
                            // Deseleccionar
                            setSelectedCategories(selectedCategories.filter(id => id !== cat.id));
                          } else {
                            // Seleccionar
                            setSelectedCategories([...selectedCategories, cat.id]);
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <div style={{ 
                          position: 'absolute', 
                          top: '8px', 
                          right: '8px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          border: `2px solid ${isSelected ? colors.primary : colors.textMuted}`,
                          backgroundColor: isSelected ? colors.primary : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px'
                        }}>
                          {isSelected && '✓'}
                        </div>
                        <div className="category-icon">{cat.icon}</div>
                        <div className="category-name">{cat.name}</div>
                        <div className="category-count">{cat.characterCount} pers.</div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {(useAllCategories || selectedCategories.length > 0) && (
                <div style={{ backgroundColor: colors.surfaceLight, borderRadius: '12px', padding: '12px', marginTop: '8px' }}>
                  {!useAllCategories && selectedCategories.length > 0 && (
                    <>
                      <h3 style={{ color: colors.text, fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                        📚 Categorías Seleccionadas ({selectedCategories.length})
                      </h3>
                      <div style={{ marginBottom: '12px' }}>
                        {selectedCategories.map(catId => {
                          const cat = categories.find(c => c.id === catId);
                          if (!cat) return null;
                          return (
                            <div key={catId} style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px',
                              marginBottom: '6px',
                              padding: '6px',
                              backgroundColor: colors.surface,
                              borderRadius: '8px'
                            }}>
                              <span style={{ fontSize: '20px' }}>{cat.icon}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ color: colors.text, fontSize: '14px', fontWeight: '500' }}>{cat.name}</div>
                                <div style={{ color: colors.textMuted, fontSize: '12px' }}>{cat.characterCount} personajes</div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCategories(selectedCategories.filter(id => id !== catId));
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: colors.textMuted,
                                  cursor: 'pointer',
                                  fontSize: '18px',
                                  padding: '4px'
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                  
                  {(() => {
                    let totalChars;
                    if (useAllCategories) {
                      totalChars = categories.reduce((sum, cat) => sum + (cat.characterCount || 0), 0);
                    } else {
                      const selectedCats = categories.filter(cat => selectedCategories.includes(cat.id));
                      totalChars = selectedCats.reduce((sum, cat) => sum + (cat.characterCount || 0), 0);
                    }
                    return (
                      <p style={{ color: colors.success, fontSize: '12px', fontWeight: '500', marginBottom: '12px' }}>
                        ✅ {totalChars} personajes disponibles en total
                      </p>
                    );
                  })()}
                  
                  {/* Input para limitar personajes */}
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${colors.border}` }}>
                    <Input
                      label="Límite de personajes (opcional)"
                      value={maxCharacters}
                      onChange={(val) => handleNumericInput(val, setMaxCharacters)}
                      type="number"
                      placeholder={`Máximo: ${(() => {
                        if (useAllCategories) {
                          return categories.reduce((sum, cat) => sum + (cat.characterCount || 0), 0);
                        } else {
                          const selectedCats = categories.filter(cat => selectedCategories.includes(cat.id));
                          return selectedCats.reduce((sum, cat) => sum + (cat.characterCount || 0), 0);
                        }
                      })()}`}
                    />
                    <p style={{ color: colors.textMuted, fontSize: '11px', marginTop: '4px' }}>
                      {maxCharacters 
                        ? `Se usarán ${parseInt(maxCharacters) || 0} personajes (límite manual)`
                        : `Se usarán ${totalCharactersNeeded} personajes (calculado automáticamente: ${numPlayers} jugadores × ${charactersPerPlayer} por jugador)`
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <Input
            label="Número de jugadores"
            value={numPlayers}
            onChange={(val) => handleNumericInput(val, setNumPlayers)}
            type="number"
            placeholder="4"
          />
          {!useCategory && (
            <p style={{ color: colors.textMuted, fontSize: '12px', marginTop: '-8px', marginBottom: '16px' }}>
              Total de personajes: {totalCharactersNeeded} ({charactersPerPlayer} por jugador)
            </p>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: colors.textSecondary, fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
              Modo de juego
            </label>
            <div style={{ display: 'flex', backgroundColor: colors.surfaceLight, borderRadius: '12px', padding: '4px', gap: '4px' }}>
              <div
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: gameMode === 'teams' ? colors.primary : 'transparent',
                  color: gameMode === 'teams' ? colors.text : colors.textMuted,
                  fontWeight: '500',
                }}
                onClick={() => setGameMode('teams')}
              >
                Equipos
              </div>
              <div
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: gameMode === 'pairs' ? colors.primary : 'transparent',
                  color: gameMode === 'pairs' ? colors.text : colors.textMuted,
                  fontWeight: '500',
                }}
                onClick={() => setGameMode('pairs')}
              >
                Parejas
              </div>
            </div>
          </div>

          <Input
            label="Personajes por jugador"
            value={charactersPerPlayer}
            onChange={useCategory ? (val) => handleNumericInput(val, setCharactersPerPlayer) : (val) => {
              handleNumericInput(val, setCharactersPerPlayer);
              updateCharactersPerPlayer(val);
            }}
            type="number"
            placeholder="2"
          />
              {useCategory && (useAllCategories || selectedCategories.length > 0) && (
            <p style={{ color: colors.textMuted, fontSize: '12px', marginTop: '-8px', marginBottom: '16px' }}>
              Total de personajes: {totalCharactersNeeded} ({charactersPerPlayer} por jugador × {numPlayers} jugadores)
            </p>
          )}

          <Input
            label="Tiempo por ronda (segundos)"
            value={timePerRound}
            onChange={(val) => handleNumericInput(val, setTimePerRound)}
            type="number"
            placeholder="60"
          />

          <div style={{ marginTop: '24px', marginBottom: '16px' }}>
            <AvatarSelector
              selectedAvatar={selectedAvatar}
              onSelect={setSelectedAvatar}
            />
          </div>

          {!useCategory && (
            <>
              <h3 style={{ color: colors.text, fontWeight: 'bold', marginBottom: '12px', marginTop: '8px' }}>
                Tus Personajes ({charactersPerPlayer})
              </h3>
              {Array(parseInt(charactersPerPlayer) || 2)
                .fill(0)
                .map((_, index) => (
                  <Input
                    key={index}
                    placeholder={`Personaje ${index + 1}`}
                    value={characters[index] || ''}
                    onChange={(val) => handleCharacterChange(index, val)}
                  />
                ))}
            </>
          )}

          <Button
            title={loading ? 'Creando...' : 'Crear Partida'}
            onClick={handleCreate}
            loading={loading}
            disabled={
              loading || 
              (useCategory && !useAllCategories && (!selectedCategories || selectedCategories.length === 0)) ||
              (!useCategory && (!characters || characters.every(c => !c.trim())))
            }
            size="large"
            style={{ width: '100%', marginTop: '16px' }}
          />
        </Card>
      ) : (
        <Card>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: colors.text, marginBottom: '16px', textTransform: 'uppercase' }}>
            Unirse a Partida
          </h2>

          <Input
            label="Código de sala"
            value={roomCode}
            onChange={(val) => setRoomCode(val.toUpperCase())}
            placeholder="ABCD12"
          />

          <div style={{ marginTop: '24px', marginBottom: '24px' }}>
            <AvatarSelector
              selectedAvatar={selectedAvatar}
              onSelect={setSelectedAvatar}
            />
          </div>

          <Button
            title={loading ? 'Uniéndose...' : 'Unirse'}
            onClick={handleJoin}
            loading={loading}
            disabled={loading}
            size="large"
            style={{ width: '100%', marginTop: '16px' }}
          />
        </Card>
      )}
    </div>
  );
}

export default CreateGame;
