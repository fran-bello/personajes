import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Button, Input, Card } from './index';
import { colors } from '../theme';

function CreateGame() {
  const [mode, setMode] = useState('create'); // 'create' | 'join'
  const [numPlayers, setNumPlayers] = useState('4');
  const [gameMode, setGameMode] = useState('teams');
  const [charactersPerPlayer, setCharactersPerPlayer] = useState('2');
  const [characters, setCharacters] = useState(['', '']);
  const [timePerRound, setTimePerRound] = useState('60');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estado para categorías
  const [useCategory, setUseCategory] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
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
      if (!selectedCategory) {
        setError('Selecciona una categoría');
        return;
      }
      
      // Validar límite de personajes si se especifica
      if (maxCharacters) {
        const maxChars = parseInt(maxCharacters);
        if (isNaN(maxChars) || maxChars < 1) {
          setError('El límite de personajes debe ser un número mayor a 0');
          return;
        }
        if (maxChars > selectedCategory.characterCount) {
          setError(`El límite no puede exceder ${selectedCategory.characterCount} personajes (total de la categoría)`);
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
      };

      if (useCategory && selectedCategory) {
        gameData.categoryId = selectedCategory.id;
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

    setError('');
    setLoading(true);

    try {
      await api.joinGame(roomCode.trim().toUpperCase());
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
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: colors.text, margin: 0 }}>
            Partida Online
          </h1>
        </div>
        <Button title="Volver" onClick={() => navigate(-1)} variant="secondary" size="small" />
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

      {mode === 'create' ? (
        <Card>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: colors.text, marginBottom: '16px' }}>
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
                  setSelectedCategory(null);
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
              
              {/* Buscador de categorías */}
              {categories.length > 0 && (
                <Input
                  placeholder="🔍 Buscar categoría..."
                  value={categorySearch}
                  onChange={setCategorySearch}
                  style={{ marginBottom: '12px' }}
                />
              )}
              
              {loadingCategories ? (
                <div style={{ textAlign: 'center', padding: '16px', color: colors.textMuted }}>
                  Cargando categorías...
                </div>
              ) : categories.length === 0 ? (
                <div style={{ backgroundColor: colors.surfaceLight, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                  <p style={{ color: colors.textMuted, marginBottom: '12px' }}>No hay categorías disponibles</p>
                  <Button title="🔄 Reintentar" onClick={loadCategories} variant="outline" size="small" />
                </div>
              ) : filteredCategories.length === 0 ? (
                <div style={{ backgroundColor: colors.surfaceLight, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                  <p style={{ color: colors.textMuted, marginBottom: '12px' }}>No se encontraron categorías</p>
                  <Button title="Limpiar búsqueda" onClick={() => setCategorySearch('')} variant="outline" size="small" />
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', marginBottom: '12px', paddingBottom: '8px' }}>
                  {filteredCategories.map((cat) => (
                    <div
                      key={cat.id}
                      style={{
                        backgroundColor: selectedCategory?.id === cat.id ? `${colors.primary}15` : colors.surfaceLight,
                        borderRadius: '12px',
                        padding: '12px',
                        minWidth: '100px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        border: `2px solid ${selectedCategory?.id === cat.id ? colors.primary : 'transparent'}`,
                        transition: 'all 0.2s',
                      }}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setMaxCharacters('');
                      }}
                    >
                      <div style={{ fontSize: '28px', marginBottom: '4px' }}>{cat.icon}</div>
                      <div style={{
                        color: selectedCategory?.id === cat.id ? colors.primary : colors.text,
                        fontSize: '12px',
                        fontWeight: '600',
                      }}>
                        {cat.name}
                      </div>
                      <div style={{ color: colors.textMuted, fontSize: '10px', marginTop: '2px' }}>
                        {cat.characterCount} pers.
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedCategory && (
                <div style={{ backgroundColor: colors.surfaceLight, borderRadius: '12px', padding: '12px', marginTop: '8px' }}>
                  <h3 style={{ color: colors.text, fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                    {selectedCategory.icon} {selectedCategory.name}
                  </h3>
                  <p style={{ color: colors.textSecondary, fontSize: '13px', marginBottom: '4px' }}>
                    {selectedCategory.description}
                  </p>
                  <p style={{ color: colors.success, fontSize: '12px', fontWeight: '500' }}>
                    ✅ {selectedCategory.characterCount} personajes disponibles
                  </p>
                  
                  {/* Input para limitar personajes */}
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${colors.border}` }}>
                    <Input
                      label="Límite de personajes (opcional)"
                      value={maxCharacters}
                      onChange={(val) => handleNumericInput(val, setMaxCharacters)}
                      type="number"
                      placeholder={`Máximo: ${selectedCategory.characterCount}`}
                    />
                    <p style={{ color: colors.textMuted, fontSize: '11px', marginTop: '4px' }}>
                      {maxCharacters 
                        ? `Se usarán ${Math.min(parseInt(maxCharacters) || 0, selectedCategory.characterCount)} personajes (límite manual)`
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
          {useCategory && selectedCategory && (
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
            disabled={loading || (useCategory && !selectedCategory)}
            size="large"
            style={{ width: '100%', marginTop: '16px' }}
          />
        </Card>
      ) : (
        <Card>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: colors.text, marginBottom: '16px' }}>
            Unirse a Partida
          </h2>

          <Input
            label="Código de sala"
            value={roomCode}
            onChange={(val) => setRoomCode(val.toUpperCase())}
            placeholder="ABCD12"
          />

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
