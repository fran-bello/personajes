import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { Input } from '../src/components/Input';
import { theme } from '../src/theme';
import { api } from '../src/services/api';

const AVATARS = ['🦊','🐼','🦁','🐯','🐻','🐨','🐸','🦉','🦄','🐲','🐙','🐵','🐧','🐰','🐶','🐱','🐭'];
const timeOptions = [30, 60, 90, 120, 150, 180];
const roundRules = {
  1: 'Puedes decir todas las palabras excepto las del personaje',
  2: 'Solo puedes decir UNA palabra',
  3: 'Solo mímica. No puedes hablar',
};

const roundDetails = {
  1: {
    icon: '🗣️',
    title: 'DESCRIBE',
    description: 'Puedes usar todas las palabras que quieras para describir al personaje',
    tips: ['No digas el nombre del personaje', 'No uses rimas ni deletrees', 'Sé creativo con las descripciones'],
  },
  2: {
    icon: '☝️',
    title: 'UNA PALABRA',
    description: 'Solo puedes decir UNA palabra para que adivinen',
    tips: ['Elige la palabra más representativa', 'Puedes repetir la misma palabra', 'No puedes hacer gestos'],
  },
  3: {
    icon: '🎭',
    title: 'MÍMICA',
    description: 'Solo puedes usar gestos y movimientos. ¡Prohibido hablar!',
    tips: ['No puedes emitir sonidos', 'Usa todo tu cuerpo', 'Puedes señalar objetos del entorno'],
  },
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FALLBACK_CATEGORIES = [
  {
    id: 1,
    name: 'Películas',
    icon: '🎬',
    description: 'Clásicos y éxitos de cine',
    characters: [
      'Harry Potter','Hermione Granger','Darth Vader','Luke Skywalker','Indiana Jones',
      'Forrest Gump','Tony Stark','Thor','Capitán América','Black Panther','Wonder Woman',
      'Batman','Joker','Spiderman','Superman','Shrek','Fiona','James Bond','Rocky Balboa',
      'Marty McFly','Doc Brown','Jack Sparrow','Elsa','Anna','Simba','Scar','Mufasa'
    ],
  },
  {
    id: 2,
    name: 'Series',
    icon: '📺',
    description: 'Personajes de TV y streaming',
    characters: [
      'Walter White','Jesse Pinkman','Saul Goodman','Daenerys Targaryen','Jon Snow','Arya Stark',
      'Cersei Lannister','Michael Scott','Dwight Schrute','Jim Halpert','Rachel Green','Ross Geller',
      'Sheldon Cooper','Eleven','Rick Grimes','Daryl Dixon','The Mandalorian','Grogu','Ted Lasso',
      'Loki','Wanda Maximoff','Vision','Homer Simpson','Bart Simpson','Lisa Simpson'
    ],
  },
  {
    id: 3,
    name: 'Videojuegos',
    icon: '🎮',
    description: 'Héroes y villanos gamer',
    characters: [
      'Mario','Luigi','Peach','Bowser','Link','Zelda','Kratos','Master Chief','Lara Croft',
      'Geralt de Rivia','Triss Merigold','Arthur Morgan','John Marston','Solid Snake','Pikachu',
      'Donkey Kong','Sonic','Tails','Kirby','Samus Aran','Ryu','Chun-Li'
    ],
  },
];

export default function LocalGame() {
  const router = useRouter();
  const [gameState, setGameState] = useState('config'); // config, setup, round_intro, waiting, playing, finished
  const [numPlayers, setNumPlayers] = useState('4');
  const [gameMode, setGameMode] = useState('teams'); // teams | pairs
  const [charactersPerPlayer, setCharactersPerPlayer] = useState('2');
  const [timePerRound, setTimePerRound] = useState('60');
  const [players, setPlayers] = useState([]);
  const [usePresetCategory, setUsePresetCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [catError, setCatError] = useState('');
  const [maxCharacters, setMaxCharacters] = useState('');
  const [gamePool, setGamePool] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(1);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [playerName, setPlayerName] = useState('');
  const [playerCharacters, setPlayerCharacters] = useState(['', '']);
  const [round, setRound] = useState(1);
  const [currentTeam, setCurrentTeam] = useState(1);
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const [roundCharacters, setRoundCharacters] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const timerRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [globalPlayerIndex, setGlobalPlayerIndex] = useState(0);
  const [scores, setScores] = useState({ round1: {}, round2: {}, round3: {} });
  const [playerStats, setPlayerStats] = useState({});
  const [blockedCharacters, setBlockedCharacters] = useState([]);
  const [isCardPressed, setIsCardPressed] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editPlayerName, setEditPlayerName] = useState('');
  const [editPlayerTeam, setEditPlayerTeam] = useState(1);
  const [editPlayerCharacters, setEditPlayerCharacters] = useState([]);
  const cardFlipAnimation = useRef(new Animated.Value(0)).current;

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    setPlayerCharacters(Array(parseInt(charactersPerPlayer) || 2).fill(''));
  }, [charactersPerPlayer]);

  const inflateCategory = (cat) => {
    // No inflar con personajes genéricos - solo usar los que realmente existen
    // Si no tiene personajes, dejarlos como array vacío para que se carguen desde la API
    const characters = cat.characters && cat.characters.length ? cat.characters : [];
    const characterCount = cat.characterCount || characters.length || 0;
    return { ...cat, characters, characterCount };
  };

  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      setCatError('');
      try {
        const data = await api.getCategories();
        if (Array.isArray(data) && data.length) {
          const mapped = data.map((c, idx) => ({
            id: c.id || idx + 1,
            name: c.name || 'Categoría',
            icon: c.icon || '📚',
            description: c.description || '',
            characters: c.characters || [],
            characterCount: c.characterCount || (c.characters ? c.characters.length : 0) || 0,
          })).map(inflateCategory);
          setCategories(mapped);
        } else {
          setCategories(FALLBACK_CATEGORIES.map(inflateCategory));
        }
      } catch (e) {
        setCatError('No se pudieron cargar categorías, usando lista local.');
        setCategories(FALLBACK_CATEGORIES.map(inflateCategory));
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    if (gameState === 'playing' && !isPaused && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, isPaused, timeLeft]);

  useEffect(() => {
    if (gameState === 'playing') {
      if ((!currentCharacter || blockedCharacters.includes(currentCharacter)) && roundCharacters.length > 0) {
        const availableChars = roundCharacters.filter(c => !blockedCharacters.includes(c));
        if (availableChars.length > 0) {
          const newChar = pickRandomCharacter(roundCharacters, blockedCharacters);
          setCurrentCharacter(newChar);
        } else {
          handleTimeUp();
        }
      }
    }
  }, [gameState, currentCharacter, blockedCharacters, roundCharacters]);

  const availableAvatars = useMemo(
    () => AVATARS.filter((a) => !players.some((p) => p.avatar === a)),
    [players]
  );

  const totalCharactersNeeded = (parseInt(numPlayers) || 0) * (parseInt(charactersPerPlayer) || 2);
  const [selectedCategoryCharacters, setSelectedCategoryCharacters] = useState([]);

  useEffect(() => {
    const loadCategoryCharacters = async () => {
      if (selectedCategory && usePresetCategory) {
        // Si es una categoría de FALLBACK, usar sus personajes directamente
        const fallback = FALLBACK_CATEGORIES.find(c => c.id === selectedCategory.id || c.name === selectedCategory.name);
        if (fallback?.characters?.length) {
          setSelectedCategoryCharacters(fallback.characters);
          return;
        }
        // NO usar selectedCategory.characters directamente porque pueden ser genéricos
        // Siempre intentar cargar desde la API primero
        // Si tiene ID, obtener los personajes reales de la API
        if (selectedCategory.id) {
          try {
            const categoryData = await api.getCategory(selectedCategory.id);
            if (categoryData.characters && Array.isArray(categoryData.characters) && categoryData.characters.length > 0) {
              console.log(`[LocalGame] Loaded ${categoryData.characters.length} characters for category ${selectedCategory.name}`);
              setSelectedCategoryCharacters(categoryData.characters);
            } else {
              console.warn(`[LocalGame] Category ${selectedCategory.name} has no characters array`);
              // Fallback a FALLBACK_CATEGORIES si no hay personajes en la API
              const fallbackCat = FALLBACK_CATEGORIES.find(c => c.name === selectedCategory.name);
              if (fallbackCat?.characters?.length) {
                console.log(`[LocalGame] Using fallback category for ${selectedCategory.name}`);
                setSelectedCategoryCharacters(fallbackCat.characters);
              } else {
                setSelectedCategoryCharacters([]);
              }
            }
          } catch (e) {
            console.error('Error loading category characters:', e);
            // Fallback a FALLBACK_CATEGORIES si falla la API
            const fallbackCat = FALLBACK_CATEGORIES.find(c => c.name === selectedCategory.name);
            if (fallbackCat?.characters?.length) {
              console.log(`[LocalGame] Using fallback category for ${selectedCategory.name}`);
              setSelectedCategoryCharacters(fallbackCat.characters);
            } else {
              setSelectedCategoryCharacters([]);
            }
          }
        } else {
          setSelectedCategoryCharacters([]);
        }
      } else {
        setSelectedCategoryCharacters([]);
      }
    };
    loadCategoryCharacters();
  }, [selectedCategory?.id, selectedCategory?.name, usePresetCategory]);

  const selectedCategoryPool = useMemo(() => {
    if (!usePresetCategory || !selectedCategory) return [];
    // SIEMPRE priorizar personajes cargados desde la API o desde selectedCategoryCharacters
    // Este es el único lugar donde deberían venir los personajes reales
    if (selectedCategoryCharacters.length > 0) {
      return selectedCategoryCharacters;
    }
    // Si es una categoría de FALLBACK (tiene ID que coincide con FALLBACK_CATEGORIES), usar sus personajes
    const fallback = FALLBACK_CATEGORIES.find(c => 
      c.id === selectedCategory.id || 
      c.name === selectedCategory.name || 
      c.name.toLowerCase() === selectedCategory.name?.toLowerCase()
    );
    if (fallback?.characters?.length) {
      return fallback.characters;
    }
    // NO usar selectedCategory.characters aquí porque pueden ser genéricos "Personaje X"
    // Devolver array vacío y esperar a que se carguen desde la API
    return [];
  }, [selectedCategory, selectedCategoryCharacters, usePresetCategory]);

  const availablePoolCount = useMemo(() => {
    if (!usePresetCategory) {
      return players.flatMap((p) => p.characters).length;
    }
    const base = selectedCategoryPool.length;
    const limit = maxCharacters ? parseInt(maxCharacters) || 0 : base;
    return Math.min(base, limit || base);
  }, [usePresetCategory, selectedCategoryPool, maxCharacters, players]);

  const getNumTeams = () => {
    const n = parseInt(numPlayers) || 4;
    if (gameMode === 'pairs') return Math.max(1, Math.ceil(n / 2));
    return 2;
  };

  const isTeamFull = (teamNum) => {
    const count = players.filter((p) => p.team === teamNum).length;
    const maxPerTeam = gameMode === 'pairs' ? 2 : Math.ceil((parseInt(numPlayers) || 4) / 2);
    return count >= maxPerTeam;
  };

  const addPlayer = () => {
    const num = parseInt(numPlayers) || 0;
    if (players.length >= num) {
      Alert.alert('Límite alcanzado', `Ya hay ${num} jugadores.`);
      return;
    }
    if (!playerName.trim()) {
      Alert.alert('Falta nombre', 'Ingresa el nombre del jugador');
      return;
    }
    const charsPer = parseInt(charactersPerPlayer) || 2;
    const trimmed = usePresetCategory
      ? []
      : playerCharacters.map((c) => c.trim()).filter(Boolean);
    if (!usePresetCategory) {
      if (trimmed.length !== charsPer) {
        Alert.alert('Faltan personajes', `Necesitas ${charsPer} personajes.`);
        return;
      }
      const dup = new Set(trimmed);
      if (dup.size !== trimmed.length) {
        Alert.alert('Personajes repetidos', 'Los personajes deben ser diferentes');
        return;
      }
    }
    if (isTeamFull(selectedTeam)) {
      Alert.alert('Equipo lleno', `El ${gameMode === 'pairs' ? 'pareja' : 'equipo'} ${selectedTeam} está completo`);
      return;
    }
    const newPlayer = {
      id: Date.now(),
      name: playerName.trim(),
      team: selectedTeam,
      avatar: selectedAvatar,
      characters: trimmed,
    };
    setPlayers((prev) => [...prev, newPlayer]);
    setPlayerName('');
    setPlayerCharacters(Array(charsPer).fill(''));
    const nextAvatar = availableAvatars[0] || AVATARS[0];
    setSelectedAvatar(nextAvatar);
  };

  const startGame = () => {
    const num = parseInt(numPlayers) || 0;
    const charsPer = parseInt(charactersPerPlayer) || 2;
    if (players.length < num) {
      Alert.alert('Jugadores insuficientes', `Necesitas ${num} jugadores.`);
      return;
    }
    const needed = num * charsPer;
    let pool = usePresetCategory ? selectedCategoryPool.slice(0) : players.flatMap((p) => p.characters);
    pool = shuffleArray(pool);

    const desired = maxCharacters ? parseInt(maxCharacters) || 0 : needed;
    if (desired < needed) {
      Alert.alert('Límite insuficiente', `Necesitas al menos ${needed} personajes para esta partida.`);
      return;
    }

    // Fallback si la categoría no tiene suficientes
    if (pool.length < desired) {
      const fallback = FALLBACK_CATEGORIES.find((c) => c.characters.length >= desired);
      if (fallback && usePresetCategory) {
        setSelectedCategory(fallback);
        pool = fallback.characters.slice(0);
        Alert.alert('Personajes insuficientes', `La categoría seleccionada no tiene suficientes personajes. Se usará "${fallback.name}".`);
      }
    }

    if (pool.length < desired) {
      Alert.alert('Personajes insuficientes', `Necesitas ${desired} personajes. Solo hay ${pool.length}.`);
      return;
    }

    const sliced = pool.slice(0, desired);
    setGamePool(sliced);
    setRoundCharacters(sliced);
    setCurrentCharacter(pickRandomCharacter(sliced, []));
    setRound(1);
    setCurrentTeam(1);
    setGlobalPlayerIndex(0);
    setTimeLeft(parseInt(timePerRound) || 60);
    setScores(initializeScores());
    setPlayerStats({});
    setBlockedCharacters([]);
    setGameState('round_intro');
    setIsPaused(true);
  };

  const initializeScores = () => {
    const teams = getNumTeams();
    const base = { round1: {}, round2: {}, round3: {} };
    for (let i = 1; i <= teams; i += 1) {
      base.round1[`team${i}`] = 0;
      base.round2[`team${i}`] = 0;
      base.round3[`team${i}`] = 0;
    }
    return base;
  };

  const pickRandomCharacter = (list, blocked = []) => {
    const pool = list.filter((c) => !blocked.includes(c));
    if (!pool.length) return null;
    const idx = Math.floor(Math.random() * pool.length);
    return pool[idx];
  };

  const getPlayersByTeamOrder = () => {
    const teams = Array.from({ length: getNumTeams() }, (_, i) => i + 1);
    return teams.map((team) => players.filter((p) => p.team === team));
  };

  const getCurrentTurn = (index) => {
    const teams = getPlayersByTeamOrder();
    const teamCount = teams.length;
    if (teamCount === 0) return null;
    const teamIndex = index % teamCount;
    const playerPos = Math.floor(index / teamCount);
    const teamPlayers = teams[teamIndex];
    if (!teamPlayers.length) return null;
    const player = teamPlayers[playerPos % teamPlayers.length];
    return { player, team: teamIndex + 1 };
  };

  const handlePlayerReady = () => {
    setIsPaused(false);
    setGameState('playing');
  };

  const advanceTurn = () => {
    const nextIndex = globalPlayerIndex + 1;
    const turn = getCurrentTurn(nextIndex) || getCurrentTurn(0);
    setGlobalPlayerIndex(turn ? nextIndex % (players.length) : 0);
    setCurrentTeam(turn?.team || 1);
    setBlockedCharacters([]);
    setTimeLeft(parseInt(timePerRound) || 60);
    setGameState('waiting');
    setIsPaused(true);
  };

  const handleHit = () => {
    setIsCardPressed(false);
    const turn = getCurrentTurn(globalPlayerIndex);
    if (!turn || !currentCharacter) return;
    const roundKey = `round${round}`;
    const teamKey = `team${turn.team}`;
    setScores((prev) => ({
      ...prev,
      [roundKey]: {
        ...prev[roundKey],
        [teamKey]: (prev[roundKey][teamKey] || 0) + 1,
      },
    }));
    setPlayerStats((prev) => ({
      ...prev,
      [turn.player.id]: {
        hits: (prev[turn.player.id]?.hits || 0) + 1,
        fails: prev[turn.player.id]?.fails || 0,
      },
    }));
    const remaining = roundCharacters.filter((c) => c !== currentCharacter);
    if (!remaining.length) {
      if (round < 3) {
        const reshuffled = shuffleArray(gamePool);
        setRound(round + 1);
        setRoundCharacters(reshuffled);
        setCurrentCharacter(pickRandomCharacter(reshuffled, []));
        setBlockedCharacters([]);
        // NO resetear timeLeft aquí - se preserva el tiempo restante del turno
        setGameState('round_intro_mid_turn');
        setIsPaused(true);
        return;
      }
      setGameState('finished');
      setIsPaused(true);
      return;
    }
    setRoundCharacters(remaining);
    setCurrentCharacter(pickRandomCharacter(remaining, blockedCharacters));
  };

  const handleFail = () => {
    const turn = getCurrentTurn(globalPlayerIndex);
    if (turn) {
      setPlayerStats((prev) => ({
        ...prev,
        [turn.player.id]: {
          hits: prev[turn.player.id]?.hits || 0,
          fails: (prev[turn.player.id]?.fails || 0) + 1,
        },
      }));
    }
    if (currentCharacter) {
      setBlockedCharacters((prev) => [...prev, currentCharacter]);
    }
    handleTimeUp();
  };

  const handleTimeUp = () => {
    advanceTurn();
  };

  const capitalize = (text) => {
    return text.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const startEditPlayer = (player) => {
    setEditingPlayer(player);
    setEditPlayerName(player.name);
    setEditPlayerTeam(player.team);
    setEditPlayerCharacters([...player.characters]);
  };

  const cancelEditPlayer = () => {
    setEditingPlayer(null);
    setEditPlayerName('');
    setEditPlayerTeam(1);
    setEditPlayerCharacters([]);
  };

  const saveEditPlayer = () => {
    if (!editingPlayer) return;
    const trimmedName = editPlayerName.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }
    const charsPer = parseInt(charactersPerPlayer) || 2;
    const trimmedChars = usePresetCategory ? [] : editPlayerCharacters.map(c => c.trim()).filter(c => c);
    if (!usePresetCategory && trimmedChars.length !== charsPer) {
      Alert.alert('Error', `Necesitas ${charsPer} personajes.`);
      return;
    }
    if (editPlayerTeam !== editingPlayer.team) {
      const targetTeamPlayers = players.filter(p => p.team === editPlayerTeam && p.id !== editingPlayer.id);
      const maxPerTeam = gameMode === 'pairs' ? 2 : Math.ceil((parseInt(numPlayers) || 4) / 2);
      if (targetTeamPlayers.length >= maxPerTeam) {
        Alert.alert('Equipo lleno', `El ${gameMode === 'pairs' ? 'pareja' : 'equipo'} ${editPlayerTeam} está lleno`);
        return;
      }
    }
    const updatedPlayers = players.map(p => {
      if (p.id === editingPlayer.id) {
        return { ...p, name: trimmedName, team: editPlayerTeam, characters: trimmedChars };
      }
      return p;
    });
    setPlayers(updatedPlayers);
    cancelEditPlayer();
  };

  const deletePlayer = (playerId) => {
    Alert.alert(
      'Eliminar jugador',
      '¿Estás seguro de que quieres eliminar este jugador?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const updatedPlayers = players.filter(p => p.id !== playerId);
            setPlayers(updatedPlayers);
            if (editingPlayer?.id === playerId) {
              cancelEditPlayer();
            }
          },
        },
      ]
    );
  };

  const handleEditCharacterChange = (index, value) => {
    const newChars = [...editPlayerCharacters];
    newChars[index] = value;
    setEditPlayerCharacters(newChars);
  };

  const getCurrentPlayer = () => {
    const turn = getCurrentTurn(globalPlayerIndex);
    return turn?.player || null;
  };

  const getTotalScore = (team) => {
    const round1Score = scores.round1[`team${team}`] || 0;
    const round2Score = scores.round2[`team${team}`] || 0;
    const round3Score = scores.round3[`team${team}`] || 0;
    return round1Score + round2Score + round3Score;
  };

  const getMVP = () => {
    let maxHits = 0;
    let mvpId = null;
    Object.entries(playerStats).forEach(([id, stats]) => {
      if (stats.hits > maxHits) {
        maxHits = stats.hits;
        mvpId = parseInt(id);
      }
    });
    return mvpId;
  };

  const isPlayerMVP = (playerId) => {
    const mvpId = getMVP();
    if (mvpId === null) return false;
    const mvpStats = playerStats[mvpId];
    if (!mvpStats || mvpStats.hits === 0) return false;
    return playerId === mvpId;
  };

  const getPlayerStats = (playerId) => {
    return playerStats[playerId] || { hits: 0, fails: 0 };
  };

  const getPlayerRanking = () => {
    return [...players].sort((a, b) => {
      const statsA = getPlayerStats(a.id);
      const statsB = getPlayerStats(b.id);
      return statsB.hits - statsA.hits;
    });
  };

  const resetGame = () => {
    setGameState('config');
    setPlayers([]);
    setPlayerName('');
    setPlayerCharacters(Array(parseInt(charactersPerPlayer) || 2).fill(''));
    setRound(1);
    setCurrentTeam(1);
    setCurrentCharacter(null);
    setRoundCharacters([]);
    setTimeLeft(parseInt(timePerRound) || 60);
    setScores(initializeScores());
    setPlayerStats({});
    setBlockedCharacters([]);
    setGlobalPlayerIndex(0);
    setIsPaused(true);
    setIsCardPressed(false);
    cancelEditPlayer();
  };

  const playAgain = () => {
    const reshuffled = shuffleArray(gamePool);
    setRoundCharacters(reshuffled);
    setCurrentCharacter(pickRandomCharacter(reshuffled, []));
    setRound(1);
    setCurrentTeam(1);
    setGlobalPlayerIndex(0);
    setTimeLeft(parseInt(timePerRound) || 60);
    setScores(initializeScores());
    setPlayerStats({});
    setBlockedCharacters([]);
    setGameState('round_intro');
    setIsPaused(true);
    setIsCardPressed(false);
  };

  const cardChangeAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isCardPressed) {
      Animated.timing(cardFlipAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(cardFlipAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isCardPressed]);

  useEffect(() => {
    if (gameState === 'playing' && currentCharacter) {
      // Animar el cambio de personaje con efecto slice
      cardChangeAnimation.setValue(0);
      Animated.timing(cardChangeAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [currentCharacter, gameState]);

  const currentTurn = getCurrentTurn(globalPlayerIndex);

  const renderHeader = (title = 'Juego Local') => (
    <View style={styles.header}>
      <View style={styles.headerTitleContainer}>
        <Image source={require('../assets/img/logo-personajes.png')} style={styles.logo} />
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      <Button
        title="Volver"
        onPress={() => router.back()}
        variant="secondary"
        size="small"
        style={{ minWidth: 130 }}
      />
    </View>
  );

  const renderConfig = () => (
    <>
      {renderHeader('Juego Local')}
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Card style={{ marginBottom: 16 }}>
          <Text style={styles.sectionTitle}>Configurar partida</Text>
          <Input
            label="Número de jugadores"
            value={numPlayers}
            onChangeText={(v) => setNumPlayers(v.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
          />
          <Text style={styles.helper}>Total de personajes: {totalCharactersNeeded}</Text>

          <Text style={styles.label}>Modo de juego</Text>
          <View style={styles.optionRow}>
            <TouchableOpacity
              style={[styles.optionBtn, gameMode === 'teams' && styles.optionActive]}
              onPress={() => setGameMode('teams')}
            >
              <Text style={[styles.optionText, gameMode === 'teams' && styles.optionTextActive]}>Equipos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionBtn, gameMode === 'pairs' && styles.optionActive]}
              onPress={() => setGameMode('pairs')}
            >
              <Text style={[styles.optionText, gameMode === 'pairs' && styles.optionTextActive]}>Parejas</Text>
            </TouchableOpacity>
          </View>

          <Input
            label="Personajes por jugador"
            value={charactersPerPlayer}
            onChangeText={(v) => setCharactersPerPlayer(v.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Tiempo por ronda</Text>
          <View style={styles.timeRow}>
            {timeOptions.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.timeChip, timePerRound === t.toString() && styles.timeChipActive]}
                onPress={() => setTimePerRound(t.toString())}
              >
                <Text style={[styles.timeText, timePerRound === t.toString() && styles.timeTextActive]}>{t}s</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Categoría de personajes</Text>
          <View style={styles.optionRow}>
            <TouchableOpacity
              style={[styles.optionBtn, !usePresetCategory && styles.optionActive]}
              onPress={() => {
                setUsePresetCategory(false);
                setSelectedCategory(null);
              }}
            >
              <Text style={[styles.optionText, !usePresetCategory && styles.optionTextActive]}>Manual</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionBtn, usePresetCategory && styles.optionActive]}
              onPress={() => setUsePresetCategory(true)}
            >
              <Text style={[styles.optionText, usePresetCategory && styles.optionTextActive]}>Predefinida</Text>
            </TouchableOpacity>
          </View>

          {usePresetCategory ? (
            <View style={styles.categoriesGrid}>
              {loadingCategories ? (
                <Text style={styles.helperCentered}>Cargando categorías...</Text>
              ) : (
                categories.map((cat) => {
                  const selected = selectedCategory?.id === cat.id;
                  const count = cat.characterCount || (cat.characters ? cat.characters.length : 0);
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryCard, selected && styles.categoryCardActive]}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      <Text style={styles.categoryIcon}>{cat.icon}</Text>
                      <Text style={styles.categoryName}>{cat.name}</Text>
                      <Text style={styles.categoryDesc}>{cat.description}</Text>
                      <Text style={styles.categoryCount}>{count} personajes</Text>
                      {selected && <Text style={styles.categoryBadge}>Seleccionada</Text>}
                    </TouchableOpacity>
                  );
                })
              )}
              {catError ? <Text style={styles.helperSmall}>{catError}</Text> : null}
              <Input
                label="Límite de personajes (opcional)"
                value={maxCharacters}
                onChangeText={(v) => setMaxCharacters(v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                placeholder="Ej: 20"
              />
              <Text style={styles.helperSmall}>
                Necesarios para esta partida: {parseInt(numPlayers || '0') * (parseInt(charactersPerPlayer || '0') || 0)}
              </Text>
            </View>
          ) : (
            <Text style={styles.helper}>Los jugadores ingresarán sus propios personajes.</Text>
          )}

          <Button
            title="Continuar"
            onPress={() => setGameState('setup')}
            size="large"
            style={{ marginTop: 12 }}
            disabled={usePresetCategory && !selectedCategory}
          />
        </Card>
      </ScrollView>
    </>
  );

  const renderSetup = () => (
    <>
      {renderHeader('Agregar jugadores')}
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/** resumen superior **/}
        <Card style={{ marginBottom: 16 }}>
          <Text style={styles.sectionTitle}>Jugador</Text>
          <Text style={styles.helper}>
            Jugadores: {players.length}/{numPlayers} • Personajes: {usePresetCategory ? availablePoolCount : players.flatMap((p) => p.characters).length}/{usePresetCategory ? Math.max(availablePoolCount, totalCharactersNeeded) : totalCharactersNeeded}
          </Text>
          {usePresetCategory && selectedCategory && selectedCategoryPool.length < (parseInt(numPlayers) || 0) * (parseInt(charactersPerPlayer) || 2) ? (
            <Text style={[styles.helperSmall, { color: theme.colors.warning }]}>
              Esta categoría no tiene suficientes personajes; al iniciar se usará una categoría local con más personajes.
            </Text>
          ) : null}
          {usePresetCategory && selectedCategory && (
            <View style={styles.selectedCatBanner}>
              <Text style={styles.helperSmall}>{selectedCategory.icon} {selectedCategory.name}</Text>
              <Text style={styles.helperSmall}>{availablePoolCount} personajes disponibles</Text>
            </View>
          )}
        </Card>

        {/** lógica de disponibilidad **/}
        {(() => {
          const num = parseInt(numPlayers) || 0;
          const charsPer = parseInt(charactersPerPlayer) || 2;
          const needed = num * charsPer;
          const currentPool = usePresetCategory ? availablePoolCount : players.flatMap((p) => p.characters).length;
          const playersFull = players.length >= num;
          const poolReady = currentPool >= needed;
          const ready = playersFull && poolReady;
          console.log('[LocalGame][setup] ready check', {
            numPlayers: num,
            charsPer,
            needed,
            players: players.length,
            currentPool,
            playersFull,
            poolReady,
            ready,
            usePresetCategory,
            maxCharacters,
          });

          if (!ready) {
            return (
              <Card style={{ marginBottom: 16 }}>
                <Text style={styles.sectionTitle}>{gameMode === 'pairs' ? 'Pareja' : 'Equipo'}</Text>
                <View style={styles.teamRow}>
                  {Array.from({ length: getNumTeams() }, (_, i) => i + 1).map((team) => {
                    const full = isTeamFull(team);
                    return (
                      <TouchableOpacity
                        key={team}
                        style={[
                          styles.teamBtn,
                          selectedTeam === team && styles.teamBtnActive,
                          full && styles.teamBtnDisabled,
                        ]}
                        disabled={full}
                        onPress={() => setSelectedTeam(team)}
                      >
                        <Text style={[styles.teamText, selectedTeam === team && styles.teamTextActive]}>
                          {gameMode === 'pairs' ? `Pareja ${team}` : `Equipo ${team}`}
                        </Text>
                        <Text style={styles.helperSmall}>
                          {players.filter((p) => p.team === team).length}/
                          {gameMode === 'pairs' ? 2 : Math.ceil((parseInt(numPlayers) || 4) / 2)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.label}>Avatar</Text>
                <View style={styles.avatarGrid}>
                  {(availableAvatars.length ? availableAvatars : AVATARS).slice(0, 9).map((av) => (
                    <TouchableOpacity
                      key={av}
                      style={[
                        styles.avatarChip,
                        selectedAvatar === av && styles.avatarChipActive,
                      ]}
                      onPress={() => setSelectedAvatar(av)}
                    >
                      <Text style={styles.avatarText}>{av}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Input label="Nombre del jugador" value={playerName} onChangeText={setPlayerName} />
                {!usePresetCategory && Array(parseInt(charactersPerPlayer) || 2)
                  .fill(0)
                  .map((_, idx) => (
                    <Input
                      key={idx}
                      placeholder={`Personaje ${idx + 1}`}
                      value={playerCharacters[idx] || ''}
                      onChangeText={(v) => {
                        const arr = [...playerCharacters];
                        arr[idx] = v;
                        setPlayerCharacters(arr);
                      }}
                    />
                  ))}

                <Button title="Agregar jugador" onPress={addPlayer} style={{ marginTop: 12, width: '100%' }} />
              </Card>
            );
          }

          return (
            <Card style={{ marginBottom: 16, alignItems: 'center', paddingVertical: 24 }}>
              <Text style={styles.mainTitle}>¡Todos los jugadores agregados!</Text>
              <Text style={styles.helperSmall}>{players.length} de {num} jugadores</Text>
              <View style={{ marginTop: 12, width: '100%' }}>
                <Button title="Iniciar juego" onPress={startGame} size="large" />
              </View>
            </Card>
          );
        })()}

        {players.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            {Array.from({ length: getNumTeams() }, (_, i) => i + 1).map((teamNum) => {
              const teamPlayers = players.filter(p => p.team === teamNum);
              const teamColors = [theme.colors.primary, theme.colors.secondary, theme.colors.warning, theme.colors.success, theme.colors.danger];
              const teamColor = teamColors[(teamNum - 1) % teamColors.length];
              return (
                <Card key={teamNum} style={{ marginBottom: 12 }}>
                  <Text style={[styles.sectionTitle, { color: teamColor }]}>
                    {gameMode === 'pairs' ? `Pareja ${teamNum}` : `Equipo ${teamNum}`}
                  </Text>
                  {teamPlayers.map((p) => (
                    <View key={p.id} style={styles.playerRow}>
                      <Text style={styles.playerAvatar}>{p.avatar}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.playerName}>{capitalize(p.name)}</Text>
                        <Text style={styles.helperSmall}>
                          {usePresetCategory ? 'Personajes predefinidos' : `${p.characters.length} personajes`}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => startEditPlayer(p)}
                          style={styles.editBtn}
                        >
                          <Text style={styles.editBtnText}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => deletePlayer(p.id)}
                          style={styles.deleteBtn}
                        >
                          <Text style={styles.deleteBtnText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                  {teamPlayers.length === 0 && (
                    <Text style={[styles.helperSmall, { textAlign: 'center', fontStyle: 'italic', paddingVertical: 8 }]}>Sin jugadores</Text>
                  )}
                </Card>
              );
            })}
          </View>
        )}

        {editingPlayer && (
          <Card style={{ marginBottom: 16, borderWidth: 2, borderColor: theme.colors.primary }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.sectionTitle}>✏️ Editar Jugador</Text>
              <TouchableOpacity
                onPress={cancelEditPlayer}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 48 }}>{editingPlayer.avatar}</Text>
            </View>
            <Input
              label="Nombre"
              value={editPlayerName}
              onChangeText={setEditPlayerName}
              placeholder="Nombre del jugador"
            />
            <Text style={styles.label}>{gameMode === 'pairs' ? 'Pareja' : 'Equipo'}</Text>
            <View style={styles.teamRow}>
              {Array.from({ length: getNumTeams() }, (_, i) => i + 1).map((teamNum) => {
                const teamPlayers = players.filter(p => p.team === teamNum && p.id !== editingPlayer.id);
                const maxPlayers = gameMode === 'pairs' ? 2 : Math.ceil((parseInt(numPlayers) || 4) / 2);
                const isFull = teamPlayers.length >= maxPlayers;
                return (
                  <TouchableOpacity
                    key={teamNum}
                    onPress={() => !isFull && setEditPlayerTeam(teamNum)}
                    disabled={isFull}
                    style={[
                      styles.editTeamBtn,
                      editPlayerTeam === teamNum && styles.editTeamBtnActive,
                      isFull && styles.editTeamBtnDisabled,
                    ]}
                  >
                    <Text style={[
                      styles.editTeamText,
                      editPlayerTeam === teamNum && styles.editTeamTextActive,
                      isFull && styles.editTeamTextDisabled,
                    ]}>
                      {gameMode === 'pairs' ? `Pareja ${teamNum}` : `Equipo ${teamNum}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {!usePresetCategory && (
              <>
                <Text style={styles.label}>Personajes</Text>
                {Array(parseInt(charactersPerPlayer) || 2).fill(0).map((_, index) => (
                  <Input
                    key={index}
                    placeholder={`Personaje ${index + 1}`}
                    value={editPlayerCharacters[index] || ''}
                    onChangeText={(value) => handleEditCharacterChange(index, value)}
                  />
                ))}
              </>
            )}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <Button
                title="Cancelar"
                onPress={cancelEditPlayer}
                variant="secondary"
                style={{ flex: 1 }}
              />
              <Button
                title="Guardar"
                onPress={saveEditPlayer}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        )}

        {(() => {
          const num = parseInt(numPlayers || '0');
          const charsPer = parseInt(charactersPerPlayer || '0') || 0;
          const needed = num * charsPer;
          const currentPool = usePresetCategory ? availablePoolCount : players.flatMap((p) => p.characters).length;
          const ready = players.length >= num && currentPool >= needed;
          console.log('[LocalGame][startButton] ready', { num, charsPer, needed, currentPool, players: players.length, ready });
          if (!ready) return null;
          return (
            <Button title="Iniciar juego" onPress={startGame} size="large" />
          );
        })()}
      </ScrollView>
    </>
  );

  const renderRoundIntro = () => {
    const roundInfo = roundDetails[round];
    const numTeams = getNumTeams();
    return (
      <>
        {renderHeader(`Ronda ${round}`)}
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View style={[styles.roundBadge, { backgroundColor: theme.colors.primary, marginBottom: 12 }]}>
              <Text style={styles.roundBadgeText}>RONDA {round}</Text>
            </View>
            <Text style={{ fontSize: 56, marginBottom: 8 }}>{roundInfo.icon}</Text>
            <Text style={[styles.mainTitle, { marginBottom: 4 }]}>{roundInfo.title}</Text>
            <Text style={[styles.helperCentered, { fontSize: 16, lineHeight: 22, marginBottom: 16 }]}>{roundInfo.description}</Text>
            <Card style={{ width: '100%', marginBottom: 16, paddingVertical: 12 }}>
              {roundInfo.tips.map((tip, index) => (
                <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: index < roundInfo.tips.length - 1 ? 8 : 0 }}>
                  <Text style={{ color: theme.colors.primary, fontSize: 16, marginRight: 10, fontFamily: 'Truculenta-Bold' }}>•</Text>
                  <Text style={{ color: theme.colors.text, fontSize: 14, flex: 1, lineHeight: 20 }}>{tip}</Text>
                </View>
              ))}
            </Card>
            {round > 1 && numTeams > 0 && (
              <View style={{ alignItems: 'center', marginTop: 4 }}>
                <Text style={[styles.helperSmall, { textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontSize: 11 }]}>Puntuación actual</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                  {Array.from({ length: numTeams }, (_, i) => i + 1).map((teamNum) => {
                    const teamScore = getTotalScore(teamNum);
                    const teamColors = [theme.colors.primary, theme.colors.secondary, theme.colors.warning, theme.colors.success, theme.colors.danger];
                    const teamColor = teamColors[(teamNum - 1) % teamColors.length];
                    return (
                      <View key={teamNum} style={{ alignItems: 'center' }}>
                        <Text style={{ color: teamColor, fontSize: 11, fontFamily: 'Truculenta-Bold' }}>
                          {gameMode === 'pairs' ? `Pareja ${teamNum}` : `Equipo ${teamNum}`}
                        </Text>
                        <Text style={{ color: theme.colors.text, fontSize: 24, fontFamily: 'Truculenta-Bold' }}>{teamScore}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
          <Button
            title="¡Comenzar Ronda!"
            onPress={() => setGameState('waiting')}
            size="large"
          />
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Salir del Juego',
                '¿Estás seguro de que quieres salir del juego? Se perderá el progreso actual.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Salir', style: 'destructive', onPress: () => resetGame() && router.back() },
                ]
              );
            }}
            style={{ marginTop: 8, padding: 8 }}
          >
            <Text style={[styles.helperCentered, { fontSize: 14 }]}>🚪 Salir del Juego</Text>
          </TouchableOpacity>
        </ScrollView>
      </>
    );
  };

  const renderRoundIntroMidTurn = () => {
    const roundInfo = roundDetails[round];
    const currentPlayer = getCurrentPlayer();
    return (
      <>
        {renderHeader(`Ronda ${round}`)}
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Card style={{ marginBottom: 10, paddingVertical: 8 }}>
              <Text style={[styles.helperCentered, { color: theme.colors.warning, fontSize: 16, fontFamily: 'Truculenta-Bold' }]}>⏱️ {timeLeft}s restantes</Text>
            </Card>
            <View style={[styles.roundBadge, { backgroundColor: theme.colors.warning, marginBottom: 12 }]}>
              <Text style={styles.roundBadgeText}>¡NUEVA RONDA!</Text>
            </View>
            <Text style={{ fontSize: 56, marginBottom: 8 }}>{roundInfo.icon}</Text>
            <Text style={[styles.mainTitle, { marginBottom: 4 }]}>RONDA {round}: {roundInfo.title}</Text>
            <Text style={[styles.helperCentered, { fontSize: 16, lineHeight: 22, marginBottom: 16 }]}>{roundInfo.description}</Text>
            <Card style={{ width: '100%', alignItems: 'center', paddingVertical: 12 }}>
              <Text style={[styles.helperSmall, { marginBottom: 6, fontSize: 11 }]}>Sigues jugando:</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 32 }}>{currentPlayer?.avatar}</Text>
                <Text style={{ color: theme.colors.text, fontSize: 20, fontFamily: 'Truculenta-Bold' }}>
                  {currentPlayer ? capitalize(currentPlayer.name) : ''}
                </Text>
              </View>
            </Card>
          </View>
          <Button
            title="¡Continuar!"
            onPress={() => {
              setIsCardPressed(false);
              setIsPaused(false);
              setGameState('playing');
            }}
            size="large"
          />
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Salir del Juego',
                '¿Estás seguro de que quieres salir del juego? Se perderá el progreso actual.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Salir', style: 'destructive', onPress: () => resetGame() && router.back() },
                ]
              );
            }}
            style={{ marginTop: 8, padding: 8 }}
          >
            <Text style={[styles.helperCentered, { fontSize: 14 }]}>🚪 Salir del Juego</Text>
          </TouchableOpacity>
        </ScrollView>
      </>
    );
  };

  const renderWaiting = () => {
    const next = currentTurn?.player;
    const numTeams = getNumTeams();
    const teamColors = [theme.colors.primary, theme.colors.secondary, theme.colors.warning, theme.colors.success, theme.colors.danger];
    const teamColor = teamColors[(currentTeam - 1) % teamColors.length];
    return (
      <>
        {renderHeader(`Ronda ${round}`)}
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <Card style={{ marginBottom: 12, alignItems: 'center', paddingVertical: 16 }}>
            <Text style={{ color: theme.colors.primary, fontSize: 16, fontFamily: 'Truculenta-Bold', marginBottom: 2 }}>Ronda {round}</Text>
            <Text style={[styles.helperCentered, { fontSize: 13, marginBottom: 10 }]}>{roundRules[round]}</Text>
            <View style={{ width: '100%', height: 1, backgroundColor: theme.colors.border, marginBottom: 10 }} />
            <Text style={[styles.helperSmall, { marginBottom: 6, fontSize: 12 }]}>Siguiente turno:</Text>
            <View style={{ position: 'relative', alignItems: 'center' }}>
              {next && isPlayerMVP(next.id) && (
                <Text style={{ position: 'absolute', top: -16, fontSize: 24, zIndex: 1 }}>👑</Text>
              )}
              <Text style={{ fontSize: 48, marginBottom: 4 }}>{next?.avatar}</Text>
            </View>
            <Text style={[styles.mainTitle, { fontSize: 28, marginBottom: 2 }]}>{next ? capitalize(next.name) : ''}</Text>
            {next && (
              <Text style={[styles.helperSmall, { marginBottom: 8, fontSize: 11 }]}>
                ✓ {getPlayerStats(next.id).hits} aciertos • ✗ {getPlayerStats(next.id).fails} fallos
              </Text>
            )}
            <View style={{ backgroundColor: teamColor, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, marginBottom: 12 }}>
              <Text style={{ color: theme.colors.text, fontSize: 14, fontFamily: 'Truculenta-Bold' }}>
                {gameMode === 'pairs' ? `Pareja ${currentTeam}` : `Equipo ${currentTeam}`}
              </Text>
            </View>
            {numTeams > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 12, justifyContent: 'center' }}>
                {Array.from({ length: numTeams }, (_, i) => i + 1).map((teamNum) => {
                  const teamScore = getTotalScore(teamNum);
                  const tColor = teamColors[(teamNum - 1) % teamColors.length];
                  return (
                    <View key={teamNum} style={{ alignItems: 'center' }}>
                      <Text style={{ color: tColor, fontSize: 11, fontFamily: 'Truculenta-Bold' }}>
                        {gameMode === 'pairs' ? `Pareja ${teamNum}` : `Equipo ${teamNum}`}
                      </Text>
                      <Text style={{ color: theme.colors.text, fontSize: 22, fontFamily: 'Truculenta-Bold' }}>{teamScore}</Text>
                    </View>
                  );
                })}
              </View>
            )}
            <Text style={[styles.helperCentered, { fontSize: 12, fontStyle: 'italic', marginTop: 12, marginBottom: 8 }]}>
              Pasa el dispositivo a {next?.name}
            </Text>
            <Button title="¡Estoy Listo!" onPress={handlePlayerReady} size="large" style={{ width: '100%' }} />
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Salir del Juego',
                  '¿Estás seguro de que quieres salir del juego? Se perderá el progreso actual.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Salir', style: 'destructive', onPress: () => resetGame() && router.back() },
                  ]
                );
              }}
              style={{ marginTop: 6, padding: 6 }}
            >
              <Text style={[styles.helperCentered, { fontSize: 13 }]}>🚪 Salir del Juego</Text>
            </TouchableOpacity>
          </Card>
        </ScrollView>
      </>
    );
  };

  const renderPlaying = () => {
    const currentPlayer = getCurrentPlayer();
    const numTeams = getNumTeams();
    // Asegurar que displayCharacter sea un string
    const displayCharacter = typeof currentCharacter === 'string' 
      ? currentCharacter 
      : (currentCharacter?.name || currentCharacter || null);
    const teamColors = [theme.colors.primary, theme.colors.secondary, theme.colors.warning, theme.colors.success, theme.colors.danger];
    const teamColor = teamColors[(currentTeam - 1) % teamColors.length];

    const backOpacity = cardFlipAnimation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 0, 0],
    });

    const frontOpacity = cardFlipAnimation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0, 1],
    });

    const backAnimatedStyle = {
      opacity: backOpacity,
    };

    const frontAnimatedStyle = {
      opacity: frontOpacity,
    };

    const cardTranslateX = cardChangeAnimation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [-100, 0, 0],
    });

    const cardOpacity = cardChangeAnimation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 1, 1],
    });

    const cardChangeStyle = {
      transform: [{ translateX: cardTranslateX }],
      opacity: cardOpacity,
    };

    return (
      <>
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: 16, padding: 10, marginBottom: 6 }}>
            <View style={{ position: 'relative', marginRight: 10 }}>
              {currentPlayer && isPlayerMVP(currentPlayer.id) && (
                <Text style={{ position: 'absolute', top: -12, left: '50%', marginLeft: -10, fontSize: 20, zIndex: 1 }}>👑</Text>
              )}
              <Text style={{ fontSize: 36 }}>{currentPlayer?.avatar}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.text, fontSize: 20, fontFamily: 'Truculenta-Bold' }}>
                {currentPlayer ? capitalize(currentPlayer.name) : ''}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <View style={{ backgroundColor: teamColor, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                  <Text style={{ color: theme.colors.text, fontSize: 11, fontFamily: 'Truculenta-Bold' }}>
                    {gameMode === 'pairs' ? `Pareja ${currentTeam}` : `Equipo ${currentTeam}`}
                  </Text>
                </View>
                {currentPlayer && (
                  <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>
                    ✓{getPlayerStats(currentPlayer.id).hits} ✗{getPlayerStats(currentPlayer.id).fails}
                  </Text>
                )}
              </View>
            </View>
            <View style={{ backgroundColor: timeLeft <= 10 ? theme.colors.danger : theme.colors.primary, width: 55, height: 55, borderRadius: 27.5, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: theme.colors.text, fontSize: 18, fontFamily: 'Truculenta-Bold' }}>{timeLeft}s</Text>
            </View>
          </View>
          <View style={{ backgroundColor: theme.colors.surfaceLight, borderRadius: 8, padding: 6, alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
              Ronda {round} • {roundRules[round]}
            </Text>
          </View>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 8 }}>
          <Animated.View style={[{ width: '100%' }, cardChangeStyle]}>
            <TouchableOpacity
              activeOpacity={1}
              onPressIn={() => setIsCardPressed(true)}
              onPressOut={() => setIsCardPressed(false)}
              style={styles.cardContainer}
            >
              <Animated.View style={[styles.cardFace, backAnimatedStyle]}>
                <LinearGradient
                  colors={['#ff66ff', '#cc00cc', '#990099']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardBackContent}>
                    <Image source={require('../assets/img/logo-personajes.png')} style={styles.cardLogo} />
                    <Text style={styles.cardInstruction}>MANTÉN PRESIONADO</Text>
                    <Text style={styles.cardInstructionSubtitle}>para ver el personaje</Text>
                  </View>
                </LinearGradient>
              </Animated.View>
              <Animated.View style={[styles.cardFace, frontAnimatedStyle]}>
                <LinearGradient
                  colors={['#ff66ff', '#cc00cc', '#990099']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.cardGradient}
                >
                  <Text style={styles.characterName}>
                    {displayCharacter ? String(displayCharacter).toUpperCase() : 'SIN TARJETAS'}
                  </Text>
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
          <Text style={{ color: theme.colors.textMuted, fontSize: 13, marginTop: 10, textAlign: 'center' }}>
            {roundCharacters.length} personajes restantes
          </Text>
        </View>

        <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
          {numTeams > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              {Array.from({ length: numTeams }, (_, i) => i + 1).map((teamNum) => {
                const teamScore = getTotalScore(teamNum);
                const tColor = teamColors[(teamNum - 1) % teamColors.length];
                const isCurrent = currentTeam === teamNum;
                return (
                  <View
                    key={teamNum}
                    style={{
                      alignItems: 'center',
                      backgroundColor: theme.colors.surface,
                      paddingHorizontal: 16,
                      paddingVertical: 6,
                      borderRadius: 10,
                      borderWidth: isCurrent ? 2 : 0,
                      borderColor: tColor,
                    }}
                  >
                    <Text style={{ color: tColor, fontSize: 11, fontFamily: 'Truculenta-Bold' }}>
                      {gameMode === 'pairs' ? `P${teamNum}` : `E${teamNum}`}
                    </Text>
                    <Text style={{ color: theme.colors.text, fontSize: 20, fontFamily: 'Truculenta-Bold' }}>{teamScore}</Text>
                  </View>
                );
              })}
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
            <TouchableOpacity
              onPress={handleFail}
              activeOpacity={0.8}
              style={styles.actionButtonContainerFail}
            >
              <LinearGradient
                colors={['#ff6666', '#cc0000', '#990000']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.actionButtonGradient}
              >
                <Text style={styles.actionIcon}>✗</Text>
                <Text style={styles.actionLabel}>FALLO</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleHit}
              activeOpacity={0.8}
              style={styles.actionButtonContainerSuccess}
            >
              <LinearGradient
                colors={['#66ff66', '#00cc00', '#009900']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.actionButtonGradient}
              >
                <Text style={styles.actionIcon}>✓</Text>
                <Text style={styles.actionLabel}>ACIERTO</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 4 }}>
            <TouchableOpacity onPress={() => setIsPaused((p) => !p)} style={{ padding: 6 }}>
              <Text style={[styles.helperCentered, { fontSize: 13 }]}>
                {isPaused ? '▶ Reanudar' : '⏸ Pausar'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Salir del Juego',
                  '¿Estás seguro de que quieres salir del juego? Se perderá el progreso actual.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Salir', style: 'destructive', onPress: () => resetGame() && router.back() },
                  ]
                );
              }}
              style={{ padding: 6 }}
            >
              <Text style={[styles.helperCentered, { fontSize: 13 }]}>🚪 Salir del Juego</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  };

  const renderFinished = () => {
    const numTeams = getNumTeams();
    const rankedPlayers = getPlayerRanking();
    const mvpPlayer = rankedPlayers[0];
    const mvpStats = mvpPlayer ? getPlayerStats(mvpPlayer.id) : { hits: 0, fails: 0 };
    const teamScores = Array.from({ length: numTeams }, (_, i) => ({
      teamNum: i + 1,
      score: getTotalScore(i + 1),
    })).sort((a, b) => b.score - a.score);
    const maxScore = teamScores[0]?.score || 0;
    const winningTeams = teamScores.filter(t => t.score === maxScore);
    const teamColors = [theme.colors.primary, theme.colors.secondary, theme.colors.warning, theme.colors.success, theme.colors.danger];
    return (
      <>
        {renderHeader('Resultado')}
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <Text style={{ fontSize: 56, marginBottom: 8 }}>🏆</Text>
            <Text style={[styles.mainTitle, { fontSize: 26, marginBottom: 20 }]}>¡Juego Terminado!</Text>
            {numTeams > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 16, justifyContent: 'center' }}>
                {teamScores.map((teamScore) => {
                  const teamColor = teamColors[(teamScore.teamNum - 1) % teamColors.length];
                  const isWinner = winningTeams.some(t => t.teamNum === teamScore.teamNum) && maxScore > 0;
                  return (
                    <View
                      key={teamScore.teamNum}
                      style={{
                        alignItems: 'center',
                        padding: 16,
                        borderRadius: 16,
                        backgroundColor: theme.colors.surface,
                        borderWidth: isWinner ? 2 : 0,
                        borderColor: theme.colors.warning,
                      }}
                    >
                      <Text style={{ color: teamColor, fontSize: 14, marginBottom: 4, fontFamily: 'Truculenta-Bold' }}>
                        {gameMode === 'pairs' ? `Pareja ${teamScore.teamNum}` : `Equipo ${teamScore.teamNum}`}
                      </Text>
                      <Text style={{ color: theme.colors.text, fontSize: 40, fontFamily: 'Truculenta-Bold' }}>{teamScore.score}</Text>
                    </View>
                  );
                })}
              </View>
            )}
            <Text style={{ color: theme.colors.text, fontSize: 22, fontFamily: 'Truculenta-Bold', marginBottom: 8 }}>
              {winningTeams.length === 1 && maxScore > 0
                ? `🎉 ¡${gameMode === 'pairs' ? 'Pareja' : 'Equipo'} ${winningTeams[0].teamNum} Gana!`
                : winningTeams.length > 1
                  ? '🤝 ¡Empate!'
                  : '🤝 ¡Juego Terminado!'}
            </Text>
          </View>

          {mvpPlayer && mvpStats.hits > 0 && (
            <Card style={{ marginBottom: 16, borderWidth: 2, borderColor: theme.colors.warning }}>
              <Text style={{ color: theme.colors.warning, fontSize: 16, fontFamily: 'Truculenta-Bold', textAlign: 'center', marginBottom: 16 }}>
                ⭐ MVP del Juego ⭐
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ position: 'relative', marginRight: 16 }}>
                  <Text style={{ position: 'absolute', top: -16, left: '50%', marginLeft: -12, fontSize: 24, zIndex: 1 }}>👑</Text>
                  <Text style={{ fontSize: 56 }}>{mvpPlayer.avatar}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.text, fontSize: 22, fontFamily: 'Truculenta-Bold' }}>
                    {capitalize(mvpPlayer.name)}
                  </Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 14, marginBottom: 8 }}>
                    {gameMode === 'pairs' ? 'Pareja' : 'Equipo'} {mvpPlayer.team}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <Text style={{ color: theme.colors.success, fontSize: 18, fontFamily: 'Truculenta-Bold' }}>✓ {mvpStats.hits}</Text>
                    <Text style={{ color: theme.colors.danger, fontSize: 18, fontFamily: 'Truculenta-Bold' }}>✗ {mvpStats.fails}</Text>
                  </View>
                </View>
              </View>
            </Card>
          )}

          <Card style={{ marginBottom: 24 }}>
            <Text style={{ color: theme.colors.text, fontSize: 16, fontFamily: 'Truculenta-Bold', marginBottom: 16 }}>📊 Estadísticas de Jugadores</Text>
            {rankedPlayers.map((player, index) => {
              const stats = getPlayerStats(player.id);
              const isFirst = index === 0 && stats.hits > 0;
              return (
                <View
                  key={player.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: index < rankedPlayers.length - 1 ? 1 : 0,
                    borderBottomColor: theme.colors.border,
                    backgroundColor: isFirst ? theme.colors.surfaceLight : 'transparent',
                    marginHorizontal: isFirst ? -16 : 0,
                    paddingHorizontal: isFirst ? 16 : 0,
                    borderRadius: isFirst ? 8 : 0,
                  }}
                >
                  <Text style={{ color: theme.colors.textMuted, fontSize: 14, fontFamily: 'Truculenta-Bold', width: 30 }}>
                    #{index + 1}
                  </Text>
                  <Text style={{ fontSize: 28, marginRight: 12 }}>{player.avatar}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ color: theme.colors.text, fontSize: 16, fontFamily: 'Truculenta-Bold' }}>
                        {capitalize(player.name)}
                      </Text>
                      {isFirst && <Text style={{ fontSize: 14 }}>👑</Text>}
                    </View>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                      {gameMode === 'pairs' ? 'Pareja' : 'Equipo'} {player.team}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Text style={{ color: theme.colors.success, fontSize: 14, fontFamily: 'Truculenta-Bold' }}>✓ {stats.hits}</Text>
                    <Text style={{ color: theme.colors.danger, fontSize: 14, fontFamily: 'Truculenta-Bold' }}>✗ {stats.fails}</Text>
                  </View>
                </View>
              );
            })}
          </Card>

          <View style={{ gap: 12 }}>
            <Button title="🔄 Jugar Otra Vez (mismos jugadores)" onPress={playAgain} size="large" />
            <Button title="Nueva Partida" onPress={resetGame} variant="outline" size="large" />
            <Button title="Volver al Menú" onPress={() => router.back()} variant="secondary" size="large" />
          </View>
        </ScrollView>
      </>
    );
  };

  return (
    <LinearGradient colors={theme.gradients.background} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {gameState === 'config' && renderConfig()}
        {gameState === 'setup' && renderSetup()}
        {gameState === 'round_intro' && renderRoundIntro()}
        {gameState === 'round_intro_mid_turn' && renderRoundIntroMidTurn()}
        {gameState === 'waiting' && renderWaiting()}
        {gameState === 'playing' && renderPlaying()}
        {gameState === 'finished' && renderFinished()}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, padding: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 36, height: 36, resizeMode: 'contain', marginRight: 10 },
  headerTitle: {
    fontSize: 20,
    color: '#fff',
    fontFamily: 'Truculenta-Bold',
    textTransform: 'uppercase',
    textShadowColor: '#111',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Truculenta-Bold',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  helper: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginBottom: 8,
  },
  helperSmall: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  helperCentered: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
    marginBottom: 4,
    fontFamily: 'Truculenta-Bold',
  },
  optionRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  optionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  optionActive: { backgroundColor: theme.colors.primary },
  optionText: { color: theme.colors.textMuted, fontFamily: 'Truculenta' },
  optionTextActive: { color: '#fff', fontFamily: 'Truculenta-Bold' },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  timeChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  timeChipActive: { backgroundColor: theme.colors.primary },
  timeText: { color: theme.colors.textMuted },
  timeTextActive: { color: '#fff', fontFamily: 'Truculenta-Bold' },
  teamRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  teamBtn: {
    flexGrow: 1,
    minWidth: '30%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 10,
  },
  teamBtnActive: { borderWidth: 2, borderColor: theme.colors.primary },
  teamBtnDisabled: { opacity: 0.6 },
  teamText: { color: '#fff', fontFamily: 'Truculenta-Bold' },
  teamTextActive: { color: theme.colors.primary },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  avatarChip: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarChipActive: { borderWidth: 2, borderColor: theme.colors.primary },
  avatarText: { fontSize: 24 },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
  },
  playerAvatar: { fontSize: 32, marginRight: 10 },
  playerName: { color: '#fff', fontSize: 16, fontFamily: 'Truculenta-Bold' },
  roundLabel: {
    color: theme.colors.primary,
    fontFamily: 'Truculenta-Bold',
    marginBottom: 4,
  },
  mainTitle: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'Truculenta-Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  timerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardFace: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Truculenta-Bold',
    marginBottom: 8,
  },
  actionsRow: { flexDirection: 'row', marginTop: 12 },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
  },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  categoryCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(14,165,233,0.12)',
  },
  categoryIcon: { fontSize: 24, marginBottom: 6 },
  categoryName: { color: '#fff', fontFamily: 'Truculenta-Bold', fontSize: 14 },
  categoryDesc: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 },
  categoryCount: { color: theme.colors.textMuted, fontSize: 11, marginTop: 6 },
  selectedCatBanner: {
    backgroundColor: 'rgba(14,165,233,0.15)',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  helperSmall: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: theme.colors.primary,
    color: '#fff',
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
    fontFamily: 'Truculenta-Bold',
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtnText: { fontSize: 14 },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.danger + '33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: { fontSize: 14 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: theme.colors.textMuted,
    fontSize: 18,
    fontFamily: 'Truculenta-Bold',
  },
  editTeamBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
  },
  editTeamBtnActive: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  editTeamBtnDisabled: {
    opacity: 0.5,
  },
  editTeamText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontFamily: 'Truculenta-Bold',
  },
  editTeamTextActive: {
    color: theme.colors.primary,
  },
  editTeamTextDisabled: {
    color: theme.colors.textMuted,
  },
  roundBadge: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  roundBadgeText: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: 'Truculenta-Bold',
    letterSpacing: 2,
  },
  cardContainer: {
    width: '100%',
    minHeight: 150,
    maxHeight: 200,
    position: 'relative',
  },
  cardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 24,
    borderWidth: 6,
    borderColor: '#660066',
    overflow: 'hidden',
    shadowColor: '#660066',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  cardGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBackContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    height: '100%',
    padding: 8,
  },
  cardLogo: {
    width: '50%',
    height: '55%',
    resizeMode: 'contain',
    opacity: 0.95,
  },
  cardInstruction: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Truculenta-Bold',
    letterSpacing: 1,
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    textTransform: 'uppercase',
  },
  cardInstructionSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    fontFamily: 'Truculenta',
  },
  characterName: {
    color: '#ffffff',
    fontSize: Math.min(SCREEN_WIDTH * 0.12, 48),
    fontFamily: 'Truculenta-Bold',
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textShadowColor: '#660066',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
    padding: 20,
  },
  actionButtonContainerFail: {
    flex: 1,
    borderRadius: 25,
    borderWidth: 6,
    borderColor: '#660000',
    overflow: 'hidden',
    shadowColor: '#660000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButtonContainerSuccess: {
    flex: 1,
    borderRadius: 25,
    borderWidth: 6,
    borderColor: '#006600',
    overflow: 'hidden',
    shadowColor: '#006600',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButtonGradient: {
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 75,
    borderRadius: 19,
  },
  actionIcon: {
    fontSize: 32,
    fontFamily: 'Truculenta-Bold',
    color: '#ffffff',
    textShadowColor: '#000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
  },
  actionLabel: {
    fontSize: 14,
    fontFamily: 'Truculenta-Bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.08,
    textShadowColor: '#000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
  },
});

