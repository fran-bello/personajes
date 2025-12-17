import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SegmentedButtons } from 'react-native-paper';
import { api } from '../../src/services/api';
import { Button, Input, Card } from '../../src/components';
import { colors } from '../../src/theme';
import { Category } from '../../src/types';

export default function CreateGameScreen() {
  const [mode, setMode] = useState<'create' | 'join'>('create');
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
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

  const handleCharacterChange = (index: number, value: string) => {
    const newCharacters = [...characters];
    newCharacters[index] = value;
    setCharacters(newCharacters);
  };

  const updateCharactersPerPlayer = (value: string) => {
    const num = parseInt(value) || 2;
    setCharactersPerPlayer(value);
    setCharacters(Array(num).fill(''));
  };

  // Filtrar categorías según búsqueda
  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(categorySearch.toLowerCase()))
  );

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
        if (maxChars > selectedCategory.characterCount!) {
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
      const gameData: any = {
        timePerRound: parseInt(timePerRound) || 60,
        numPlayers: parseInt(numPlayers) || 4,
        gameMode,
      };

      if (useCategory && selectedCategory) {
        gameData.categoryId = selectedCategory.id;
        if (maxCharacters) {
          gameData.maxCharacters = parseInt(maxCharacters);
        }
      } else {
        gameData.characters = characters.map(c => c.trim()).filter(c => c);
        gameData.charactersPerPlayer = parseInt(charactersPerPlayer) || 2;
      }

      const response = await api.createGame(gameData);
      router.replace(`/(app)/game/${response.game.roomCode}`);
    } catch (err: any) {
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
      router.replace(`/(app)/game/${roomCode.trim().toUpperCase()}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al unirse a la partida');
    } finally {
      setLoading(false);
    }
  };

  const totalCharactersNeeded = parseInt(numPlayers) * parseInt(charactersPerPlayer);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitle}>
              <Text style={styles.headerIcon}>🎮</Text>
              <Text style={styles.title}>Partida Online</Text>
            </View>
            <Button title="Volver" onPress={() => router.back()} variant="secondary" size="small" />
          </View>

          {/* Mode Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, mode === 'create' && styles.tabActive]}
              onPress={() => setMode('create')}
            >
              <Text style={[styles.tabText, mode === 'create' && styles.tabTextActive]}>
                Crear Partida
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === 'join' && styles.tabActive]}
              onPress={() => setMode('join')}
            >
              <Text style={[styles.tabText, mode === 'join' && styles.tabTextActive]}>
                Unirse
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {mode === 'create' ? (
            <Card>
              <Text style={styles.cardTitle}>Configurar Partida</Text>

              {/* Selector: Categoría vs Personajes propios */}
              <Text style={styles.label}>Tipo de personajes</Text>
              <View style={styles.modeContainer}>
                <TouchableOpacity
                  style={[styles.modeButton, !useCategory && styles.modeButtonActive]}
                  onPress={() => { 
                    setUseCategory(false); 
                    setSelectedCategory(null); 
                    setCategorySearch('');
                    setMaxCharacters('');
                  }}
                >
                  <Text style={[styles.modeText, !useCategory && styles.modeTextActive]}>
                    ✏️ Propios
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeButton, useCategory && styles.modeButtonActive]}
                  onPress={() => setUseCategory(true)}
                >
                  <Text style={[styles.modeText, useCategory && styles.modeTextActive]}>
                    📚 Categoría
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Selector de categorías */}
              {useCategory && (
                <View style={styles.categorySection}>
                  <Text style={styles.label}>Selecciona categoría</Text>
                  
                  {/* Buscador de categorías */}
                  {categories.length > 0 && (
                    <Input
                      placeholder="🔍 Buscar categoría..."
                      value={categorySearch}
                      onChangeText={setCategorySearch}
                      style={styles.searchInput}
                    />
                  )}
                  
                  {loadingCategories ? (
                    <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
                  ) : categories.length === 0 ? (
                    <View style={styles.noCategoriesBox}>
                      <Text style={styles.noCategoriesText}>No hay categorías disponibles</Text>
                      <TouchableOpacity onPress={loadCategories} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>🔄 Reintentar</Text>
                      </TouchableOpacity>
                    </View>
                  ) : filteredCategories.length === 0 ? (
                    <View style={styles.noCategoriesBox}>
                      <Text style={styles.noCategoriesText}>No se encontraron categorías</Text>
                      <TouchableOpacity onPress={() => setCategorySearch('')} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>Limpiar búsqueda</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
                      {filteredCategories.map((cat) => (
                        <TouchableOpacity
                          key={cat.id}
                          style={[
                            styles.categoryCard,
                            selectedCategory?.id === cat.id && styles.categoryCardActive
                          ]}
                          onPress={() => {
                            setSelectedCategory(cat);
                            setMaxCharacters(''); // Limpiar límite al cambiar categoría
                          }}
                        >
                          <Text style={styles.categoryIcon}>{cat.icon}</Text>
                          <Text style={[
                            styles.categoryName,
                            selectedCategory?.id === cat.id && styles.categoryNameActive
                          ]}>{cat.name}</Text>
                          <Text style={styles.categoryCount}>{cat.characterCount} pers.</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                  {selectedCategory && (
                    <View style={styles.selectedCategoryInfo}>
                      <Text style={styles.selectedCategoryTitle}>
                        {selectedCategory.icon} {selectedCategory.name}
                      </Text>
                      <Text style={styles.selectedCategoryDesc}>{selectedCategory.description}</Text>
                      <Text style={styles.selectedCategoryChars}>
                        ✅ {selectedCategory.characterCount} personajes disponibles
                      </Text>
                      
                      {/* Input para limitar personajes */}
                      <View style={styles.maxCharsContainer}>
                        <Input
                          label="Límite de personajes (opcional)"
                          value={maxCharacters}
                          onChangeText={setMaxCharacters}
                          keyboardType="numeric"
                          placeholder={`Máximo: ${selectedCategory.characterCount}`}
                          style={styles.maxCharsInput}
                        />
                        <Text style={styles.maxCharsHelper}>
                          {maxCharacters 
                            ? `Se usarán ${Math.min(parseInt(maxCharacters) || 0, selectedCategory.characterCount!)} personajes`
                            : `Se usarán todos los ${selectedCategory.characterCount} personajes`
                          }
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              <Input
                label="Número de jugadores"
                value={numPlayers}
                onChangeText={setNumPlayers}
                keyboardType="numeric"
                placeholder="4"
              />
              {!useCategory && (
                <Text style={styles.helperText}>
                  Total de personajes: {totalCharactersNeeded} ({charactersPerPlayer} por jugador)
                </Text>
              )}

              <Text style={styles.label}>Modo de juego</Text>
              <View style={styles.modeContainer}>
                <TouchableOpacity
                  style={[styles.modeButton, gameMode === 'teams' && styles.modeButtonActive]}
                  onPress={() => setGameMode('teams')}
                >
                  <Text style={[styles.modeText, gameMode === 'teams' && styles.modeTextActive]}>
                    Equipos
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeButton, gameMode === 'pairs' && styles.modeButtonActive]}
                  onPress={() => setGameMode('pairs')}
                >
                  <Text style={[styles.modeText, gameMode === 'pairs' && styles.modeTextActive]}>
                    Parejas
                  </Text>
                </TouchableOpacity>
              </View>

              {!useCategory && (
                <Input
                  label="Personajes por jugador"
                  value={charactersPerPlayer}
                  onChangeText={updateCharactersPerPlayer}
                  keyboardType="numeric"
                  placeholder="2"
                />
              )}

              <Input
                label="Tiempo por ronda (segundos)"
                value={timePerRound}
                onChangeText={setTimePerRound}
                keyboardType="numeric"
                placeholder="60"
              />

              {!useCategory && (
                <>
                  <Text style={styles.sectionTitle}>
                    Tus Personajes ({charactersPerPlayer})
                  </Text>
                  {Array(parseInt(charactersPerPlayer) || 2)
                    .fill(0)
                    .map((_, index) => (
                      <Input
                        key={index}
                        placeholder={`Personaje ${index + 1}`}
                        value={characters[index] || ''}
                        onChangeText={(value) => handleCharacterChange(index, value)}
                      />
                    ))}
                </>
              )}

              <Button
                title={loading ? 'Creando...' : 'Crear Partida'}
                onPress={handleCreate}
                loading={loading}
                disabled={loading}
                size="large"
              />
            </Card>
          ) : (
            <Card>
              <Text style={styles.cardTitle}>Unirse a Partida</Text>

              <Input
                label="Código de sala"
                value={roomCode}
                onChangeText={(text) => setRoomCode(text.toUpperCase())}
                placeholder="ABCD12"
                autoCapitalize="characters"
              />

              <Button
                title={loading ? 'Uniéndose...' : 'Unirse'}
                onPress={handleJoin}
                loading={loading}
                disabled={loading}
                size="large"
              />
            </Card>
          )}

          <View style={styles.bottomSpace} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.text,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    color: colors.danger,
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: -8,
    marginBottom: 16,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  modeContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: colors.primary,
  },
  modeText: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  modeTextActive: {
    color: colors.text,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  bottomSpace: {
    height: 80,
  },
  // Estilos para categorías
  categorySection: {
    marginBottom: 16,
  },
  categoriesScroll: {
    marginVertical: 8,
  },
  categoryCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  categoryName: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryNameActive: {
    color: colors.primary,
  },
  categoryCount: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  selectedCategoryInfo: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  selectedCategoryTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedCategoryDesc: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  selectedCategoryChars: {
    color: colors.success,
    fontSize: 12,
    marginTop: 8,
  },
  noCategoriesBox: {
    alignItems: 'center',
    padding: 16,
  },
  noCategoriesText: {
    color: colors.textMuted,
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.primary,
  },
  searchInput: {
    marginBottom: 12,
  },
  maxCharsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  maxCharsInput: {
    marginBottom: 4,
  },
  maxCharsHelper: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
});
