import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../src/services/api';
import { Button } from '../src/components/Button';
import { Input } from '../src/components/Input';
import { Card } from '../src/components/Card';
import Toast from '../src/components/Toast';
import AvatarSelector, { AVATARS } from '../src/components/AvatarSelector';
import { theme } from '../src/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateGame() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialMode = params.mode === 'join' ? 'join' : 'create';
  
  const [mode, setMode] = useState(initialMode);
  const [numPlayers, setNumPlayers] = useState('4');
  const [gameMode, setGameMode] = useState('teams');
  const [charactersPerPlayer, setCharactersPerPlayer] = useState('2');
  const [characters, setCharacters] = useState(['', '']);
  const [timePerRound, setTimePerRound] = useState('60');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  
  const [useCategory, setUseCategory] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [maxCharacters, setMaxCharacters] = useState('');

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

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(categorySearch.toLowerCase()))
  );

  const handleCreate = async () => {
    if (useCategory) {
      if (!selectedCategory) {
        setError('Selecciona una categoría');
        return;
      }
      if (maxCharacters) {
        const maxChars = parseInt(maxCharacters);
        if (isNaN(maxChars) || maxChars < 1) {
          setError('El límite de personajes debe ser un número mayor a 0');
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
      router.push(`/game/${response.game.roomCode}`);
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
      await api.joinGame(roomCode.trim().toUpperCase(), null, selectedAvatar);
      router.push(`/game/${roomCode.trim().toUpperCase()}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al unirse a la partida');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={theme.gradients.background}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <Toast
          message={error}
          isVisible={!!error}
          onClose={() => setError('')}
        />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerIcon}>🎮</Text>
              <Text style={styles.headerTitle}>Partida Online</Text>
            </View>
            <Button title="Volver" onPress={() => router.back()} variant="secondary" size="small" />
          </View>

          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, mode === 'create' && styles.activeTab]}
              onPress={() => setMode('create')}
            >
              <Text style={[styles.tabText, mode === 'create' && styles.activeTabText]}>Crear Partida</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === 'join' && styles.activeTab]}
              onPress={() => setMode('join')}
            >
              <Text style={[styles.tabText, mode === 'join' && styles.activeTabText]}>Unirse</Text>
            </TouchableOpacity>
          </View>

          {mode === 'create' ? (
            <Card>
              <Text style={styles.cardTitle}>Configurar Partida</Text>

              <View style={styles.optionSelector}>
                <TouchableOpacity
                  style={[styles.option, !useCategory && styles.activeOption]}
                  onPress={() => setUseCategory(false)}
                >
                  <Text style={[styles.optionText, !useCategory && styles.activeOptionText]}>✏️ Propios</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.option, useCategory && styles.activeOption]}
                  onPress={() => setUseCategory(true)}
                >
                  <Text style={[styles.optionText, useCategory && styles.activeOptionText]}>📚 Categoría</Text>
                </TouchableOpacity>
              </View>

              {useCategory && (
                <View style={styles.categorySection}>
                  <Input
                    placeholder="🔍 Buscar categoría..."
                    value={categorySearch}
                    onChangeText={setCategorySearch}
                  />
                  
                  {loadingCategories ? (
                    <Text style={styles.loadingText}>Cargando categorías...</Text>
                  ) : (
                    <View style={styles.categoriesGrid}>
                      {filteredCategories.map((cat) => (
                        <TouchableOpacity
                          key={cat.id}
                          style={[styles.categoryCard, selectedCategory?.id === cat.id && styles.selectedCategory]}
                          onPress={() => setSelectedCategory(cat)}
                        >
                          <Text style={styles.categoryIcon}>{cat.icon}</Text>
                          <Text style={styles.categoryName} numberOfLines={1}>{cat.name}</Text>
                          <Text style={styles.categoryCount}>{cat.characterCount} pers.</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {selectedCategory && (
                    <View style={styles.selectedCategoryDetail}>
                      <Text style={styles.detailTitle}>{selectedCategory.icon} {selectedCategory.name}</Text>
                      <Text style={styles.detailDesc}>{selectedCategory.description}</Text>
                      <Input
                        label="Límite de personajes (opcional)"
                        value={maxCharacters}
                        onChangeText={setMaxCharacters}
                        keyboardType="numeric"
                        placeholder={`Máximo: ${selectedCategory.characterCount}`}
                      />
                    </View>
                  )}
                </View>
              )}

              <Input
                label="Número de jugadores"
                value={numPlayers}
                onChangeText={setNumPlayers}
                keyboardType="numeric"
              />

              <View style={styles.optionSelector}>
                <TouchableOpacity
                  style={[styles.option, gameMode === 'teams' && styles.activeOption]}
                  onPress={() => setGameMode('teams')}
                >
                  <Text style={[styles.optionText, gameMode === 'teams' && styles.activeOptionText]}>Equipos</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.option, gameMode === 'pairs' && styles.activeOption]}
                  onPress={() => setGameMode('pairs')}
                >
                  <Text style={[styles.optionText, gameMode === 'pairs' && styles.activeOptionText]}>Parejas</Text>
                </TouchableOpacity>
              </View>

              <Input
                label="Personajes por jugador"
                value={charactersPerPlayer}
                onChangeText={useCategory ? setCharactersPerPlayer : updateCharactersPerPlayer}
                keyboardType="numeric"
              />

              <Input
                label="Tiempo por ronda (segundos)"
                value={timePerRound}
                onChangeText={setTimePerRound}
                keyboardType="numeric"
              />

              <AvatarSelector
                selectedAvatar={selectedAvatar}
                onSelect={setSelectedAvatar}
              />

              {!useCategory && (
                <View style={styles.charactersSection}>
                  <Text style={styles.sectionSubtitle}>Tus Personajes ({charactersPerPlayer})</Text>
                  {Array(parseInt(charactersPerPlayer) || 0).fill(0).map((_, index) => (
                    <Input
                      key={index}
                      placeholder={`Personaje ${index + 1}`}
                      value={characters[index] || ''}
                      onChangeText={(val) => handleCharacterChange(index, val)}
                    />
                  ))}
                </View>
              )}

              <Button
                title={loading ? 'Creando...' : 'Crear Partida'}
                onPress={handleCreate}
                loading={loading}
                disabled={loading || (useCategory && !selectedCategory)}
                size="large"
                style={{ marginTop: 20 }}
              />
            </Card>
          ) : (
            <Card>
              <Text style={styles.cardTitle}>Unirse a Partida</Text>
              <Input
                label="Código de sala"
                value={roomCode}
                onChangeText={(val) => setRoomCode(val.toUpperCase())}
                placeholder="ABCD12"
                autoCapitalize="characters"
              />
              <View style={{ marginTop: 20, marginBottom: 20 }}>
                <AvatarSelector
                  selectedAvatar={selectedAvatar}
                  onSelect={setSelectedAvatar}
                />
              </View>
              <Button
                title={loading ? 'Uniéndose...' : 'Unirse'}
                onPress={handleJoin}
                loading={loading}
                disabled={loading}
                size="large"
              />
            </Card>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    color: '#fff',
    textTransform: 'uppercase',
    fontFamily: 'Truculenta-Bold',
    textShadowColor: '#111',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    color: theme.colors.textMuted,
    fontFamily: 'Truculenta',
  },
  activeTabText: {
    color: '#fff',
    fontFamily: 'Truculenta-Bold',
  },
  cardTitle: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 16,
    textTransform: 'uppercase',
    fontFamily: 'Truculenta-Bold',
    textShadowColor: '#111',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },
  optionSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  option: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeOption: {
    backgroundColor: theme.colors.primary,
  },
  optionText: {
    color: theme.colors.textMuted,
    fontFamily: 'Truculenta',
  },
  activeOptionText: {
    color: '#fff',
    fontFamily: 'Truculenta-Bold',
  },
  categorySection: {
    marginBottom: 16,
  },
  loadingText: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    padding: 20,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryCard: {
    width: '31%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCategory: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryName: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'Truculenta-Bold',
  },
  categoryCount: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontFamily: 'Truculenta',
  },
  selectedCategoryDetail: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  detailTitle: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 4,
    fontFamily: 'Truculenta-Bold',
  },
  detailDesc: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginBottom: 12,
    fontFamily: 'Truculenta',
  },
  sectionSubtitle: {
    color: '#fff',
    marginBottom: 12,
    marginTop: 8,
    fontFamily: 'Truculenta-Bold',
  },
  charactersSection: {
    marginTop: 10,
  },
});

