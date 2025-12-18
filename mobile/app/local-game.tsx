import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Card, Modal } from '../src/components';
import { LocalPlayer, RoundScores, LOCAL_AVATARS } from '../src/types';
import { colors } from '../src/theme';
import { OFFLINE_CATEGORIES, getCategoryById, getCategoriesForUI, OfflineCategory } from '../src/data/categories';

type GameState = 'config' | 'setup' | 'playing' | 'waiting' | 'round_intro' | 'round_intro_mid_turn' | 'finished' | 'new_characters' | 'reconfig';

export default function LocalGameScreen() {
  const [gameState, setGameState] = useState<GameState>('config');
  const [numPlayers, setNumPlayers] = useState('4');
  const [gameMode, setGameMode] = useState('teams');
  const [charactersPerPlayer, setCharactersPerPlayer] = useState('2');
  const [timePerRound, setTimePerRound] = useState('60');
  const [category, setCategory] = useState(''); // Categoría opcional de personajes
  const [usePresetCategory, setUsePresetCategory] = useState(false); // Usar categoría predefinida
  const [selectedCategory, setSelectedCategory] = useState<OfflineCategory | null>(null);
  const [maxCharacters, setMaxCharacters] = useState(''); // Límite de personajes para categoría
  // Categorías offline - no requieren carga desde servidor
  const categories = getCategoriesForUI();
  const [players, setPlayers] = useState<LocalPlayer[]>([]);
  const [roundPlayerIndex, setRoundPlayerIndex] = useState(0);
  const [characters, setCharacters] = useState<string[]>([]);
  const [currentCharacter, setCurrentCharacter] = useState<string | null>(null); // Personaje actual (aleatorio)
  const [roundCharacters, setRoundCharacters] = useState<string[]>([]); // Personajes disponibles en la ronda actual
  const [round, setRound] = useState(1);
  const [currentTeam, setCurrentTeam] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPaused, setIsPaused] = useState(false);
  const [scores, setScores] = useState<RoundScores>({
    round1: { team1: 0, team2: 0 },
    round2: { team1: 0, team2: 0 },
    round3: { team1: 0, team2: 0 },
  });
  const [playerName, setPlayerName] = useState('');
  const [playerCharacters, setPlayerCharacters] = useState<string[]>(['', '']);
  const [team1Players, setTeam1Players] = useState<LocalPlayer[]>([]);
  const [team2Players, setTeam2Players] = useState<LocalPlayer[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState(LOCAL_AVATARS[0]);
  const [usedAvatars, setUsedAvatars] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState(1); // Equipo/pareja seleccionado para nuevo jugador
  const [blockedCharacters, setBlockedCharacters] = useState<string[]>([]); // Tarjetas bloqueadas por fallo
  const [playerStats, setPlayerStats] = useState<Record<number, { hits: number; fails: number }>>({}); // Estadísticas por jugador
  const [isCardPressed, setIsCardPressed] = useState(false); // Controla si se muestra el personaje
  const [currentPlayerForChars, setCurrentPlayerForChars] = useState(0); // Índice del jugador ingresando nuevos personajes
  const [newPlayerCharacters, setNewPlayerCharacters] = useState<string[]>([]); // Personajes temporales del jugador actual
  const [editingPlayer, setEditingPlayer] = useState<LocalPlayer | null>(null); // Jugador siendo editado
  const [editPlayerName, setEditPlayerName] = useState('');
  const [editPlayerTeam, setEditPlayerTeam] = useState(1);
  const [editPlayerCharacters, setEditPlayerCharacters] = useState<string[]>([]);
  const [showExitModal, setShowExitModal] = useState(false); // Modal de salida del juego
  const cardScale = useRef(new Animated.Value(1)).current;

  const roundRules: Record<number, string> = {
    1: 'Puedes decir todas las palabras excepto las del personaje',
    2: 'Solo puedes decir UNA palabra',
    3: 'Solo mímica. No puedes hablar',
  };

  // Opciones de tiempo (en incrementos de 30)
  const timeOptions = [30, 60, 90, 120, 150, 180];

  // Validar que solo se ingresen números enteros (sin límites)
  const handleNumericInput = (value: string, setter: (val: string) => void) => {
    // Remover cualquier caracter que no sea número
    const numericValue = value.replace(/[^0-9]/g, '');
    setter(numericValue);
  };

  // Capitalizar texto (primera letra mayúscula de cada palabra)
  const capitalize = (text: string) => {
    return text.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const handleExit = () => {
    resetGame();
    router.back();
  };

  const roundDetails: Record<number, { icon: string; title: string; description: string; tips: string[] }> = {
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

  useEffect(() => {
    // El timer corre solo en 'playing', no en 'round_intro_mid_turn' ni cuando está pausado
    if (gameState === 'playing' && !isPaused && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) { handleTimeUp(); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, isPaused, timeLeft]);

  useEffect(() => {
    setPlayerCharacters(Array(parseInt(charactersPerPlayer) || 2).fill(''));
  }, [charactersPerPlayer]);

  // Seleccionar una categoría offline (no requiere carga de servidor)
  const selectCategory = (categoryId: number) => {
    const category = getCategoryById(categoryId);
    if (category) {
      setSelectedCategory(category);
      setMaxCharacters(''); // Limpiar límite al cambiar categoría
    }
  };

  const handleCharacterChange = (index: number, value: string) => {
    const newChars = [...playerCharacters];
    newChars[index] = value;
    setPlayerCharacters(newChars);
  };

const handleConfigSubmit = () => {
    const numPlayersInt = parseInt(numPlayers) || 0;

    if (numPlayersInt < 2) {
      Alert.alert('Error', 'Debe haber al menos 2 jugadores');
      return;
    }

    // Validar que el número de jugadores sea par para modo parejas
    if (gameMode === 'pairs' && numPlayersInt % 2 !== 0) {
      Alert.alert('Error', 'Para jugar en parejas, el número de jugadores debe ser par');
      return;
    }

    // Si se usa categoría predefinida, verificar que haya una seleccionada
    if (usePresetCategory && !selectedCategory) {
      Alert.alert('Error', 'Selecciona una categoría predefinida');
      return;
    }

    // Si es categoría predefinida, cargar los personajes
    if (usePresetCategory && selectedCategory?.characters) {
      let categoryChars = [...selectedCategory.characters];
      
      // Calcular límite automático si no se especifica manualmente
      const charsPerPlayer = parseInt(charactersPerPlayer) || 2;
      const calculatedMax = numPlayersInt * charsPerPlayer;
      
      let limitToUse: number;
      if (maxCharacters) {
        // Validar límite manual
        const maxChars = parseInt(maxCharacters);
        if (isNaN(maxChars) || maxChars < 1) {
          Alert.alert('Error', 'El límite de personajes debe ser un número mayor a 0');
          return;
        }
        if (maxChars > categoryChars.length) {
          Alert.alert('Error', `El límite no puede exceder ${categoryChars.length} personajes (total de la categoría)`);
          return;
        }
        limitToUse = maxChars;
      } else {
        // Usar cálculo automático
        limitToUse = calculatedMax;
        if (limitToUse > categoryChars.length) {
          Alert.alert('Error', `Se necesitan ${limitToUse} personajes (${numPlayersInt} jugadores × ${charsPerPlayer} por jugador), pero la categoría solo tiene ${categoryChars.length} personajes disponibles`);
          return;
        }
      }
      
      // Mezclar y tomar solo el número necesario
      categoryChars = shuffleArray(categoryChars);
      categoryChars = categoryChars.slice(0, limitToUse);
      
      setCharacters(categoryChars);
      setCategory(selectedCategory.name);
    }

    setGameState('setup');
  };

  // Calcular número de equipos/parejas según el modo
  const getNumTeams = () => {
    const numPlayersInt = parseInt(numPlayers) || 4;
    if (gameMode === 'pairs') {
      return numPlayersInt / 2; // Cada pareja es un "equipo"
    }
    return 2; // Modo equipos siempre tiene 2 equipos
  };

  // Verificar si un equipo/pareja está lleno
  const isTeamFull = (teamNum: number) => {
    const numPlayersInt = parseInt(numPlayers) || 4;
    const playersInTeam = players.filter(p => p.team === teamNum).length;
    
    if (gameMode === 'pairs') {
      return playersInTeam >= 2; // Cada pareja tiene máximo 2 jugadores
    }
    // Modo equipos: dividir equitativamente
    const maxPerTeam = Math.ceil(numPlayersInt / 2);
    return playersInTeam >= maxPerTeam;
  };

  // Verificar si ya se alcanzó el límite de jugadores
  const isPlayerLimitReached = () => {
    const numPlayersInt = parseInt(numPlayers) || 4;
    return players.length >= numPlayersInt;
  };

const handleAddPlayer = () => {
    const numPlayersInt = parseInt(numPlayers) || 4;

    // Verificar límite de jugadores
    if (players.length >= numPlayersInt) {
      Alert.alert('Error', `Ya se alcanzó el límite de ${numPlayersInt} jugadores`);
      return;
    }

    // Validar nombre
    if (!playerName.trim()) {
      Alert.alert('Error', 'Ingresa el nombre del jugador');
      return;
    }

    const charsPerPlayer = parseInt(charactersPerPlayer) || 2;

    // Solo validar personajes si NO es categoría predefinida
    let trimmedChars: string[] = [];
    if (!usePresetCategory) {
      trimmedChars = playerCharacters.map((c) => c.trim()).filter((c) => c);
      if (trimmedChars.length !== charsPerPlayer) {
        Alert.alert('Error', `Necesitas ${charsPerPlayer} personajes.`);
        return;
      }
      const uniqueChars = [...new Set(trimmedChars)];
      if (uniqueChars.length !== trimmedChars.length) {
        Alert.alert('Error', 'Los personajes deben ser diferentes');
        return;
      }
    }

    // Verificar que el equipo seleccionado no esté lleno
    if (isTeamFull(selectedTeam)) {
      Alert.alert('Error', `${gameMode === 'pairs' ? 'La pareja' : 'El equipo'} ${selectedTeam} ya está completo`);
      return;
    }

    const newPlayer: LocalPlayer = { id: Date.now(), name: playerName.trim(), team: selectedTeam, characters: trimmedChars, avatar: selectedAvatar };
    if (selectedTeam === 1) setTeam1Players([...team1Players, newPlayer]);
    else setTeam2Players([...team2Players, newPlayer]);
    setPlayers([...players, newPlayer]);
    
    // Solo agregar personajes si NO es categoría predefinida
    if (!usePresetCategory) {
      setCharacters([...characters, ...trimmedChars]);
    }
    
    setUsedAvatars([...usedAvatars, selectedAvatar]);
    // Seleccionar siguiente avatar disponible
    const nextAvatar = LOCAL_AVATARS.find(a => !usedAvatars.includes(a) && a !== selectedAvatar);
    if (nextAvatar) setSelectedAvatar(nextAvatar);
    setPlayerName('');
    setPlayerCharacters(Array(charsPerPlayer).fill(''));
    
    // Auto-seleccionar el siguiente equipo disponible
    if (isTeamFull(selectedTeam)) {
      const numTeams = getNumTeams();
      for (let i = 1; i <= numTeams; i++) {
        if (!isTeamFull(i)) {
          setSelectedTeam(i);
          break;
        }
      }
    }
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const initializeScores = () => {
    const numTeams = getNumTeams();
    const initialScores: RoundScores = {
      round1: {} as any,
      round2: {} as any,
      round3: {} as any,
    };
    for (let i = 1; i <= numTeams; i++) {
      initialScores.round1[`team${i}` as keyof typeof initialScores.round1] = 0;
      initialScores.round2[`team${i}` as keyof typeof initialScores.round2] = 0;
      initialScores.round3[`team${i}` as keyof typeof initialScores.round3] = 0;
    }
    return initialScores;
  };

  const handleStartGame = () => {
    const numPlayersInt = parseInt(numPlayers);
    const charsPerPlayer = parseInt(charactersPerPlayer) || 2;
    const totalNeeded = numPlayersInt * charsPerPlayer;
    if (players.length < numPlayersInt) {
      Alert.alert('Error', `Se necesitan ${numPlayersInt} jugadores. Hay ${players.length}`);
      return;
    }
    if (characters.length < totalNeeded) {
      Alert.alert('Error', `Se necesitan ${totalNeeded} personajes. Hay ${characters.length}`);
      return;
    }
    const allChars = [...characters];
    setCharacters(allChars); // Mantener lista original de personajes
    setRoundCharacters(allChars); // Personajes disponibles para esta ronda
    // Seleccionar primer personaje aleatorio
    setCurrentCharacter(pickRandomCharacter(allChars, []));
    setIsPaused(true); // Timer pausado hasta que el jugador esté listo
    setGameState('round_intro'); // Mostrar instrucciones de la ronda primero
    setRoundPlayerIndex(0);
    setTimeLeft(parseInt(timePerRound) || 60);
  };

  const getCurrentPlayer = () => {
    const teamPlayers = players.filter(p => p.team === currentTeam);
    if (teamPlayers.length === 0) return null;
    return teamPlayers[roundPlayerIndex % teamPlayers.length];
  };

  const getTotalScore = (team: number) => {
    const round1Score = scores.round1[`team${team}` as keyof typeof scores.round1] || 0;
    const round2Score = scores.round2[`team${team}` as keyof typeof scores.round2] || 0;
    const round3Score = scores.round3[`team${team}` as keyof typeof scores.round3] || 0;
    return round1Score + round2Score + round3Score;
  };

  // Obtener el jugador con más aciertos (MVP)
  const getMVP = () => {
    let maxHits = 0;
    let mvpId: number | null = null;
    
    Object.entries(playerStats).forEach(([id, stats]) => {
      if (stats.hits > maxHits) {
        maxHits = stats.hits;
        mvpId = parseInt(id);
      }
    });
    
    return mvpId;
  };

  // Elegir un personaje aleatorio del pool disponible (excluyendo bloqueados)
  const pickRandomCharacter = (availableChars: string[], blocked: string[] = []): string | null => {
    const pool = availableChars.filter(c => !blocked.includes(c));
    if (pool.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
  };

  // Seleccionar nuevo personaje aleatorio para mostrar
  const selectNewCharacter = () => {
    const newChar = pickRandomCharacter(roundCharacters, blockedCharacters);
    setCurrentCharacter(newChar);
  };

  // Verificar si un jugador es el MVP actual
  const isPlayerMVP = (playerId: number) => {
    const mvpId = getMVP();
    if (mvpId === null) return false;
    const mvpStats = playerStats[mvpId];
    if (!mvpStats || mvpStats.hits === 0) return false;
    return playerId === mvpId;
  };

  // Obtener estadísticas de un jugador
  const getPlayerStats = (playerId: number) => {
    return playerStats[playerId] || { hits: 0, fails: 0 };
  };

  // Obtener todos los jugadores ordenados por aciertos
  const getPlayerRanking = () => {
    return [...players].sort((a, b) => {
      const statsA = getPlayerStats(a.id);
      const statsB = getPlayerStats(b.id);
      return statsB.hits - statsA.hits;
    });
  };

  // Avanza al siguiente personaje (cuando se acierta, se remueve el personaje actual)
  const advanceAfterHit = () => {
    if (!currentCharacter) return;
    
    // Remover el personaje actual de la ronda (ya fue adivinado)
    const newRoundCharacters = roundCharacters.filter(c => c !== currentCharacter);
    
    if (newRoundCharacters.length === 0) {
      // Se acabaron todos los personajes de la ronda - pasar a siguiente ronda
      if (round < 3) {
        // IMPORTANTE: Pausar primero para evitar que el timer interfiera
        setIsPaused(true);
        // Nueva ronda: resetear todos los personajes pero MANTENER tiempo y jugador actual
        const newChars = [...characters];
        setRoundCharacters(newChars);
        setRound(round + 1);
        setBlockedCharacters([]); // Limpiar tarjetas bloqueadas para la nueva ronda
        // Seleccionar nuevo personaje aleatorio para la nueva ronda
        setCurrentCharacter(pickRandomCharacter(newChars, []));
        // NO cambiamos equipo ni reseteamos tiempo - la misma persona sigue jugando
        // Solo mostramos las instrucciones de la nueva ronda brevemente
        setGameState('round_intro_mid_turn'); // Estado especial para intro sin cambio de turno
      } else {
        setGameState('finished');
      }
    } else {
      // Hay más personajes, continuar con uno aleatorio
      setRoundCharacters(newRoundCharacters);
      // Seleccionar nuevo personaje aleatorio del pool restante
      const newChar = pickRandomCharacter(newRoundCharacters, blockedCharacters);
      setCurrentCharacter(newChar);
    }
  };

  // Cuando se acaba el tiempo, cambia de equipo/jugador pero NO cambia de ronda
  // La ronda solo cambia cuando todos los personajes son adivinados (en advanceAfterHit)
  const handleTimeUp = () => {
    const timePerRoundInt = parseInt(timePerRound) || 60;
    
    // Pausar timer inmediatamente para evitar llamadas duplicadas
    setIsPaused(true);
    
    const currentTeamPlayers = players.filter(p => p.team === currentTeam);
    const maxPlayersPerTeam = Math.max(...Array.from({ length: getNumTeams() }, (_, i) => {
      const teamPlayers = players.filter(p => p.team === i + 1);
      return teamPlayers.length;
    }));
    
    // Avanzar al siguiente jugador del mismo equipo
    const nextPlayerIndex = (roundPlayerIndex + 1) % maxPlayersPerTeam;
    
    // Si llegamos al final de los jugadores del equipo actual, cambiar al siguiente equipo
    if (nextPlayerIndex === 0 && roundPlayerIndex === currentTeamPlayers.length - 1) {
      const numTeams = getNumTeams();
      const nextTeam = currentTeam >= numTeams ? 1 : currentTeam + 1;
      setCurrentTeam(nextTeam);
      setRoundPlayerIndex(0);
    } else {
      setRoundPlayerIndex(nextPlayerIndex);
    }
    
    setBlockedCharacters([]); // Limpiar bloqueados para el nuevo turno
    // Seleccionar nuevo personaje aleatorio para el nuevo turno
    setCurrentCharacter(pickRandomCharacter(roundCharacters, []));
    setTimeLeft(timePerRoundInt);
    setGameState('waiting');
  };

  const animateCard = () => {
    Animated.sequence([
      Animated.spring(cardScale, { toValue: 0.95, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  const handleHit = () => {
    animateCard();
    setIsCardPressed(false); // Ocultar personaje antes de pasar al siguiente
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return;
    
    // Actualizar puntuación del equipo
    const roundKey = `round${round}` as keyof RoundScores;
    const teamKey = `team${currentPlayer.team}` as keyof RoundScores[keyof RoundScores];
    setScores((prev) => ({ 
      ...prev, 
      [roundKey]: { 
        ...prev[roundKey], 
        [teamKey]: (prev[roundKey][teamKey] || 0) + 1 
      } 
    }));
    
    // Actualizar estadísticas del jugador
    setPlayerStats((prev) => ({
      ...prev,
      [currentPlayer.id]: {
        hits: (prev[currentPlayer.id]?.hits || 0) + 1,
        fails: prev[currentPlayer.id]?.fails || 0,
      },
    }));
    
    advanceAfterHit();
  };

  // Función para confirmar que el jugador está listo
  const handlePlayerReady = () => {
    setBlockedCharacters([]); // Limpiar tarjetas bloqueadas al iniciar turno
    setIsCardPressed(false); // Ocultar personaje al iniciar turno
    setIsPaused(false); // Asegurar que el timer esté corriendo
    setGameState('playing');
  };

  // Función para manejar fallo (bloquea tarjeta y termina turno)
  const handleFail = () => {
    animateCard();
    const currentPlayer = getCurrentPlayer();
    
    // Actualizar estadísticas del jugador
    if (currentPlayer) {
      setPlayerStats((prev) => ({
        ...prev,
        [currentPlayer.id]: {
          hits: prev[currentPlayer.id]?.hits || 0,
          fails: (prev[currentPlayer.id]?.fails || 0) + 1,
        },
      }));
    }
    
    // Bloquear esta tarjeta para el resto del turno
    if (currentCharacter) {
      setBlockedCharacters([...blockedCharacters, currentCharacter]);
    }
    // Terminar el turno inmediatamente
    handleTimeUp();
  };

  const resetGame = () => {
    setGameState('config');
    setPlayers([]);
    setTeam1Players([]);
    setTeam2Players([]);
    setCharacters([]);
    setRoundCharacters([]);
    setCurrentCharacter(null);
    setRound(1);
    setCurrentTeam(1);
    setScores({ round1: { team1: 0, team2: 0 }, round2: { team1: 0, team2: 0 }, round3: { team1: 0, team2: 0 } });
    setUsedAvatars([]);
    setSelectedAvatar(LOCAL_AVATARS[0]);
    setSelectedTeam(1);
    setBlockedCharacters([]);
    setPlayerStats({});
    setIsCardPressed(false);
    setCategory('');
    setUsePresetCategory(false);
    setSelectedCategory(null);
  };

  // Jugar otra vez con los mismos jugadores pero nuevos personajes
  const playAgain = () => {
    // Limpiar personajes pero mantener jugadores
    setCharacters([]);
    setRoundCharacters([]);
    setCurrentCharacter(null);
    setRound(1);
    setCurrentTeam(1);
    setRoundPlayerIndex(0);
    setScores({ round1: { team1: 0, team2: 0 }, round2: { team1: 0, team2: 0 }, round3: { team1: 0, team2: 0 } });
    setBlockedCharacters([]);
    setPlayerStats({});
    setIsCardPressed(false);
    // Ir a pantalla de reconfiguración para permitir cambiar categoría y personajes por jugador
    setGameState('reconfig');
  };

  // Confirmar reconfiguración y pasar a ingresar nuevos personajes
  const handleReconfigSubmit = () => {
    // Usar el número de jugadores actuales (ya están definidos)
    const numPlayersInt = players.length;

    if (numPlayersInt < 2) {
      Alert.alert('Error', 'Debe haber al menos 2 jugadores');
      return;
    }

    // Validar que el número de jugadores sea par para modo parejas
    if (gameMode === 'pairs' && numPlayersInt % 2 !== 0) {
      Alert.alert('Error', 'Para jugar en parejas, el número de jugadores debe ser par');
      return;
    }
    
    // Actualizar numPlayers para que coincida con los jugadores actuales
    setNumPlayers(numPlayersInt.toString());

    // Si se usa categoría predefinida, verificar que haya una seleccionada
    if (usePresetCategory && !selectedCategory) {
      Alert.alert('Error', 'Selecciona una categoría predefinida');
      return;
    }

    // Si es categoría predefinida, cargar los personajes
    if (usePresetCategory && selectedCategory?.characters) {
      let categoryChars = [...selectedCategory.characters];
      
      // Calcular límite automático si no se especifica manualmente
      const charsPerPlayer = parseInt(charactersPerPlayer) || 2;
      const calculatedMax = numPlayersInt * charsPerPlayer;
      
      let limitToUse: number;
      if (maxCharacters) {
        // Validar límite manual
        const maxChars = parseInt(maxCharacters);
        if (isNaN(maxChars) || maxChars < 1) {
          Alert.alert('Error', 'El límite de personajes debe ser un número mayor a 0');
          return;
        }
        if (maxChars > categoryChars.length) {
          Alert.alert('Error', `El límite no puede exceder ${categoryChars.length} personajes (total de la categoría)`);
          return;
        }
        limitToUse = maxChars;
      } else {
        // Usar cálculo automático
        limitToUse = calculatedMax;
        if (limitToUse > categoryChars.length) {
          Alert.alert('Error', `Se necesitan ${limitToUse} personajes (${numPlayersInt} jugadores × ${charsPerPlayer} por jugador), pero la categoría solo tiene ${categoryChars.length} personajes disponibles`);
          return;
        }
      }
      
      // Mezclar y tomar solo el número necesario
      categoryChars = shuffleArray(categoryChars);
      categoryChars = categoryChars.slice(0, limitToUse);
      
      setCharacters(categoryChars);
      setCategory(selectedCategory.name);
      
      // Si es categoría predefinida, iniciar juego directamente
      setRoundCharacters(categoryChars);
      setCurrentCharacter(pickRandomCharacter(categoryChars, []));
      setIsPaused(true);
      setTimeLeft(parseInt(timePerRound) || 60);
      setGameState('round_intro');
      // Inicializar scores dinámicamente según número de equipos
      setScores(initializeScores());
    } else {
      // Modo manual: limpiar personajes y pedir nuevos personajes a cada jugador
      setCharacters([]);
      setCurrentPlayerForChars(0);
      setNewPlayerCharacters(Array(parseInt(charactersPerPlayer) || 2).fill(''));
      setGameState('new_characters');
    }
  };

  // Manejar cambio de personaje en la pantalla de nuevos personajes
  const handleNewCharacterChange = (index: number, value: string) => {
    const newChars = [...newPlayerCharacters];
    newChars[index] = value;
    setNewPlayerCharacters(newChars);
  };

  // Confirmar personajes del jugador actual y pasar al siguiente
  const confirmNewCharacters = () => {
    // Si se usa categoría predefinida, los personajes ya están cargados, iniciar directamente
    if (usePresetCategory && characters.length > 0) {
      setRoundCharacters([...characters]);
      setCurrentCharacter(pickRandomCharacter(characters, []));
      setIsPaused(true);
      setTimeLeft(parseInt(timePerRound) || 60);
      setGameState('round_intro');
      // Inicializar scores dinámicamente según número de equipos
      setScores(initializeScores());
      return;
    }

    // Modo manual: validar y recopilar personajes de cada jugador
    const charsPerPlayer = parseInt(charactersPerPlayer) || 2;
    const trimmedChars = newPlayerCharacters.map((c) => c.trim()).filter((c) => c);
    
    if (trimmedChars.length !== charsPerPlayer) {
      Alert.alert('Error', `Necesitas ${charsPerPlayer} personajes.`);
      return;
    }
    
    const uniqueChars = [...new Set(trimmedChars)];
    if (uniqueChars.length !== trimmedChars.length) {
      Alert.alert('Error', 'Los personajes deben ser diferentes');
      return;
    }
    
    // Agregar personajes del jugador actual
    setCharacters(prev => [...prev, ...trimmedChars]);
    
    // Actualizar personajes del jugador en la lista
    const currentPlayer = players[currentPlayerForChars];
    const updatedPlayers = [...players];
    updatedPlayers[currentPlayerForChars] = { ...currentPlayer, characters: trimmedChars };
    setPlayers(updatedPlayers);
    
    // Pasar al siguiente jugador o iniciar el juego
    if (currentPlayerForChars < players.length - 1) {
      setCurrentPlayerForChars(currentPlayerForChars + 1);
      setNewPlayerCharacters(Array(charsPerPlayer).fill(''));
    } else {
      // Todos los jugadores han ingresado sus personajes, iniciar juego
      const allChars = [...characters, ...trimmedChars];
      setRoundCharacters(allChars);
      // Seleccionar primer personaje aleatorio
      setCurrentCharacter(pickRandomCharacter(allChars, []));
      setIsPaused(true);
      setTimeLeft(parseInt(timePerRound) || 60);
      setGameState('round_intro');
      // Inicializar scores dinámicamente según número de equipos
      setScores(initializeScores());
    }
  };

  // Funciones para editar jugadores
  const startEditPlayer = (player: LocalPlayer) => {
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

    const charsPerPlayer = parseInt(charactersPerPlayer) || 2;
    const trimmedChars = editPlayerCharacters.map(c => c.trim()).filter(c => c);
    if (trimmedChars.length !== charsPerPlayer) {
      Alert.alert('Error', `Necesitas ${charsPerPlayer} personajes.`);
      return;
    }

    // Verificar que el nuevo equipo no esté lleno (si cambió de equipo)
    if (editPlayerTeam !== editingPlayer.team) {
      const targetTeamPlayers = players.filter(p => p.team === editPlayerTeam && p.id !== editingPlayer.id);
      const maxPerTeam = gameMode === 'pairs' ? 2 : Math.ceil((parseInt(numPlayers) || 4) / 2);
      if (targetTeamPlayers.length >= maxPerTeam) {
        Alert.alert('Error', `El ${gameMode === 'pairs' ? 'pareja' : 'equipo'} ${editPlayerTeam} está lleno`);
        return;
      }
    }

    // Actualizar jugador
    const updatedPlayers = players.map(p => {
      if (p.id === editingPlayer.id) {
        return { ...p, name: trimmedName, team: editPlayerTeam, characters: trimmedChars };
      }
      return p;
    });
    setPlayers(updatedPlayers);

    // Actualizar lista de personajes (remover los viejos, agregar los nuevos)
    const otherPlayersChars = updatedPlayers
      .filter(p => p.id !== editingPlayer.id)
      .flatMap(p => p.characters);
    setCharacters([...otherPlayersChars, ...trimmedChars]);

    cancelEditPlayer();
  };

  const deletePlayer = (playerId: number) => {
    Alert.alert(
      'Eliminar Jugador',
      '¿Estás seguro de que quieres eliminar este jugador?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const playerToDelete = players.find(p => p.id === playerId);
            if (!playerToDelete) return;

            // Liberar avatar
            setUsedAvatars(prev => prev.filter(a => a !== playerToDelete.avatar));

            // Remover jugador
            const updatedPlayers = players.filter(p => p.id !== playerId);
            setPlayers(updatedPlayers);

            // Remover personajes del jugador
            const newCharacters = characters.filter(c => !playerToDelete.characters.includes(c));
            setCharacters(newCharacters);

            // Si estaba editando este jugador, cancelar edición
            if (editingPlayer?.id === playerId) {
              cancelEditPlayer();
            }
          },
        },
      ]
    );
  };

  const handleEditCharacterChange = (index: number, value: string) => {
    const newChars = [...editPlayerCharacters];
    newChars[index] = value;
    setEditPlayerCharacters(newChars);
  };

  const totalCharactersNeeded = parseInt(numPlayers) * (parseInt(charactersPerPlayer) || 2);

  // CONFIG SCREEN
  if (gameState === 'config') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <View style={styles.headerTitle}>
                <Text style={styles.headerIcon}>🎮</Text>
                <Text style={styles.title}>Juego Local</Text>
              </View>
              <Button title="Volver" onPress={() => router.back()} variant="secondary" size="small" />
            </View>

            <Card>
              <Text style={styles.cardTitle}>Configurar Partida</Text>
              <Input 
                label="Número de jugadores" 
                value={numPlayers} 
                onChangeText={(val) => handleNumericInput(val, setNumPlayers)} 
                keyboardType="numeric" 
                placeholder="4" 
              />
              <Text style={styles.helperText}>Total de personajes: {totalCharactersNeeded}</Text>

              <Text style={styles.label}>Modo de juego</Text>
              <View style={styles.modeContainer}>
                <TouchableOpacity style={[styles.modeButton, gameMode === 'teams' && styles.modeButtonActive]} onPress={() => setGameMode('teams')}>
                  <Text style={[styles.modeText, gameMode === 'teams' && styles.modeTextActive]}>Equipos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modeButton, gameMode === 'pairs' && styles.modeButtonActive]} onPress={() => setGameMode('pairs')}>
                  <Text style={[styles.modeText, gameMode === 'pairs' && styles.modeTextActive]}>Parejas</Text>
                </TouchableOpacity>
              </View>

              <Input 
                label="Personajes por jugador" 
                value={charactersPerPlayer} 
                onChangeText={(val) => handleNumericInput(val, setCharactersPerPlayer)} 
                keyboardType="numeric" 
                placeholder="2" 
              />
              
              <Text style={styles.label}>Tiempo por ronda</Text>
              <View style={styles.timeOptionsContainer}>
                {timeOptions.map((time) => (
                  <TouchableOpacity 
                    key={time}
                    style={[
                      styles.timeOption, 
                      timePerRound === time.toString() && styles.timeOptionActive
                    ]} 
                    onPress={() => setTimePerRound(time.toString())}
                  >
                    <Text style={[
                      styles.timeOptionText,
                      timePerRound === time.toString() && styles.timeOptionTextActive
                    ]}>
                      {time}s
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Selector de tipo de categoría */}
              <Text style={styles.label}>Categoría de personajes</Text>
              <View style={styles.modeContainer}>
                <TouchableOpacity 
                  style={[styles.modeButton, !usePresetCategory && styles.modeButtonActive]} 
                  onPress={() => { 
                    setUsePresetCategory(false); 
                    setSelectedCategory(null); 
                    setMaxCharacters('');
                  }}
                >
                  <Text style={[styles.modeText, !usePresetCategory && styles.modeTextActive]}>Manual</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modeButton, usePresetCategory && styles.modeButtonActive]} 
                  onPress={() => setUsePresetCategory(true)}
                >
                  <Text style={[styles.modeText, usePresetCategory && styles.modeTextActive]}>Predefinida</Text>
                </TouchableOpacity>
              </View>

              {!usePresetCategory ? (
                <>
                  <Input 
                    label="Categoría (opcional)" 
                    value={category} 
                    onChangeText={setCategory} 
                    placeholder="Ej: Películas, Famosos, Anime..." 
                  />
                  {category ? (
                    <Text style={styles.categoryHint}>
                      📋 Los jugadores agregarán personajes de: {category}
                    </Text>
                  ) : null}
                </>
              ) : (
                <View style={styles.categoriesSection}>
                  <Text style={styles.categoriesLabel}>Selecciona una categoría:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryCard,
                          selectedCategory?.id === cat.id && styles.categoryCardActive
                        ]}
                        onPress={() => selectCategory(cat.id)}
                      >
                        <Text style={styles.categoryIcon}>{cat.icon}</Text>
                        <Text style={[
                          styles.categoryName,
                          selectedCategory?.id === cat.id && styles.categoryNameActive
                        ]}>{cat.name}</Text>
                        <Text style={styles.categoryCount}>{cat.characterCount} personajes</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  {selectedCategory && (
                    <View style={styles.selectedCategoryInfo}>
                      <Text style={styles.selectedCategoryTitle}>
                        {selectedCategory.icon} {selectedCategory.name}
                      </Text>
                      <Text style={styles.selectedCategoryDesc}>{selectedCategory.description}</Text>
                      <Text style={styles.selectedCategoryChars}>
                        ✅ {selectedCategory.characters.length} personajes disponibles
                      </Text>
                      
                      {/* Input para limitar personajes */}
                      <View style={styles.maxCharsContainer}>
                        <Input
                          label="Límite de personajes (opcional)"
                          value={maxCharacters}
                          onChangeText={setMaxCharacters}
                          keyboardType="numeric"
                          placeholder={`Máximo: ${selectedCategory.characters.length}`}
                          style={styles.maxCharsInput}
                        />
                        <Text style={styles.maxCharsHelper}>
                          {maxCharacters 
                            ? `Se usarán ${Math.min(parseInt(maxCharacters) || 0, selectedCategory.characters.length)} personajes (límite manual)`
                            : `Se usarán ${parseInt(numPlayers) * parseInt(charactersPerPlayer)} personajes (calculado automáticamente: ${numPlayers} jugadores × ${charactersPerPlayer} por jugador)`
                          }
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
              
              <Button 
                title="Continuar" 
                onPress={handleConfigSubmit} 
                size="large" 
                style={{ marginTop: 16 }}
                disabled={usePresetCategory && !selectedCategory}
              />
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // SETUP SCREEN
  if (gameState === 'setup') {
    const availableAvatars = LOCAL_AVATARS.filter(a => !usedAvatars.includes(a));
    
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Text style={styles.title}>Agregar Jugadores</Text>
              <Button title="Atrás" onPress={() => setGameState('config')} variant="secondary" size="small" />
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>Jugadores: {players.length} / {numPlayers}</Text>
              {usePresetCategory ? (
                <Text style={styles.infoText}>Personajes: {characters.length} (predefinidos)</Text>
              ) : (
                <Text style={styles.infoText}>Personajes: {characters.length} / {totalCharactersNeeded}</Text>
              )}
            </View>

            {category ? (
              <View style={styles.categoryBanner}>
                <Text style={styles.categoryBannerIcon}>🎯</Text>
                <View style={styles.categoryBannerContent}>
                  <Text style={styles.categoryBannerLabel}>CATEGORÍA</Text>
                  <Text style={styles.categoryBannerText}>{category}</Text>
                </View>
              </View>
            ) : null}

            {/* Mostrar formulario solo si no se alcanzó el límite */}
            {!isPlayerLimitReached() ? (
            <Card style={{ marginBottom: 16 }}>
              <Text style={styles.formTitle}>Agregar Jugador</Text>
              
              {/* Selector de Equipo/Pareja */}
              <Text style={styles.label}>
                {gameMode === 'pairs' ? 'Selecciona la pareja' : 'Selecciona el equipo'}
              </Text>
              <View style={styles.teamSelectorContainer}>
                {Array.from({ length: getNumTeams() }, (_, i) => i + 1).map((teamNum) => {
                  const teamPlayers = players.filter(p => p.team === teamNum);
                  const isFull = isTeamFull(teamNum);
                  const maxPlayers = gameMode === 'pairs' ? 2 : Math.ceil((parseInt(numPlayers) || 4) / 2);
                  
                  return (
                    <TouchableOpacity
                      key={teamNum}
                      style={[
                        styles.teamSelectorOption,
                        isFull && styles.teamSelectorDisabled,
                        selectedTeam === teamNum ? styles.teamSelectorActive : null,
                      ]}
                      onPress={() => !isFull && setSelectedTeam(teamNum)}
                      disabled={isFull}
                    >
                      <Text style={[
                        styles.teamSelectorText,
                        isFull && styles.teamSelectorTextDisabled,
                        selectedTeam === teamNum ? styles.teamSelectorTextActive : null,
                      ]}>
                        {gameMode === 'pairs' ? `Pareja ${teamNum}` : `Equipo ${teamNum}`}
                      </Text>
                      <Text style={[
                        styles.teamSelectorCount,
                        isFull && styles.teamSelectorTextDisabled,
                        selectedTeam === teamNum ? styles.teamSelectorTextActive : null,
                      ]}>
                        {teamPlayers.length}/{maxPlayers}
                      </Text>
                      {isFull && <Text style={styles.teamFullBadge}>LLENO</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
              
              {/* Avatar Selector */}
              <Text style={styles.label}>Elige tu avatar</Text>
              <View style={styles.avatarGrid}>
                {availableAvatars.map((avatar) => (
                  <TouchableOpacity
                    key={avatar}
                    style={[styles.avatarOption, selectedAvatar === avatar && styles.avatarSelected]}
                    onPress={() => setSelectedAvatar(avatar)}
                  >
                    <Text style={styles.avatarEmoji}>{avatar}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Input placeholder="Nombre del jugador" value={playerName} onChangeText={setPlayerName} />
              {!usePresetCategory && Array(parseInt(charactersPerPlayer) || 2).fill(0).map((_, index) => (
                <Input key={index} placeholder={`Personaje ${index + 1}`} value={playerCharacters[index] || ''} onChangeText={(value) => handleCharacterChange(index, value)} />
              ))}
              <Button title="Agregar Jugador" onPress={handleAddPlayer} />
            </Card>
            ) : (
              <Card style={styles.playerLimitCard}>
                <Text style={styles.playerLimitIcon}>✅</Text>
                <Text style={styles.playerLimitText}>¡Todos los jugadores agregados!</Text>
                <Text style={styles.playerLimitSubtext}>{players.length} de {numPlayers} jugadores</Text>
              </Card>
            )}

            {/* Formulario de edición de jugador */}
            {editingPlayer && (
              <Card style={styles.editPlayerCard}>
                <View style={styles.editPlayerHeader}>
                  <Text style={styles.editPlayerTitle}>✏️ Editar Jugador</Text>
                  <TouchableOpacity onPress={cancelEditPlayer} style={styles.editCloseBtn}>
                    <Text style={styles.editCloseBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.editPlayerAvatarRow}>
                  <Text style={styles.editPlayerAvatar}>{editingPlayer.avatar}</Text>
                </View>

                <Text style={styles.label}>Nombre</Text>
                <Input 
                  placeholder="Nombre del jugador" 
                  value={editPlayerName} 
                  onChangeText={setEditPlayerName} 
                />

                <Text style={styles.label}>
                  {gameMode === 'pairs' ? 'Pareja' : 'Equipo'}
                </Text>
                <View style={styles.teamSelectorContainer}>
                  {Array.from({ length: getNumTeams() }, (_, i) => i + 1).map((teamNum) => {
                    const teamPlayers = players.filter(p => p.team === teamNum && p.id !== editingPlayer.id);
                    const maxPlayers = gameMode === 'pairs' ? 2 : Math.ceil((parseInt(numPlayers) || 4) / 2);
                    const isFull = teamPlayers.length >= maxPlayers;
                    
                    return (
                      <TouchableOpacity
                        key={teamNum}
                        style={[
                          styles.teamSelectorOption,
                          isFull && styles.teamSelectorDisabled,
                          editPlayerTeam === teamNum ? styles.teamSelectorActive : null,
                        ]}
                        onPress={() => !isFull && setEditPlayerTeam(teamNum)}
                        disabled={isFull}
                      >
                        <Text style={[
                          styles.teamSelectorText,
                          isFull && styles.teamSelectorTextDisabled,
                          editPlayerTeam === teamNum ? styles.teamSelectorTextActive : null,
                        ]}>
                          {gameMode === 'pairs' ? `Pareja ${teamNum}` : `Equipo ${teamNum}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.label}>Personajes</Text>
                {Array(parseInt(charactersPerPlayer) || 2).fill(0).map((_, index) => (
                  <Input 
                    key={index} 
                    placeholder={`Personaje ${index + 1}`} 
                    value={editPlayerCharacters[index] || ''} 
                    onChangeText={(value) => handleEditCharacterChange(index, value)} 
                  />
                ))}

                <View style={styles.editButtonsRow}>
                  <Button title="Cancelar" onPress={cancelEditPlayer} variant="secondary" style={{ flex: 1 }} />
                  <Button title="Guardar" onPress={saveEditPlayer} style={{ flex: 1 }} />
                </View>
              </Card>
            )}

            {players.length > 0 && (
              <View style={styles.teamsColumn}>
                {Array.from({ length: getNumTeams() }, (_, i) => i + 1).map((teamNum) => {
                  const teamPlayers = players.filter(p => p.team === teamNum);
                  const teamColors = [colors.primary, colors.secondary, colors.warning, colors.success, colors.danger];
                  const teamColor = teamColors[(teamNum - 1) % teamColors.length];
                  
                  return (
                    <Card key={teamNum} style={styles.teamCardFull}>
                      <Text style={[styles.teamTitle, { color: teamColor }]}>
                        {gameMode === 'pairs' ? `Pareja ${teamNum}` : `Equipo ${teamNum}`}
                      </Text>
                      {teamPlayers.map((p) => (
                        <View key={p.id} style={styles.playerRowEditable}>
                          <View style={styles.playerRowLeft}>
                            <Text style={styles.playerAvatar}>{p.avatar}</Text>
                            <Text style={styles.playerName}>{capitalize(p.name)}</Text>
                          </View>
                          <View style={styles.playerActionsColumn}>
                            <TouchableOpacity onPress={() => startEditPlayer(p)} style={styles.editBtn}>
                              <Text style={styles.editBtnText}>✏️</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => deletePlayer(p.id)} style={styles.deleteBtn}>
                              <Text style={styles.deleteBtnText}>🗑️</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                      {teamPlayers.length === 0 && (
                        <Text style={styles.emptyTeamText}>Sin jugadores</Text>
                      )}
                    </Card>
                  );
                })}
              </View>
            )}

            {players.length >= parseInt(numPlayers) && (usePresetCategory || characters.length >= totalCharactersNeeded) && (
              <Button title="Iniciar Juego" onPress={handleStartGame} size="large" style={{ marginBottom: 40 }} />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // PLAYING SCREEN
  if (gameState === 'playing') {
    const currentPlayer = getCurrentPlayer();
    const team1Score = getTotalScore(1);
    const team2Score = getTotalScore(2);
    
    // Usar el personaje actual del estado (ya es aleatorio)
    const displayCharacter = currentCharacter;

    // Si no hay personaje disponible o está bloqueado, seleccionar uno nuevo
    if ((!displayCharacter || blockedCharacters.includes(displayCharacter)) && roundCharacters.length > 0) {
      const availableChars = roundCharacters.filter(c => !blockedCharacters.includes(c));
      if (availableChars.length === 0) {
        // Todos los personajes están bloqueados, terminar turno
        handleTimeUp();
      } else {
        // Seleccionar nuevo personaje aleatorio
        const newChar = pickRandomCharacter(roundCharacters, blockedCharacters);
        setCurrentCharacter(newChar);
      }
    }

    return (
      <SafeAreaView style={styles.playingContainer}>
        <Modal
          isOpen={showExitModal}
          onClose={() => setShowExitModal(false)}
          title="Salir del Juego"
          message="¿Estás seguro de que quieres salir del juego? Se perderá el progreso actual."
          onConfirm={handleExit}
          confirmText="Salir"
          cancelText="Cancelar"
          variant="danger"
        />
        {/* Header: Jugador actual con avatar */}
        <View style={styles.playingHeader}>
          <View style={styles.playerInfoBar}>
            <View style={styles.avatarWithCrown}>
              {currentPlayer && isPlayerMVP(currentPlayer.id) && (
                <Text style={styles.crownIcon}>👑</Text>
              )}
              <Text style={styles.playerAvatarLarge}>{currentPlayer?.avatar}</Text>
            </View>
            <View style={styles.playerInfoText}>
              <Text style={styles.playingPlayerName}>{currentPlayer ? capitalize(currentPlayer.name) : ''}</Text>
              <View style={styles.playerStatsRow}>
                <View style={[styles.teamBadgeSmall, currentTeam === 2 && styles.teamBadgeSmall2]}>
                  <Text style={styles.teamBadgeText}>Equipo {currentTeam}</Text>
                </View>
                {currentPlayer && (
                  <Text style={styles.playerMiniStats}>
                    ✓{getPlayerStats(currentPlayer.id).hits} ✗{getPlayerStats(currentPlayer.id).fails}
                  </Text>
                )}
              </View>
            </View>
            <View style={[styles.timerBadge, timeLeft <= 10 && styles.timerBadgeDanger]}>
              <Text style={styles.timerBadgeText}>{timeLeft}s</Text>
            </View>
          </View>
          
          {/* Info de ronda compacta */}
          <View style={styles.roundInfoBar}>
            <Text style={styles.roundInfoText}>Ronda {round} • {roundRules[round]}</Text>
          </View>
        </View>

{/* Centro: Personaje a adivinar */}
        <View style={styles.characterSection}>
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={() => setIsCardPressed(true)}
            onPressOut={() => setIsCardPressed(false)}
            style={styles.characterTouchable}
          >
            <Animated.View style={[
              styles.characterMainCard, 
              { transform: [{ scale: cardScale }] },
              !isCardPressed && styles.characterCardHidden
            ]}>
              {isCardPressed ? (
                <Text style={styles.characterMainName}>
                  {displayCharacter?.toUpperCase() || 'SIN TARJETAS'}
                </Text>
              ) : (
                <View style={styles.hiddenCharacterContent}>
                  <Text style={styles.eyeIcon}>👁️</Text>
                  <Text style={styles.holdToRevealText}>MANTÉN PRESIONADO</Text>
                  <Text style={styles.holdToRevealSubtext}>para ver el personaje</Text>
                </View>
              )}
            </Animated.View>
          </TouchableOpacity>

          <Text style={styles.remainingText}>
            {roundCharacters.length} personajes restantes
          </Text>
        </View>

        {/* Footer: Botones de acción */}
        <View style={styles.actionSection}>
          <View style={styles.scoresCompact}>
            <View style={[styles.scoreCompactItem, currentTeam === 1 && styles.scoreCompactActive]}>
              <Text style={styles.scoreCompactLabel}>E1</Text>
              <Text style={styles.scoreCompactValue}>{team1Score}</Text>
            </View>
            <View style={[styles.scoreCompactItem, currentTeam === 2 && styles.scoreCompactActive]}>
              <Text style={[styles.scoreCompactLabel, { color: colors.secondary }]}>E2</Text>
              <Text style={styles.scoreCompactValue}>{team2Score}</Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.failButton} 
              onPress={handleFail}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>✗</Text>
              <Text style={styles.actionLabel}>FALLO</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.hitButton} 
              onPress={handleHit}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>✓</Text>
              <Text style={styles.actionLabel}>ACIERTO</Text>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 8 }}>
            <TouchableOpacity 
              style={styles.pauseButton}
              onPress={() => setIsPaused(!isPaused)}
            >
              <Text style={styles.pauseText}>{isPaused ? '▶ Reanudar' : '⏸ Pausar'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.pauseButton}
              onPress={() => setShowExitModal(true)}
            >
              <Text style={styles.pauseText}>🚪 Salir del Juego</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ROUND INTRO SCREEN - Instrucciones de la ronda (al inicio de turno)
  if (gameState === 'round_intro') {
    const roundInfo = roundDetails[round];
    const team1Score = getTotalScore(1);
    const team2Score = getTotalScore(2);

    return (
      <SafeAreaView style={styles.roundIntroContainer}>
        <Modal
          isOpen={showExitModal}
          onClose={() => setShowExitModal(false)}
          title="Salir del Juego"
          message="¿Estás seguro de que quieres salir del juego? Se perderá el progreso actual."
          onConfirm={handleExit}
          confirmText="Salir"
          cancelText="Cancelar"
          variant="danger"
        />
        <View style={styles.roundIntroContent}>
          {/* Número de ronda grande */}
          <View style={styles.roundNumberBadge}>
            <Text style={styles.roundNumberText}>RONDA {round}</Text>
          </View>

          {/* Icono y título */}
          <Text style={styles.roundIntroIcon}>{roundInfo.icon}</Text>
          <Text style={styles.roundIntroTitle}>{roundInfo.title}</Text>
          
          {/* Descripción principal */}
          <Text style={styles.roundIntroDescription}>{roundInfo.description}</Text>

          {/* Tips/Reglas */}
          <View style={styles.roundIntroTips}>
            {roundInfo.tips.map((tip, index) => (
              <View key={index} style={styles.tipRow}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          {/* Puntuaciones actuales */}
          {round > 1 && (
            <View style={styles.roundIntroScores}>
              <Text style={styles.roundIntroScoresTitle}>Puntuación actual</Text>
              <View style={styles.roundIntroScoresRow}>
                <View style={styles.roundIntroScoreItem}>
                  <Text style={styles.roundIntroScoreLabel}>Equipo 1</Text>
                  <Text style={styles.roundIntroScoreValue}>{team1Score}</Text>
                </View>
                <Text style={styles.roundIntroVs}>vs</Text>
                <View style={styles.roundIntroScoreItem}>
                  <Text style={[styles.roundIntroScoreLabel, { color: colors.secondary }]}>Equipo 2</Text>
                  <Text style={styles.roundIntroScoreValue}>{team2Score}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={{ width: '100%', gap: 8 }}>
          <Button 
            title="¡Comenzar Ronda!" 
            onPress={() => setGameState('waiting')} 
            size="large" 
            style={{ marginHorizontal: 24, marginBottom: 8 }} 
          />
          <TouchableOpacity
            onPress={() => setShowExitModal(true)}
            style={styles.pauseButton}
          >
            <Text style={styles.pauseText}>🚪 Salir del Juego</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ROUND INTRO MID-TURN - Cambio de ronda durante un turno (mantiene tiempo y jugador)
  if (gameState === 'round_intro_mid_turn') {
    const roundInfo = roundDetails[round];
    const currentPlayer = getCurrentPlayer();

    return (
      <SafeAreaView style={styles.roundIntroContainer}>
        <Modal
          isOpen={showExitModal}
          onClose={() => setShowExitModal(false)}
          title="Salir del Juego"
          message="¿Estás seguro de que quieres salir del juego? Se perderá el progreso actual."
          onConfirm={handleExit}
          confirmText="Salir"
          cancelText="Cancelar"
          variant="danger"
        />
        <View style={styles.roundIntroContent}>
          {/* Indicador de tiempo restante */}
          <View style={styles.midTurnTimerBadge}>
            <Text style={styles.midTurnTimerText}>⏱️ {timeLeft}s restantes</Text>
          </View>

          {/* Número de ronda grande */}
          <View style={[styles.roundNumberBadge, { backgroundColor: colors.warning }]}>
            <Text style={styles.roundNumberText}>¡NUEVA RONDA!</Text>
          </View>

          {/* Icono y título */}
          <Text style={styles.roundIntroIcon}>{roundInfo.icon}</Text>
          <Text style={styles.roundIntroTitle}>RONDA {round}: {roundInfo.title}</Text>
          
          {/* Descripción principal */}
          <Text style={styles.roundIntroDescription}>{roundInfo.description}</Text>

          {/* Jugador actual sigue */}
          <View style={styles.midTurnPlayerInfo}>
            <Text style={styles.midTurnPlayerLabel}>Sigues jugando:</Text>
            <View style={styles.midTurnPlayerRow}>
              <Text style={styles.midTurnPlayerAvatar}>{currentPlayer?.avatar}</Text>
              <Text style={styles.midTurnPlayerName}>{currentPlayer ? capitalize(currentPlayer.name) : ''}</Text>
            </View>
          </View>
        </View>

        <View style={{ width: '100%', gap: 8 }}>
          <Button 
            title="¡Continuar!" 
            onPress={() => {
              setIsCardPressed(false); // Ocultar personaje al continuar
              setIsPaused(false); // Reanudar el timer
              setGameState('playing');
            }} 
            size="large" 
            style={{ marginHorizontal: 24, marginBottom: 8 }} 
          />
          <TouchableOpacity
            onPress={() => setShowExitModal(true)}
            style={styles.pauseButton}
          >
            <Text style={styles.pauseText}>🚪 Salir del Juego</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // WAITING SCREEN - Pantalla de espera entre turnos
  if (gameState === 'waiting') {
    const nextPlayer = getCurrentPlayer();
    const team1Score = getTotalScore(1);
    const team2Score = getTotalScore(2);

    return (
      <SafeAreaView style={styles.waitingContainer}>
        <Modal
          isOpen={showExitModal}
          onClose={() => setShowExitModal(false)}
          title="Salir del Juego"
          message="¿Estás seguro de que quieres salir del juego? Se perderá el progreso actual."
          onConfirm={handleExit}
          confirmText="Salir"
          cancelText="Cancelar"
          variant="danger"
        />
        <Card style={styles.waitingCard}>
          <Text style={styles.waitingRound}>Ronda {round}</Text>
          <Text style={styles.waitingRule}>{roundRules[round]}</Text>
          
          <View style={styles.waitingDivider} />
          
          <Text style={styles.waitingLabel}>Siguiente turno:</Text>
          <View style={styles.waitingAvatarContainer}>
            {nextPlayer && isPlayerMVP(nextPlayer.id) && (
              <Text style={styles.waitingCrown}>👑</Text>
            )}
            <Text style={styles.waitingAvatarLarge}>{nextPlayer?.avatar}</Text>
          </View>
          <Text style={styles.waitingPlayerName}>{nextPlayer?.name}</Text>
          {nextPlayer && (
            <Text style={styles.waitingPlayerStats}>
              ✓ {getPlayerStats(nextPlayer.id).hits} aciertos • ✗ {getPlayerStats(nextPlayer.id).fails} fallos
            </Text>
          )}
          <View style={[styles.waitingTeamBadge, currentTeam === 2 && styles.waitingTeamBadge2]}>
            <Text style={styles.waitingTeamText}>Equipo {currentTeam}</Text>
          </View>
          
          <View style={styles.waitingScores}>
            <View style={styles.waitingScoreItem}>
              <Text style={styles.waitingScoreLabel}>Equipo 1</Text>
              <Text style={styles.waitingScoreValue}>{team1Score}</Text>
            </View>
            <View style={styles.waitingScoreItem}>
              <Text style={[styles.waitingScoreLabel, { color: colors.secondary }]}>Equipo 2</Text>
              <Text style={styles.waitingScoreValue}>{team2Score}</Text>
            </View>
          </View>

          <Text style={styles.waitingHint}>
            Pasa el dispositivo a {nextPlayer?.name}
          </Text>
          
          <Button 
            title="¡Estoy Listo!" 
            onPress={handlePlayerReady} 
            size="large" 
            style={{ marginTop: 24, width: '100%' }} 
          />
          <TouchableOpacity
            onPress={() => setShowExitModal(true)}
            style={styles.pauseButton}
          >
            <Text style={styles.pauseText}>🚪 Salir del Juego</Text>
          </TouchableOpacity>
        </Card>
      </SafeAreaView>
    );
  }

  // RECONFIG SCREEN - Reconfigurar categoría y personajes por jugador (jugar otra vez)
  if (gameState === 'reconfig') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <View style={styles.headerTitle}>
                <Text style={styles.headerIcon}>🔄</Text>
                <Text style={styles.title}>Reconfigurar Partida</Text>
              </View>
            </View>

            {/* Info de jugadores conservados */}
            <Card style={styles.playersPreservedCard}>
              <Text style={styles.playersPreservedTitle}>✅ Jugadores Conservados</Text>
              <Text style={styles.playersPreservedText}>
                Se mantendrán los {players.length} jugadores actuales
              </Text>
              <View style={styles.playersPreservedList}>
                {players.map((p) => (
                  <View key={p.id} style={styles.preservedPlayerItem}>
                    <Text style={styles.preservedPlayerAvatar}>{p.avatar}</Text>
                    <Text style={styles.preservedPlayerName}>{capitalize(p.name)}</Text>
                  </View>
                ))}
              </View>
            </Card>

            <Card>
              <Text style={styles.cardTitle}>Cambiar Configuración</Text>
              
              {/* Personajes por jugador */}
              <Input 
                label="Personajes por jugador" 
                value={charactersPerPlayer} 
                onChangeText={(val) => handleNumericInput(val, setCharactersPerPlayer)} 
                keyboardType="numeric" 
                placeholder="2" 
              />
              <Text style={styles.helperText}>
                Total de personajes: {players.length * (parseInt(charactersPerPlayer) || 2)} ({charactersPerPlayer} por jugador × {players.length} jugadores)
              </Text>

              {/* Selector de tipo de categoría */}
              <Text style={styles.label}>Categoría de personajes</Text>
              <View style={styles.modeContainer}>
                <TouchableOpacity 
                  style={[styles.modeButton, !usePresetCategory && styles.modeButtonActive]} 
                  onPress={() => { 
                    setUsePresetCategory(false); 
                    setSelectedCategory(null); 
                    setMaxCharacters('');
                  }}
                >
                  <Text style={[styles.modeText, !usePresetCategory && styles.modeTextActive]}>Manual</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modeButton, usePresetCategory && styles.modeButtonActive]} 
                  onPress={() => setUsePresetCategory(true)}
                >
                  <Text style={[styles.modeText, usePresetCategory && styles.modeTextActive]}>Predefinida</Text>
                </TouchableOpacity>
              </View>

              {!usePresetCategory ? (
                <>
                  <Input 
                    label="Categoría (opcional)" 
                    value={category} 
                    onChangeText={setCategory} 
                    placeholder="Ej: Películas, Famosos, Anime..." 
                  />
                  {category ? (
                    <Text style={styles.categoryHint}>
                      📋 Los jugadores agregarán personajes de: {category}
                    </Text>
                  ) : null}
                </>
              ) : (
                <View style={styles.categoriesSection}>
                  <Text style={styles.categoriesLabel}>Selecciona una categoría:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryCard,
                          selectedCategory?.id === cat.id && styles.categoryCardActive
                        ]}
                        onPress={() => selectCategory(cat.id)}
                      >
                        <Text style={styles.categoryIcon}>{cat.icon}</Text>
                        <Text style={[
                          styles.categoryName,
                          selectedCategory?.id === cat.id && styles.categoryNameActive
                        ]}>{cat.name}</Text>
                        <Text style={styles.categoryCount}>{cat.characterCount} personajes</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  {selectedCategory && (
                    <View style={styles.selectedCategoryInfo}>
                      <Text style={styles.selectedCategoryTitle}>
                        {selectedCategory.icon} {selectedCategory.name}
                      </Text>
                      <Text style={styles.selectedCategoryDesc}>{selectedCategory.description}</Text>
                      <Text style={styles.selectedCategoryChars}>
                        ✅ {selectedCategory.characters.length} personajes disponibles
                      </Text>
                      
                      {/* Input para limitar personajes */}
                      <View style={styles.maxCharsContainer}>
                        <Input
                          label="Límite de personajes (opcional)"
                          value={maxCharacters}
                          onChangeText={setMaxCharacters}
                          keyboardType="numeric"
                          placeholder={`Máximo: ${selectedCategory.characters.length}`}
                          style={styles.maxCharsInput}
                        />
                        <Text style={styles.maxCharsHelper}>
                          {maxCharacters 
                            ? `Se usarán ${Math.min(parseInt(maxCharacters) || 0, selectedCategory.characters.length)} personajes (límite manual)`
                            : `Se usarán ${players.length * parseInt(charactersPerPlayer)} personajes (calculado automáticamente: ${players.length} jugadores × ${charactersPerPlayer} por jugador)`
                          }
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
              
              <Button 
                title="Continuar" 
                onPress={handleReconfigSubmit} 
                size="large" 
                style={{ marginTop: 16 }}
                disabled={usePresetCategory && !selectedCategory}
              />
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // NEW CHARACTERS SCREEN - Pantalla para ingresar nuevos personajes (jugar otra vez)
  if (gameState === 'new_characters') {
    const currentPlayer = players[currentPlayerForChars];
    const charsPerPlayer = parseInt(charactersPerPlayer) || 2;
    
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Text style={styles.title}>Nuevos Personajes</Text>
              <Text style={styles.newCharsProgress}>
                {currentPlayerForChars + 1} / {players.length}
              </Text>
            </View>

            {category ? (
              <View style={styles.categoryBanner}>
                <Text style={styles.categoryBannerIcon}>🎯</Text>
                <View style={styles.categoryBannerContent}>
                  <Text style={styles.categoryBannerLabel}>CATEGORÍA</Text>
                  <Text style={styles.categoryBannerText}>{category}</Text>
                </View>
              </View>
            ) : null}

            <Card style={styles.newCharsCard}>
              <View style={styles.newCharsPlayerInfo}>
                <Text style={styles.newCharsAvatar}>{currentPlayer?.avatar}</Text>
                <View>
                  <Text style={styles.newCharsPlayerName}>{currentPlayer ? capitalize(currentPlayer.name) : ''}</Text>
                  <Text style={styles.newCharsTeam}>
                    {gameMode === 'pairs' ? `Pareja ${currentPlayer?.team}` : `Equipo ${currentPlayer?.team}`}
                  </Text>
                </View>
              </View>

              <Text style={styles.newCharsLabel}>
                Ingresa {charsPerPlayer} personajes nuevos:
              </Text>
              
              {Array(charsPerPlayer).fill(0).map((_, index) => (
                <Input 
                  key={index} 
                  placeholder={`Personaje ${index + 1}`} 
                  value={newPlayerCharacters[index] || ''} 
                  onChangeText={(value) => handleNewCharacterChange(index, value)} 
                />
              ))}

              <Button 
                title={currentPlayerForChars < players.length - 1 ? "Siguiente Jugador →" : "¡Comenzar Juego!"} 
                onPress={confirmNewCharacters} 
                size="large"
                style={{ marginTop: 16 }}
              />
            </Card>

            {/* Lista de jugadores pendientes */}
            <View style={styles.pendingPlayersSection}>
              <Text style={styles.pendingPlayersTitle}>Jugadores:</Text>
              <View style={styles.pendingPlayersList}>
                {players.map((player, index) => (
                  <View 
                    key={player.id} 
                    style={[
                      styles.pendingPlayerItem,
                      index < currentPlayerForChars && styles.pendingPlayerDone,
                      index === currentPlayerForChars && styles.pendingPlayerCurrent,
                    ]}
                  >
                    <Text style={styles.pendingPlayerAvatar}>{player.avatar}</Text>
                    {index < currentPlayerForChars && <Text style={styles.pendingPlayerCheck}>✓</Text>}
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // FINISHED SCREEN
  if (gameState === 'finished') {
    const team1Score = getTotalScore(1);
    const team2Score = getTotalScore(2);
    const rankedPlayers = getPlayerRanking();
    const mvpPlayer = rankedPlayers[0];
    const mvpStats = mvpPlayer ? getPlayerStats(mvpPlayer.id) : { hits: 0, fails: 0 };

    return (
      <SafeAreaView style={styles.finishedContainer}>
        <ScrollView contentContainerStyle={styles.finishedScroll}>
          {/* Resultado del equipo ganador */}
          <View style={styles.winnerSection}>
            <Text style={styles.trophyIcon}>🏆</Text>
            <Text style={styles.finishedTitle}>¡Juego Terminado!</Text>
            <View style={styles.finalScoresRow}>
              <View style={[styles.finalScore, team1Score > team2Score && styles.winnerTeamHighlight]}>
                <Text style={styles.finalTeamLabel}>Equipo 1</Text>
                <Text style={styles.finalScoreValue}>{team1Score}</Text>
              </View>
              <Text style={styles.vsText}>vs</Text>
              <View style={[styles.finalScore, team2Score > team1Score && styles.winnerTeamHighlight]}>
                <Text style={[styles.finalTeamLabel, { color: colors.secondary }]}>Equipo 2</Text>
                <Text style={styles.finalScoreValue}>{team2Score}</Text>
              </View>
            </View>
            <Text style={styles.winnerText}>
              {team1Score > team2Score ? '🎉 ¡Equipo 1 Gana!' : team2Score > team1Score ? '🎉 ¡Equipo 2 Gana!' : '🤝 ¡Empate!'}
            </Text>
          </View>

          {/* MVP del juego */}
          {mvpPlayer && mvpStats.hits > 0 && (
            <Card style={styles.mvpCard}>
              <Text style={styles.mvpTitle}>⭐ MVP del Juego ⭐</Text>
              <View style={styles.mvpContent}>
                <View style={styles.mvpAvatarSection}>
                  <Text style={styles.mvpCrown}>👑</Text>
                  <Text style={styles.mvpAvatar}>{mvpPlayer.avatar}</Text>
                </View>
                <View style={styles.mvpInfo}>
                  <Text style={styles.mvpName}>{capitalize(mvpPlayer.name)}</Text>
                  <Text style={styles.mvpTeam}>Equipo {mvpPlayer.team}</Text>
                  <View style={styles.mvpStatsRow}>
                    <Text style={styles.mvpStatHits}>✓ {mvpStats.hits}</Text>
                    <Text style={styles.mvpStatFails}>✗ {mvpStats.fails}</Text>
                  </View>
                </View>
              </View>
            </Card>
          )}

          {/* Ranking de todos los jugadores */}
          <Card style={styles.rankingCard}>
            <Text style={styles.rankingTitle}>📊 Estadísticas de Jugadores</Text>
            {rankedPlayers.map((player, index) => {
              const stats = getPlayerStats(player.id);
              const isFirst = index === 0 && stats.hits > 0;
              return (
                <View key={player.id} style={[styles.rankingRow, isFirst && styles.rankingRowFirst]}>
                  <Text style={styles.rankingPosition}>#{index + 1}</Text>
                  <Text style={styles.rankingAvatar}>{player.avatar}</Text>
                  <View style={styles.rankingInfo}>
                    <View style={styles.rankingNameRow}>
                      <Text style={styles.rankingName}>{capitalize(player.name)}</Text>
                      {isFirst && <Text style={styles.rankingCrown}>👑</Text>}
                    </View>
                    <Text style={styles.rankingTeam}>Equipo {player.team}</Text>
                  </View>
                  <View style={styles.rankingStats}>
                    <Text style={styles.rankingHits}>✓ {stats.hits}</Text>
                    <Text style={styles.rankingFails}>✗ {stats.fails}</Text>
                  </View>
                </View>
              );
            })}
          </Card>

          {/* Botones de acción */}
          <View style={styles.finishedActions}>
            <Button title="🔄 Jugar Otra Vez (mismos jugadores)" onPress={playAgain} size="large" />
            <Button title="🆕 Nueva Partida" onPress={resetGame} variant="outline" size="large" />
            <Button title="Volver al Menú" onPress={() => router.back()} variant="secondary" size="large" />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerTitle: { flexDirection: 'row', alignItems: 'center' },
  headerIcon: { fontSize: 28, marginRight: 12 },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  helperText: { color: colors.textMuted, fontSize: 12, marginTop: -8, marginBottom: 16 },
  categoryHint: { color: colors.primary, fontSize: 13, marginTop: 4, marginBottom: 8, fontStyle: 'italic' },
  categoryBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, borderRadius: 12, padding: 12, marginBottom: 16 },
  categoryBannerIcon: { fontSize: 28, marginRight: 12 },
  categoryBannerContent: { flex: 1 },
  categoryBannerLabel: { color: colors.text, fontSize: 10, fontWeight: '600', letterSpacing: 1, opacity: 0.8 },
  categoryBannerText: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  label: { color: colors.textSecondary, fontSize: 14, fontWeight: '500', marginBottom: 8, marginTop: 8 },
  modeContainer: { flexDirection: 'row', backgroundColor: colors.surfaceLight, borderRadius: 12, padding: 4, marginBottom: 16 },
  modeButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modeButtonActive: { backgroundColor: colors.primary },
  modeText: { color: colors.textMuted, fontWeight: '500' },
  modeTextActive: { color: colors.text },
  timeOptionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  timeOption: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.surfaceLight, minWidth: 60, alignItems: 'center' },
  timeOptionActive: { backgroundColor: colors.primary },
  timeOptionText: { color: colors.textMuted, fontWeight: '600', fontSize: 15 },
  timeOptionTextActive: { color: colors.text },
  infoBox: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 },
  infoText: { color: colors.textMuted, fontSize: 14 },
  formTitle: { color: colors.text, fontWeight: 'bold', marginBottom: 12 },
  
  // Team/Pair selector styles
  teamSelectorContainer: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  teamSelectorOption: { flex: 1, backgroundColor: colors.surfaceLight, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  teamSelectorActive: { borderColor: colors.primary, backgroundColor: colors.surface },
  teamSelectorDisabled: { opacity: 0.5, backgroundColor: colors.surfaceLight },
  teamSelectorText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  teamSelectorTextActive: { color: colors.primary },
  teamSelectorTextDisabled: { color: colors.textMuted },
  teamSelectorCount: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  teamFullBadge: { color: colors.success, fontSize: 10, fontWeight: 'bold', marginTop: 4 },
  
  // Player limit card
  playerLimitCard: { marginBottom: 16, alignItems: 'center', paddingVertical: 24 },
  playerLimitIcon: { fontSize: 48, marginBottom: 8 },
  playerLimitText: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  playerLimitSubtext: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  
  // Avatar styles
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  avatarOption: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  avatarSelected: { borderColor: colors.primary, backgroundColor: colors.surface },
  avatarEmoji: { fontSize: 28 },
  
  // Team and player styles
  teamsRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  teamsColumn: { gap: 12, marginBottom: 16 },
  teamCard: { flex: 1 },
  teamCardFull: { width: '100%' },
  teamTitle: { color: colors.primary, fontWeight: 'bold', marginBottom: 8 },
  emptyTeamText: { color: colors.textMuted, fontSize: 12, fontStyle: 'italic', textAlign: 'center', paddingVertical: 8 },
  playerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  playerAvatar: { fontSize: 20, marginRight: 8 },
  playerName: { color: colors.text, fontSize: 14 },
  
  // Playing screen styles - redesigned
  playingContainer: { flex: 1, backgroundColor: colors.background },
  playingHeader: { paddingHorizontal: 16, paddingTop: 8 },
  playerInfoBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, padding: 12, marginBottom: 8 },
  avatarWithCrown: { position: 'relative', marginRight: 12 },
  crownIcon: { position: 'absolute', top: -12, left: '50%', marginLeft: -10, fontSize: 20, zIndex: 1 },
  playerAvatarLarge: { fontSize: 40 },
  playerInfoText: { flex: 1 },
  playingPlayerName: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  playerStatsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  playerMiniStats: { color: colors.textMuted, fontSize: 12 },
  teamBadgeSmall: { backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  teamBadgeSmall2: { backgroundColor: colors.secondary },
  teamBadgeText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  timerBadge: { backgroundColor: colors.primary, width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  timerBadgeDanger: { backgroundColor: colors.danger },
  timerBadgeText: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
  roundInfoBar: { backgroundColor: colors.surfaceLight, borderRadius: 8, padding: 8, alignItems: 'center' },
  roundInfoText: { color: colors.textSecondary, fontSize: 13 },
  
  // Character section
  characterSection: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  characterTouchable: { width: '100%' },
  characterMainCard: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, width: '100%', alignItems: 'center', borderWidth: 3, borderColor: colors.primary, minHeight: 150, justifyContent: 'center' },
  characterCardHidden: { backgroundColor: colors.surfaceLight, borderColor: colors.border, borderStyle: 'dashed' },
  characterMainName: { color: colors.text, fontSize: 36, fontWeight: 'bold', textAlign: 'center', letterSpacing: 1 },
  hiddenCharacterContent: { alignItems: 'center' },
  eyeIcon: { fontSize: 40, marginBottom: 12, opacity: 0.6 },
  holdToRevealText: { color: colors.textSecondary, fontSize: 16, fontWeight: '600', letterSpacing: 1 },
  holdToRevealSubtext: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  remainingText: { color: colors.textMuted, fontSize: 14, marginTop: 16 },
  
  // Action section
  actionSection: { paddingHorizontal: 16, paddingBottom: 24 },
  scoresCompact: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 16 },
  scoreCompactItem: { alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 12 },
  scoreCompactActive: { borderWidth: 2, borderColor: colors.primary },
  scoreCompactLabel: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  scoreCompactValue: { color: colors.text, fontSize: 24, fontWeight: 'bold' },
  actionButtons: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  hitButton: { flex: 1, backgroundColor: colors.success, borderRadius: 16, paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
  failButton: { flex: 1, backgroundColor: colors.danger, borderRadius: 16, paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
  actionIcon: { color: colors.text, fontSize: 32, fontWeight: 'bold' },
  actionLabel: { color: colors.text, fontSize: 14, fontWeight: '700', marginTop: 4 },
  pauseButton: { alignItems: 'center', padding: 8 },
  pauseText: { color: colors.textMuted, fontSize: 14 },
  
  // Legacy styles kept for compatibility
  roundCard: { alignItems: 'center', marginBottom: 16 },
  roundLabel: { color: colors.primary, fontSize: 14, fontWeight: '500' },
  roundRule: { color: colors.text, textAlign: 'center', marginTop: 4 },
  timerContainer: { alignItems: 'center', marginBottom: 16 },
  timerCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  timerDanger: { backgroundColor: colors.danger },
  timerText: { color: colors.text, fontSize: 40, fontWeight: 'bold' },
  scoresRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  scoreCard: { flex: 1, alignItems: 'center' },
  activeTeam: { borderColor: colors.primary, borderWidth: 2 },
  teamLabel: { color: colors.primary, fontSize: 14 },
  scoreValue: { color: colors.text, fontSize: 32, fontWeight: 'bold' },
  turnContainer: { alignItems: 'center', marginBottom: 20, backgroundColor: colors.surface, borderRadius: 16, padding: 16 },
  turnLabel: { color: colors.textMuted, fontSize: 14, marginBottom: 4 },
  turnPlayerName: { color: colors.primary, fontSize: 32, fontWeight: 'bold', textAlign: 'center' },
  turnTeam: { color: colors.textSecondary, fontSize: 16, marginTop: 4 },
  characterCard: { alignItems: 'center', paddingVertical: 40, marginBottom: 16 },
  characterName: { color: colors.text, fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  controlsRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  controlButton: { flex: 1 },
  progressText: { color: colors.textMuted, textAlign: 'center' },
  
  // Round intro screen
  roundIntroContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'space-between' },
  roundIntroContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  roundNumberBadge: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 8, borderRadius: 20, marginBottom: 24 },
  roundNumberText: { color: colors.text, fontSize: 16, fontWeight: 'bold', letterSpacing: 2 },
  roundIntroIcon: { fontSize: 80, marginBottom: 16 },
  roundIntroTitle: { color: colors.text, fontSize: 42, fontWeight: 'bold', marginBottom: 16, letterSpacing: 2 },
  roundIntroDescription: { color: colors.textSecondary, fontSize: 18, textAlign: 'center', marginBottom: 32, lineHeight: 26 },
  roundIntroTips: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, width: '100%', marginBottom: 24 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  tipBullet: { color: colors.primary, fontSize: 18, marginRight: 12, fontWeight: 'bold' },
  tipText: { color: colors.text, fontSize: 15, flex: 1, lineHeight: 22 },
  roundIntroScores: { alignItems: 'center', marginTop: 8 },
  roundIntroScoresTitle: { color: colors.textMuted, fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  roundIntroScoresRow: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  roundIntroScoreItem: { alignItems: 'center' },
  roundIntroScoreLabel: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  roundIntroScoreValue: { color: colors.text, fontSize: 32, fontWeight: 'bold' },
  roundIntroVs: { color: colors.textMuted, fontSize: 14 },
  
  // Mid-turn round intro styles
  midTurnTimerBadge: { backgroundColor: colors.surface, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginBottom: 16 },
  midTurnTimerText: { color: colors.warning, fontSize: 18, fontWeight: 'bold' },
  midTurnPlayerInfo: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, width: '100%', alignItems: 'center', marginTop: 16 },
  midTurnPlayerLabel: { color: colors.textMuted, fontSize: 14, marginBottom: 8 },
  midTurnPlayerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  midTurnPlayerAvatar: { fontSize: 40 },
  midTurnPlayerName: { color: colors.text, fontSize: 24, fontWeight: 'bold' },
  
  // Waiting screen
  waitingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', paddingHorizontal: 24 },
  waitingCard: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 },
  waitingRound: { color: colors.primary, fontSize: 18, fontWeight: '600', marginBottom: 4 },
  waitingRule: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 16 },
  waitingDivider: { width: '100%', height: 1, backgroundColor: colors.border, marginVertical: 16 },
  waitingLabel: { color: colors.textMuted, fontSize: 14, marginBottom: 8 },
  waitingAvatarContainer: { position: 'relative', alignItems: 'center' },
  waitingCrown: { position: 'absolute', top: -20, fontSize: 32, zIndex: 1 },
  waitingAvatarLarge: { fontSize: 64, marginBottom: 8 },
  waitingPlayerName: { color: colors.text, fontSize: 36, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  waitingPlayerStats: { color: colors.textMuted, fontSize: 13, marginBottom: 12 },
  waitingTeamBadge: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  waitingTeamBadge2: { backgroundColor: colors.secondary },
  waitingTeamText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  waitingScores: { flexDirection: 'row', gap: 48, marginTop: 24 },
  waitingScoreItem: { alignItems: 'center' },
  waitingScoreLabel: { color: colors.primary, fontSize: 12 },
  waitingScoreValue: { color: colors.text, fontSize: 28, fontWeight: 'bold' },
  waitingHint: { color: colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 24, fontStyle: 'italic' },
  
  // Finished screen
  finishedContainer: { flex: 1, backgroundColor: colors.background },
  finishedScroll: { padding: 24, paddingBottom: 40 },
  winnerSection: { alignItems: 'center', marginBottom: 24 },
  trophyIcon: { fontSize: 56, marginBottom: 8 },
  finishedTitle: { color: colors.text, fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
  finalScoresRow: { flexDirection: 'row', alignItems: 'center', gap: 24, marginBottom: 16 },
  finalScore: { alignItems: 'center', padding: 16, borderRadius: 16, backgroundColor: colors.surface },
  winnerTeamHighlight: { borderWidth: 2, borderColor: colors.warning },
  finalTeamLabel: { color: colors.primary, fontSize: 14, marginBottom: 4 },
  finalScoreValue: { color: colors.text, fontSize: 40, fontWeight: 'bold' },
  vsText: { color: colors.textMuted, fontSize: 16 },
  winnerText: { color: colors.text, fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  
  // MVP Card
  mvpCard: { marginBottom: 16, borderWidth: 2, borderColor: colors.warning },
  mvpTitle: { color: colors.warning, fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  mvpContent: { flexDirection: 'row', alignItems: 'center' },
  mvpAvatarSection: { position: 'relative', marginRight: 16 },
  mvpCrown: { position: 'absolute', top: -16, left: '50%', marginLeft: -12, fontSize: 24, zIndex: 1 },
  mvpAvatar: { fontSize: 56 },
  mvpInfo: { flex: 1 },
  mvpName: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  mvpTeam: { color: colors.textMuted, fontSize: 14, marginBottom: 8 },
  mvpStatsRow: { flexDirection: 'row', gap: 16 },
  mvpStatHits: { color: colors.success, fontSize: 18, fontWeight: 'bold' },
  mvpStatFails: { color: colors.danger, fontSize: 18, fontWeight: 'bold' },
  
  // Ranking Card
  rankingCard: { marginBottom: 24 },
  rankingTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  rankingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  rankingRowFirst: { backgroundColor: colors.surfaceLight, marginHorizontal: -16, paddingHorizontal: 16, borderRadius: 8, borderBottomWidth: 0 },
  rankingPosition: { color: colors.textMuted, fontSize: 14, fontWeight: 'bold', width: 30 },
  rankingAvatar: { fontSize: 28, marginRight: 12 },
  rankingInfo: { flex: 1 },
  rankingNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rankingName: { color: colors.text, fontSize: 16, fontWeight: '600' },
  rankingCrown: { fontSize: 14 },
  rankingTeam: { color: colors.textMuted, fontSize: 12 },
  rankingStats: { flexDirection: 'row', gap: 12 },
  rankingHits: { color: colors.success, fontSize: 14, fontWeight: 'bold' },
  rankingFails: { color: colors.danger, fontSize: 14, fontWeight: 'bold' },
  
  finishedActions: { gap: 12 },
  
  // New characters screen styles
  newCharsProgress: { color: colors.textMuted, fontSize: 14 },
  newCharsCard: { marginBottom: 16 },
  newCharsPlayerInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  newCharsAvatar: { fontSize: 48, marginRight: 16 },
  newCharsPlayerName: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  newCharsTeam: { color: colors.primary, fontSize: 14, marginTop: 2 },
  newCharsLabel: { color: colors.textSecondary, fontSize: 14, marginBottom: 12 },
  pendingPlayersSection: { marginTop: 8, marginBottom: 40 },
  pendingPlayersTitle: { color: colors.textMuted, fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  pendingPlayersList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pendingPlayerItem: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  pendingPlayerDone: { backgroundColor: colors.success, opacity: 0.8 },
  pendingPlayerCurrent: { borderWidth: 3, borderColor: colors.primary },
  pendingPlayerAvatar: { fontSize: 24 },
  pendingPlayerCheck: { position: 'absolute', bottom: -2, right: -2, backgroundColor: colors.success, color: colors.text, fontSize: 10, width: 16, height: 16, borderRadius: 8, textAlign: 'center', lineHeight: 16, overflow: 'hidden' },

  // Edit player styles
  editPlayerCard: { marginBottom: 16, borderWidth: 2, borderColor: colors.primary },
  editPlayerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  editPlayerTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  editCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  editCloseBtnText: { color: colors.textMuted, fontSize: 18, fontWeight: 'bold' },
  editPlayerAvatarRow: { alignItems: 'center', marginBottom: 12 },
  editPlayerAvatar: { fontSize: 48 },
  editButtonsRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  playerRowEditable: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  playerRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  playerActionsColumn: { flexDirection: 'row', gap: 8 },
  editBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  editBtnText: { fontSize: 14 },
  deleteBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.danger + '20', alignItems: 'center', justifyContent: 'center' },
  deleteBtnText: { fontSize: 14 },

  // Category selector styles (offline)
  categoriesSection: { marginTop: 8 },
  categoriesLabel: { color: colors.textSecondary, fontSize: 12, marginBottom: 8 },
  categoriesScroll: { marginBottom: 12 },
  categoryCard: { width: 120, backgroundColor: colors.surfaceLight, borderRadius: 12, padding: 12, marginRight: 10, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  categoryCardActive: { borderColor: colors.primary, backgroundColor: colors.surface },
  categoryIcon: { fontSize: 32, marginBottom: 8 },
  categoryName: { color: colors.text, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  categoryNameActive: { color: colors.primary },
  categoryCount: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  selectedCategoryInfo: { backgroundColor: colors.primary + '15', borderRadius: 12, padding: 12, borderLeftWidth: 4, borderLeftColor: colors.primary },
  selectedCategoryTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  selectedCategoryDesc: { color: colors.textSecondary, fontSize: 13, marginBottom: 4 },
  selectedCategoryChars: { color: colors.success, fontSize: 12, fontWeight: '500' },
  maxCharsContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  maxCharsInput: { marginBottom: 4 },
  maxCharsHelper: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  
  // Reconfig screen styles
  playersPreservedCard: { marginBottom: 16, backgroundColor: colors.success + '15', borderWidth: 2, borderColor: colors.success },
  playersPreservedTitle: { color: colors.success, fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  playersPreservedText: { color: colors.text, fontSize: 14, marginBottom: 12 },
  playersPreservedList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preservedPlayerItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  preservedPlayerAvatar: { fontSize: 20 },
  preservedPlayerName: { color: colors.text, fontSize: 13, fontWeight: '500' },
});
