import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
  Pressable,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Input, Card, Modal } from '../../src/components';
import { colors, shadows, theme, gradients } from '../../src/theme';
import { OFFLINE_CATEGORIES, getCategoryById, getCategoriesForUI } from '../../src/data/categories';
import { LocalPlayer, LOCAL_AVATARS } from '../../src/types';

const timeOptions = [30, 60, 90, 120, 150, 180];

const roundRules: Record<number, string> = {
  1: 'Puedes decir todas las palabras excepto las del personaje',
  2: 'Solo puedes decir UNA palabra',
  3: 'Solo mímica. No puedes hablar',
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

type GameState = 'config' | 'setup' | 'playing' | 'waiting' | 'round_intro' | 'round_intro_mid_turn' | 'finished' | 'new_characters' | 'reconfig';

export default function LocalGameScreen() {
  const [gameState, setGameState] = useState<GameState>('config');
  const [numPlayers, setNumPlayers] = useState('4');
  const [gameMode, setGameMode] = useState<'teams' | 'pairs'>('teams');
  const [charactersPerPlayer, setCharactersPerPlayer] = useState('2');
  const [timePerRound, setTimePerRound] = useState('60');
  const [category, setCategory] = useState('');
  const [usePresetCategory, setUsePresetCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<typeof OFFLINE_CATEGORIES[0] | null>(null);
  const [maxCharacters, setMaxCharacters] = useState('');
  const categories = getCategoriesForUI();
  const [players, setPlayers] = useState<LocalPlayer[]>([]);
  const [roundPlayerIndex, setRoundPlayerIndex] = useState(0);
  const [globalPlayerIndex, setGlobalPlayerIndex] = useState(0);
  const [characters, setCharacters] = useState<string[]>([]);
  const [currentCharacter, setCurrentCharacter] = useState<string | null>(null);
  const [roundCharacters, setRoundCharacters] = useState<string[]>([]);
  const [round, setRound] = useState(1);
  const [currentTeam, setCurrentTeam] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPaused, setIsPaused] = useState(false);
  const [scores, setScores] = useState<{
    round1: Record<string, number>;
    round2: Record<string, number>;
    round3: Record<string, number>;
  }>({
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
  const [selectedTeam, setSelectedTeam] = useState(1);
  const [blockedCharacters, setBlockedCharacters] = useState<string[]>([]);
  const [playerStats, setPlayerStats] = useState<Record<number, { hits: number; fails: number }>>({});
  const [isCardPressed, setIsCardPressed] = useState(false);
  const [currentPlayerForChars, setCurrentPlayerForChars] = useState(0);
  const [newPlayerCharacters, setNewPlayerCharacters] = useState<string[]>([]);
  const [editingPlayer, setEditingPlayer] = useState<LocalPlayer | null>(null);
  const [editPlayerName, setEditPlayerName] = useState('');
  const [editPlayerTeam, setEditPlayerTeam] = useState(1);
  const [editPlayerCharacters, setEditPlayerCharacters] = useState<string[]>([]);
  const cardScaleRef = useRef(new Animated.Value(1));
  const [showExitModal, setShowExitModal] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleNumericInput = (value: string, setter: (val: string) => void) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setter(numericValue);
  };

  const capitalize = (text: string) => {
    return text.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const handleExit = () => {
    resetGame();
    router.replace('/(app)/dashboard');
  };

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
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [gameState, isPaused, timeLeft]);

  useEffect(() => {
    setPlayerCharacters(Array(parseInt(charactersPerPlayer) || 2).fill(''));
  }, [charactersPerPlayer]);

  const selectCategory = (categoryId: number) => {
    const category = getCategoryById(categoryId);
    if (category) {
      setSelectedCategory(category);
      setMaxCharacters('');
    }
  };

  const handleCharacterChange = (index: number, value: string) => {
    const newChars = [...playerCharacters];
    newChars[index] = value;
    setPlayerCharacters(newChars);
  };

  const getNumTeams = () => {
    if (gameMode === 'pairs') {
      return Math.ceil((parseInt(numPlayers) || 4) / 2);
    }
    return 2;
  };

  const isTeamFull = (teamNum: number) => {
    const playersInTeam = players.filter(p => p.team === teamNum).length;
    if (gameMode === 'pairs') {
      return playersInTeam >= 2;
    }
    const numPlayersInt = parseInt(numPlayers) || 4;
    const maxPerTeam = Math.ceil(numPlayersInt / 2);
    return playersInTeam >= maxPerTeam;
  };

  const isPlayerLimitReached = () => {
    const numPlayersInt = parseInt(numPlayers) || 4;
    return players.length >= numPlayersInt;
  };

  const handleAddPlayer = () => {
    const numPlayersInt = parseInt(numPlayers) || 4;

    if (players.length >= numPlayersInt) {
      Alert.alert('Error', `Ya se alcanzó el límite de ${numPlayersInt} jugadores`);
      return;
    }

    if (!playerName.trim()) {
      Alert.alert('Error', 'Ingresa el nombre del jugador');
      return;
    }

    const charsPerPlayer = parseInt(charactersPerPlayer) || 2;

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

    if (isTeamFull(selectedTeam)) {
      Alert.alert('Error', `${gameMode === 'pairs' ? 'La pareja' : 'El equipo'} ${selectedTeam} ya está completo`);
      return;
    }

    const newPlayer: LocalPlayer = {
      id: Date.now(),
      name: playerName.trim(),
      team: selectedTeam,
      characters: trimmedChars,
      avatar: selectedAvatar,
    };

    setPlayers([...players, newPlayer]);
    
    if (!usePresetCategory) {
      setCharacters([...characters, ...trimmedChars]);
    }
    
    setUsedAvatars([...usedAvatars, selectedAvatar]);
    const nextAvatar = LOCAL_AVATARS.find(a => !usedAvatars.includes(a) && a !== selectedAvatar);
    if (nextAvatar) setSelectedAvatar(nextAvatar);
    setPlayerName('');
    setPlayerCharacters(Array(charsPerPlayer).fill(''));
    
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
    const initialScores: typeof scores = {
      round1: {},
      round2: {},
      round3: {},
    };
    for (let i = 1; i <= numTeams; i++) {
      initialScores.round1[`team${i}`] = 0;
      initialScores.round2[`team${i}`] = 0;
      initialScores.round3[`team${i}`] = 0;
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
    setCharacters(allChars);
    setRoundCharacters(allChars);
    setCurrentCharacter(pickRandomCharacter(allChars, []));
    setIsPaused(true);
    setGameState('round_intro');
    setRoundPlayerIndex(0);
    setGlobalPlayerIndex(0);
    setCurrentTeam(1);
    setTimeLeft(parseInt(timePerRound) || 60);
    setScores(initializeScores());
  };

  const getNextTurn = (playersList: LocalPlayer[], currentGlobalIndex: number) => {
    const playersByTeam: Record<number, LocalPlayer[]> = {};
    playersList.forEach((player) => {
      const team = player.team;
      if (!playersByTeam[team]) {
        playersByTeam[team] = [];
      }
      playersByTeam[team].push(player);
    });

    const teams = Object.keys(playersByTeam).map(Number).sort((a, b) => a - b);
    const totalTeams = teams.length;
    const maxPlayersPerTeam = Math.max(...teams.map(team => playersByTeam[team].length));

    const nextGlobalIndex = currentGlobalIndex + 1;
    const playerPosition = Math.floor(nextGlobalIndex / totalTeams);
    const teamIndex = nextGlobalIndex % totalTeams;
    const nextTeam = teams[teamIndex];
    
    const teamPlayers = playersByTeam[nextTeam] || [];
    const playerIndexInTeam = playerPosition % teamPlayers.length;
    
    if (playerPosition >= maxPlayersPerTeam && teamIndex === 0) {
      return {
        team: teams[0],
        playerIndexInTeam: 0,
        globalIndex: 0
      };
    }

    return {
      team: nextTeam,
      playerIndexInTeam: playerIndexInTeam,
      globalIndex: nextGlobalIndex
    };
  };

  const getCurrentTurn = (playersList: LocalPlayer[], currentGlobalIndex: number) => {
    const playersByTeam: Record<number, LocalPlayer[]> = {};
    playersList.forEach((player) => {
      const team = player.team;
      if (!playersByTeam[team]) {
        playersByTeam[team] = [];
      }
      playersByTeam[team].push(player);
    });

    const teams = Object.keys(playersByTeam).map(Number).sort((a, b) => a - b);
    const totalTeams = teams.length;

    const playerPosition = Math.floor(currentGlobalIndex / totalTeams);
    const teamIndex = currentGlobalIndex % totalTeams;
    const currentTeamNum = teams[teamIndex];
    
    const teamPlayers = playersByTeam[currentTeamNum] || [];
    const playerIndexInTeam = playerPosition % teamPlayers.length;

    return {
      team: currentTeamNum,
      playerIndexInTeam: playerIndexInTeam
    };
  };

  const getCurrentPlayer = (): LocalPlayer | null => {
    const currentTurn = getCurrentTurn(players, globalPlayerIndex);
    const teamPlayers = players.filter(p => p.team === currentTurn.team);
    if (teamPlayers.length === 0) return null;
    return teamPlayers[currentTurn.playerIndexInTeam];
  };

  const getTotalScore = (team: number) => {
    const round1Score = scores.round1[`team${team}`] || 0;
    const round2Score = scores.round2[`team${team}`] || 0;
    const round3Score = scores.round3[`team${team}`] || 0;
    return round1Score + round2Score + round3Score;
  };

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

  const pickRandomCharacter = (availableChars: string[], blocked: string[] = []): string | null => {
    const pool = availableChars.filter(c => !blocked.includes(c));
    if (pool.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
  };

  const isPlayerMVP = (playerId: number) => {
    const mvpId = getMVP();
    if (mvpId === null) return false;
    const mvpStats = playerStats[mvpId];
    if (!mvpStats || mvpStats.hits === 0) return false;
    return playerId === mvpId;
  };

  const getPlayerStats = (playerId: number) => {
    return playerStats[playerId] || { hits: 0, fails: 0 };
  };

  const getPlayerRanking = () => {
    return [...players].sort((a, b) => {
      const statsA = getPlayerStats(a.id);
      const statsB = getPlayerStats(b.id);
      return statsB.hits - statsA.hits;
    });
  };

  const advanceAfterHit = () => {
    if (!currentCharacter) return;
    
    const newRoundCharacters = roundCharacters.filter(c => c !== currentCharacter);
    
    if (newRoundCharacters.length === 0) {
      if (round < 3) {
        setIsPaused(true);
        const newChars = [...characters];
        setRoundCharacters(newChars);
        setRound(round + 1);
        setBlockedCharacters([]);
        setCurrentCharacter(pickRandomCharacter(newChars, []));
        setGameState('round_intro_mid_turn');
      } else {
        setGameState('finished');
      }
    } else {
      setRoundCharacters(newRoundCharacters);
      const newChar = pickRandomCharacter(newRoundCharacters, blockedCharacters);
      setCurrentCharacter(newChar);
    }
  };

  const handleTimeUp = () => {
    const timePerRoundInt = parseInt(timePerRound) || 60;
    
    setIsPaused(true);
    
    const nextTurn = getNextTurn(players, globalPlayerIndex);
    
    if (roundCharacters.length === 0) {
      if (round < 3) {
        const newChars = [...characters];
        setRoundCharacters(newChars);
        setRound(round + 1);
        setBlockedCharacters([]);
        setCurrentCharacter(pickRandomCharacter(newChars, []));
        setGameState('round_intro');
      } else {
        setGameState('finished');
      }
    } else {
      setGlobalPlayerIndex(nextTurn.globalIndex);
      setCurrentTeam(nextTurn.team);
      setRoundPlayerIndex(nextTurn.playerIndexInTeam);
      setBlockedCharacters([]);
      setCurrentCharacter(pickRandomCharacter(roundCharacters, []));
      setTimeLeft(timePerRoundInt);
      setGameState('waiting');
    }
  };

  const handleHit = () => {
    setIsCardPressed(false);
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return;
    
    const roundKey = `round${round}` as keyof typeof scores;
    const teamKey = `team${currentPlayer.team}`;
    setScores((prev) => ({
      ...prev,
      [roundKey]: {
        ...prev[roundKey],
        [teamKey]: (prev[roundKey][teamKey] || 0) + 1,
      },
    }));
    
    setPlayerStats((prev) => ({
      ...prev,
      [currentPlayer.id]: {
        hits: (prev[currentPlayer.id]?.hits || 0) + 1,
        fails: prev[currentPlayer.id]?.fails || 0,
      },
    }));
    
    advanceAfterHit();
  };

  const handlePlayerReady = () => {
    setBlockedCharacters([]);
    setIsCardPressed(false);
    setIsPaused(false);
    setGameState('playing');
  };

  const handleFail = () => {
    const currentPlayer = getCurrentPlayer();
    
    if (currentPlayer) {
      setPlayerStats((prev) => ({
        ...prev,
        [currentPlayer.id]: {
          hits: prev[currentPlayer.id]?.hits || 0,
          fails: (prev[currentPlayer.id]?.fails || 0) + 1,
        },
      }));
    }
    
    if (currentCharacter) {
      setBlockedCharacters([...blockedCharacters, currentCharacter]);
    }
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
    setRoundPlayerIndex(0);
    setGlobalPlayerIndex(0);
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
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const playAgain = () => {
    setCharacters([]);
    setRoundCharacters([]);
    setCurrentCharacter(null);
    setRound(1);
    setCurrentTeam(1);
    setRoundPlayerIndex(0);
    setGlobalPlayerIndex(0);
    setScores({ round1: { team1: 0, team2: 0 }, round2: { team1: 0, team2: 0 }, round3: { team1: 0, team2: 0 } });
    setBlockedCharacters([]);
    setPlayerStats({});
    setIsCardPressed(false);
    setGameState('reconfig');
  };

  const handleConfigSubmit = () => {
    const numPlayersInt = parseInt(numPlayers) || 0;

    if (numPlayersInt < 2) {
      Alert.alert('Error', 'Debe haber al menos 2 jugadores');
      return;
    }

    if (gameMode === 'pairs' && numPlayersInt % 2 !== 0) {
      Alert.alert('Error', 'Para jugar en parejas, el número de jugadores debe ser par');
      return;
    }

    if (usePresetCategory && !selectedCategory) {
      Alert.alert('Error', 'Selecciona una categoría predefinida');
      return;
    }

    if (usePresetCategory && selectedCategory?.characters) {
      let categoryChars = [...selectedCategory.characters];
      const charsPerPlayer = parseInt(charactersPerPlayer) || 2;
      const calculatedMax = numPlayersInt * charsPerPlayer;
      
      let limitToUse: number;
      if (maxCharacters) {
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
        limitToUse = calculatedMax;
        if (limitToUse > categoryChars.length) {
          Alert.alert('Error', `Se necesitan ${limitToUse} personajes (${numPlayersInt} jugadores × ${charsPerPlayer} por jugador), pero la categoría solo tiene ${categoryChars.length} personajes disponibles`);
          return;
        }
      }
      
      categoryChars = shuffleArray(categoryChars);
      categoryChars = categoryChars.slice(0, limitToUse);
      
      setCharacters(categoryChars);
      setCategory(selectedCategory.name);
      
      setRoundCharacters(categoryChars);
      setCurrentCharacter(pickRandomCharacter(categoryChars, []));
      setIsPaused(true);
      setTimeLeft(parseInt(timePerRound) || 60);
      setGameState('round_intro');
      setScores(initializeScores());
    } else {
      setCharacters([]);
      setCurrentPlayerForChars(0);
      setNewPlayerCharacters(Array(parseInt(charactersPerPlayer) || 2).fill(''));
      setGameState('new_characters');
    }
  };

  const handleNewCharacterChange = (index: number, value: string) => {
    const newChars = [...newPlayerCharacters];
    newChars[index] = value;
    setNewPlayerCharacters(newChars);
  };

  const confirmNewCharacters = () => {
    if (usePresetCategory && characters.length > 0) {
      setRoundCharacters([...characters]);
      setCurrentCharacter(pickRandomCharacter(characters, []));
      setIsPaused(true);
      setTimeLeft(parseInt(timePerRound) || 60);
      setGameState('round_intro');
      setScores(initializeScores());
      return;
    }

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
    
    setCharacters(prev => [...prev, ...trimmedChars]);
    
    const currentPlayer = players[currentPlayerForChars];
    const updatedPlayers = [...players];
    updatedPlayers[currentPlayerForChars] = { ...currentPlayer, characters: trimmedChars };
    setPlayers(updatedPlayers);
    
    if (currentPlayerForChars < players.length - 1) {
      setCurrentPlayerForChars(currentPlayerForChars + 1);
      setNewPlayerCharacters(Array(charsPerPlayer).fill(''));
    } else {
      const allChars = [...characters, ...trimmedChars];
      setRoundCharacters(allChars);
      setCurrentCharacter(pickRandomCharacter(allChars, []));
      setIsPaused(true);
      setTimeLeft(parseInt(timePerRound) || 60);
      setGameState('round_intro');
      setScores(initializeScores());
    }
  };

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

    if (editPlayerTeam !== editingPlayer.team) {
      const targetTeamPlayers = players.filter(p => p.team === editPlayerTeam && p.id !== editingPlayer.id);
      const maxPerTeam = gameMode === 'pairs' ? 2 : Math.ceil((parseInt(numPlayers) || 4) / 2);
      if (targetTeamPlayers.length >= maxPerTeam) {
        Alert.alert('Error', `El ${gameMode === 'pairs' ? 'pareja' : 'equipo'} ${editPlayerTeam} está lleno`);
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

    const otherPlayersChars = updatedPlayers
      .filter(p => p.id !== editingPlayer.id)
      .flatMap(p => p.characters);
    setCharacters([...otherPlayersChars, ...trimmedChars]);

    cancelEditPlayer();
  };

  const deletePlayer = (playerId: number) => {
    Alert.alert(
      'Confirmar',
      '¿Estás seguro de que quieres eliminar este jugador?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const playerToDelete = players.find(p => p.id === playerId);
            if (!playerToDelete) return;

            setUsedAvatars(prev => prev.filter(a => a !== playerToDelete.avatar));

            const updatedPlayers = players.filter(p => p.id !== playerId);
            setPlayers(updatedPlayers);

            const newCharacters = characters.filter(c => !playerToDelete.characters.includes(c));
            setCharacters(newCharacters);

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

  const handleReconfigSubmit = () => {
    const numPlayersInt = players.length;

    if (numPlayersInt < 2) {
      Alert.alert('Error', 'Debe haber al menos 2 jugadores');
      return;
    }

    if (gameMode === 'pairs' && numPlayersInt % 2 !== 0) {
      Alert.alert('Error', 'Para jugar en parejas, el número de jugadores debe ser par');
      return;
    }
    
    setNumPlayers(numPlayersInt.toString());

    if (usePresetCategory && !selectedCategory) {
      Alert.alert('Error', 'Selecciona una categoría predefinida');
      return;
    }

    if (usePresetCategory && selectedCategory?.characters) {
      let categoryChars = [...selectedCategory.characters];
      const charsPerPlayer = parseInt(charactersPerPlayer) || 2;
      const calculatedMax = numPlayersInt * charsPerPlayer;
      
      let limitToUse: number;
      if (maxCharacters) {
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
        limitToUse = calculatedMax;
        if (limitToUse > categoryChars.length) {
          Alert.alert('Error', `Se necesitan ${limitToUse} personajes (${numPlayersInt} jugadores × ${charsPerPlayer} por jugador), pero la categoría solo tiene ${categoryChars.length} personajes disponibles`);
          return;
        }
      }
      
      categoryChars = shuffleArray(categoryChars);
      categoryChars = categoryChars.slice(0, limitToUse);
      
      setCharacters(categoryChars);
      setCategory(selectedCategory.name);
      
      setRoundCharacters(categoryChars);
      setCurrentCharacter(pickRandomCharacter(categoryChars, []));
      setIsPaused(true);
      setTimeLeft(parseInt(timePerRound) || 60);
      setGameState('round_intro');
      setScores(initializeScores());
    } else {
      setCharacters([]);
      setCurrentPlayerForChars(0);
      setNewPlayerCharacters(Array(parseInt(charactersPerPlayer) || 2).fill(''));
      setGameState('new_characters');
    }
  };

  const totalCharactersNeeded = parseInt(numPlayers) * (parseInt(charactersPerPlayer) || 2);

  // CONFIG SCREEN
  if (gameState === 'config') {
    return (
      <LinearGradient colors={gradients.background} locations={[0, 1]} style={styles.gradientContainer}>
        <SafeAreaView style={styles.container}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <View style={styles.configHeader}>
              <View style={styles.configHeaderLeft}>
                <Text style={styles.configHeaderIcon}>🎮</Text>
                <Text style={styles.configHeaderTitle}>Juego Local</Text>
              </View>
              <Button title="Volver" onPress={() => router.replace('/(app)/dashboard')} variant="secondary" size="small" />
            </View>

            <Card style={styles.configCard}>
              <Text style={styles.configCardTitle}>Configurar Partida</Text>
              <Input
                label="Número de jugadores"
                value={numPlayers}
                onChangeText={(val) => handleNumericInput(val, setNumPlayers)}
                placeholder="4"
              />
              <Text style={styles.configHelperText}>
                Total de personajes: {totalCharactersNeeded}
              </Text>

              <Text style={styles.configLabel}>Modo de juego</Text>
              <View style={styles.configToggle}>
                <TouchableOpacity
                  style={[styles.configToggleOption, gameMode === 'teams' && styles.configToggleOptionActive]}
                  onPress={() => setGameMode('teams')}
                >
                  <Text style={[styles.configToggleText, gameMode === 'teams' && styles.configToggleTextActive]}>Equipos</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.configToggleOption, gameMode === 'pairs' && styles.configToggleOptionActive]}
                  onPress={() => setGameMode('pairs')}
                >
                  <Text style={[styles.configToggleText, gameMode === 'pairs' && styles.configToggleTextActive]}>Parejas</Text>
                </TouchableOpacity>
              </View>

              <Input
                label="Personajes por jugador"
                value={charactersPerPlayer}
                onChangeText={(val) => handleNumericInput(val, setCharactersPerPlayer)}
                placeholder="2"
              />
              
              <Text style={styles.configLabel}>Tiempo por ronda</Text>
              <View style={styles.timeOptionsRow}>
                {timeOptions.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[styles.timeOption, timePerRound === time.toString() && styles.timeOptionActive]}
                    onPress={() => setTimePerRound(time.toString())}
                  >
                    <Text style={[styles.timeOptionText, timePerRound === time.toString() && styles.timeOptionTextActive]}>
                      {time}s
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.configLabel}>Categoría de personajes</Text>
              <View style={styles.configToggle}>
                <TouchableOpacity
                  style={[styles.configToggleOption, !usePresetCategory && styles.configToggleOptionActive]}
                  onPress={() => {
                    setUsePresetCategory(false);
                    setSelectedCategory(null);
                    setMaxCharacters('');
                  }}
                >
                  <Text style={[styles.configToggleText, !usePresetCategory && styles.configToggleTextActive]}>Manual</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.configToggleOption, usePresetCategory && styles.configToggleOptionActive]}
                  onPress={() => setUsePresetCategory(true)}
                >
                  <Text style={[styles.configToggleText, usePresetCategory && styles.configToggleTextActive]}>Predefinida</Text>
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
                  {category && (
                    <Text style={styles.configCategoryHint}>
                      Los jugadores agregarán personajes de: {category}
                    </Text>
                  )}
                </>
              ) : (
                <View style={styles.categoriesSection}>
                  <Text style={styles.categoriesLabel}>Selecciona una categoría:</Text>
                  <View style={styles.categoriesGrid}>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.categoryCard, selectedCategory?.id === cat.id && styles.categoryCardSelected]}
                        onPress={() => selectCategory(cat.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.categoryIcon}>{cat.icon}</Text>
                        <Text style={[styles.categoryName, selectedCategory?.id === cat.id && styles.categoryNameSelected]}>
                          {cat.name}
                        </Text>
                        <Text style={styles.categoryCount}>{cat.characterCount} personajes</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {selectedCategory && (
                    <View style={styles.selectedCategoryCard}>
                      <Text style={styles.selectedCategoryTitle}>
                        {selectedCategory.icon} {selectedCategory.name}
                      </Text>
                      <Text style={styles.selectedCategoryDescription}>{selectedCategory.description}</Text>
                      <Text style={styles.selectedCategoryCount}>
                        ✅ {selectedCategory.characters.length} personajes disponibles
                      </Text>
                      
                      <View style={styles.selectedCategoryDivider} />
                      <Input
                        label="Límite de personajes (opcional)"
                        value={maxCharacters}
                        onChangeText={setMaxCharacters}
                        placeholder={`Máximo: ${selectedCategory.characters.length}`}
                      />
                      <Text style={styles.selectedCategoryHint}>
                        {maxCharacters
                          ? `Se usarán ${Math.min(parseInt(maxCharacters) || 0, selectedCategory.characters.length)} personajes (límite manual)`
                          : `Se usarán ${parseInt(numPlayers) * parseInt(charactersPerPlayer)} personajes (calculado automáticamente: ${numPlayers} jugadores × ${charactersPerPlayer} por jugador)`
                        }
                      </Text>
                    </View>
                  )}
                </View>
              )}
              
              <Button
                title="Continuar"
                onPress={handleConfigSubmit}
                size="large"
                fullWidth
                style={styles.configButton}
                disabled={usePresetCategory && !selectedCategory}
              />
            </Card>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // SETUP SCREEN
  if (gameState === 'setup') {
    const availableAvatars = LOCAL_AVATARS.filter(a => !usedAvatars.includes(a));
    
    return (
      <LinearGradient colors={gradients.background} locations={[0, 1]} style={styles.gradientContainer}>
        <SafeAreaView style={styles.container}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <View style={styles.setupHeader}>
              <Text style={styles.setupHeaderTitle}>Agregar Jugadores</Text>
              <Button title="Atrás" onPress={() => setGameState('config')} variant="secondary" size="small" />
            </View>

            <View style={styles.setupInfoCard}>
              <Text style={styles.setupInfoText}>Jugadores: {players.length} / {numPlayers}</Text>
              {usePresetCategory ? (
                <Text style={styles.setupInfoText}>Personajes: {characters.length} (predefinidos)</Text>
              ) : (
                <Text style={styles.setupInfoText}>Personajes: {characters.length} / {totalCharactersNeeded}</Text>
              )}
            </View>

            {category && (
              <View style={styles.setupCategoryBanner}>
                {usePresetCategory && selectedCategory && (
                  <Text style={styles.setupCategoryIcon}>{selectedCategory.icon}</Text>
                )}
                <View style={styles.setupCategoryContent}>
                  <Text style={styles.setupCategoryLabel}>CATEGORÍA</Text>
                  <Text style={styles.setupCategoryName}>{category}</Text>
                </View>
              </View>
            )}

            {!isPlayerLimitReached() ? (
              <Card style={styles.addPlayerCard}>
                <Text style={styles.addPlayerTitle}>Agregar Jugador</Text>
                
                <Text style={styles.addPlayerLabel}>
                  {gameMode === 'pairs' ? 'Selecciona la pareja' : 'Selecciona el equipo'}
                </Text>
                <View style={styles.teamsSelector}>
                  {Array.from({ length: getNumTeams() }, (_, i) => i + 1).map((teamNum) => {
                    const teamPlayers = players.filter(p => p.team === teamNum);
                    const isFull = isTeamFull(teamNum);
                    const maxPlayers = gameMode === 'pairs' ? 2 : Math.ceil((parseInt(numPlayers) || 4) / 2);
                    
                    return (
                      <TouchableOpacity
                        key={teamNum}
                        style={[
                          styles.teamSelectorButton,
                          selectedTeam === teamNum && styles.teamSelectorButtonActive,
                          isFull && styles.teamSelectorButtonFull,
                        ]}
                        onPress={() => !isFull && setSelectedTeam(teamNum)}
                        disabled={isFull}
                      >
                        <Text style={[
                          styles.teamSelectorText,
                          selectedTeam === teamNum && styles.teamSelectorTextActive,
                          isFull && styles.teamSelectorTextFull,
                        ]}>
                          {gameMode === 'pairs' ? `Pareja ${teamNum}` : `Equipo ${teamNum}`}
                        </Text>
                        <Text style={styles.teamSelectorCount}>{teamPlayers.length}/{maxPlayers}</Text>
                        {isFull && <Text style={styles.teamSelectorFullLabel}>LLENO</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
                
                <Text style={styles.addPlayerLabel}>Elige tu avatar</Text>
                <View style={styles.avatarsGrid}>
                  {availableAvatars.map((avatar) => (
                    <TouchableOpacity
                      key={avatar}
                      style={[
                        styles.avatarOption,
                        selectedAvatar === avatar && styles.avatarOptionSelected,
                      ]}
                      onPress={() => setSelectedAvatar(avatar)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.avatarEmoji}>{avatar}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <Input placeholder="Nombre del jugador" value={playerName} onChangeText={setPlayerName} />
                {!usePresetCategory && Array(parseInt(charactersPerPlayer) || 2).fill(0).map((_, index) => (
                  <Input
                    key={index}
                    placeholder={`Personaje ${index + 1}`}
                    value={playerCharacters[index] || ''}
                    onChangeText={(value) => handleCharacterChange(index, value)}
                  />
                ))}
                <Button title="Agregar Jugador" onPress={handleAddPlayer} />
              </Card>
            ) : (
              <Card style={styles.allPlayersAddedCard}>
                <Text style={styles.allPlayersAddedIcon}>✅</Text>
                <Text style={styles.allPlayersAddedTitle}>¡Todos los jugadores agregados!</Text>
                <Text style={styles.allPlayersAddedSubtitle}>{players.length} de {numPlayers} jugadores</Text>
              </Card>
            )}

            {editingPlayer && (
              <Card style={styles.editPlayerCard}>
                <View style={styles.editPlayerHeader}>
                  <Text style={styles.editPlayerTitle}>✏️ Editar Jugador</Text>
                  <TouchableOpacity
                    onPress={cancelEditPlayer}
                    style={styles.editPlayerCloseButton}
                  >
                    <Text style={styles.editPlayerCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.editPlayerAvatarContainer}>
                  <Text style={styles.editPlayerAvatar}>{editingPlayer.avatar}</Text>
                </View>

                <Text style={styles.addPlayerLabel}>Nombre</Text>
                <Input
                  placeholder="Nombre del jugador"
                  value={editPlayerName}
                  onChangeText={setEditPlayerName}
                />

                <Text style={styles.addPlayerLabel}>{gameMode === 'pairs' ? 'Pareja' : 'Equipo'}</Text>
                <View style={styles.teamsSelector}>
                  {Array.from({ length: getNumTeams() }, (_, i) => i + 1).map((teamNum) => {
                    const teamPlayers = players.filter(p => p.team === teamNum && p.id !== editingPlayer.id);
                    const maxPlayers = gameMode === 'pairs' ? 2 : Math.ceil((parseInt(numPlayers) || 4) / 2);
                    const isFull = teamPlayers.length >= maxPlayers;
                    
                    return (
                      <TouchableOpacity
                        key={teamNum}
                        style={[
                          styles.teamSelectorButton,
                          editPlayerTeam === teamNum && styles.teamSelectorButtonActive,
                          isFull && styles.teamSelectorButtonFull,
                        ]}
                        onPress={() => !isFull && setEditPlayerTeam(teamNum)}
                        disabled={isFull}
                      >
                        <Text style={[
                          styles.teamSelectorText,
                          editPlayerTeam === teamNum && styles.teamSelectorTextActive,
                          isFull && styles.teamSelectorTextFull,
                        ]}>
                          {gameMode === 'pairs' ? `Pareja ${teamNum}` : `Equipo ${teamNum}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.addPlayerLabel}>Personajes</Text>
                {Array(parseInt(charactersPerPlayer) || 2).fill(0).map((_, index) => (
                  <Input
                    key={index}
                    placeholder={`Personaje ${index + 1}`}
                    value={editPlayerCharacters[index] || ''}
                    onChangeText={(value) => handleEditCharacterChange(index, value)}
                  />
                ))}

                <View style={styles.editPlayerActions}>
                  <Button title="Cancelar" onPress={cancelEditPlayer} variant="secondary" style={styles.editPlayerActionButton} />
                  <Button title="Guardar" onPress={saveEditPlayer} style={styles.editPlayerActionButton} />
                </View>
              </Card>
            )}

            {players.length > 0 && (
              <View style={styles.playersListContainer}>
                {Array.from({ length: getNumTeams() }, (_, i) => i + 1).map((teamNum) => {
                  const teamPlayers = players.filter(p => p.team === teamNum);
                  const teamColors = [colors.primary, colors.secondary, colors.warning, colors.success, colors.danger];
                  const teamColor = teamColors[(teamNum - 1) % teamColors.length];
                  
                  return (
                    <Card key={teamNum} style={styles.teamCard}>
                      <Text style={[styles.teamCardTitle, { color: teamColor }]}>
                        {gameMode === 'pairs' ? `Pareja ${teamNum}` : `Equipo ${teamNum}`}
                      </Text>
                      {teamPlayers.map((p) => (
                        <View key={p.id} style={styles.playerItem}>
                          <View style={styles.playerItemLeft}>
                            <Text style={styles.playerItemAvatar}>{p.avatar}</Text>
                            <Text style={styles.playerItemName}>{capitalize(p.name)}</Text>
                          </View>
                          <View style={styles.playerItemActions}>
                            <TouchableOpacity
                              onPress={() => startEditPlayer(p)}
                              style={styles.playerItemActionButton}
                            >
                              <Text style={styles.playerItemActionIcon}>✏️</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => deletePlayer(p.id)}
                              style={[styles.playerItemActionButton, styles.playerItemActionButtonDanger]}
                            >
                              <Text style={styles.playerItemActionIcon}>🗑️</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                      {teamPlayers.length === 0 && (
                        <Text style={styles.teamCardEmpty}>Sin jugadores</Text>
                      )}
                    </Card>
                  );
                })}
              </View>
            )}

            {players.length >= parseInt(numPlayers) && (usePresetCategory || characters.length >= totalCharactersNeeded) && (
              <View style={styles.startGameButtonContainer}>
                <Button title="Iniciar Juego" onPress={handleStartGame} size="large" fullWidth />
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // NEW CHARACTERS SCREEN
  if (gameState === 'new_characters') {
    const currentPlayer = players[currentPlayerForChars];
    const charsPerPlayer = parseInt(charactersPerPlayer) || 2;
    
    return (
      <LinearGradient colors={gradients.background} locations={[0, 1]} style={styles.gradientContainer}>
        <SafeAreaView style={styles.container}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <View style={styles.newCharsHeader}>
              <Text style={styles.newCharsHeaderTitle}>Nuevos Personajes</Text>
              <Text style={styles.newCharsHeaderProgress}>
                {currentPlayerForChars + 1} / {players.length}
              </Text>
            </View>

            {category && (
              <View style={styles.setupCategoryBanner}>
                {usePresetCategory && selectedCategory && (
                  <Text style={styles.setupCategoryIcon}>{selectedCategory.icon}</Text>
                )}
                <View style={styles.setupCategoryContent}>
                  <Text style={styles.setupCategoryLabel}>CATEGORÍA</Text>
                  <Text style={styles.setupCategoryName}>{category}</Text>
                </View>
              </View>
            )}

            <Card style={styles.newCharsCard}>
              <View style={styles.newCharsPlayerInfo}>
                <Text style={styles.newCharsPlayerAvatar}>{currentPlayer?.avatar}</Text>
                <View>
                  <Text style={styles.newCharsPlayerName}>{currentPlayer ? capitalize(currentPlayer.name) : ''}</Text>
                  <Text style={styles.newCharsPlayerTeam}>
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

              <View style={styles.newCharsButtonContainer}>
                <Button
                  title={currentPlayerForChars < players.length - 1 ? "Siguiente Jugador →" : "¡Comenzar Juego!"}
                  onPress={confirmNewCharacters}
                  size="large"
                />
              </View>
            </Card>

            <View style={styles.newCharsProgressContainer}>
              <Text style={styles.newCharsProgressLabel}>Jugadores:</Text>
              <View style={styles.newCharsProgressAvatars}>
                {players.map((player, index) => (
                  <View
                    key={player.id}
                    style={[
                      styles.newCharsProgressAvatar,
                      index < currentPlayerForChars && styles.newCharsProgressAvatarDone,
                      index === currentPlayerForChars && styles.newCharsProgressAvatarCurrent,
                    ]}
                  >
                    <Text style={styles.newCharsProgressAvatarEmoji}>{player.avatar}</Text>
                    {index < currentPlayerForChars && (
                      <View style={styles.newCharsProgressAvatarCheck}>
                        <Text style={styles.newCharsProgressAvatarCheckText}>✓</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ROUND INTRO SCREEN
  if (gameState === 'round_intro') {
    const roundInfo = roundDetails[round];
    const numTeams = getNumTeams();

    return (
      <LinearGradient colors={gradients.background} locations={[0, 1]} style={styles.gradientContainer}>
        <SafeAreaView style={styles.container}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.roundIntroContainer}>
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
              <View style={styles.roundIntroBanner}>
                <Text style={styles.roundIntroBannerText}>RONDA {round}</Text>
              </View>

              <Text style={styles.roundIntroIcon}>{roundInfo.icon}</Text>
              <Text style={styles.roundIntroTitle}>{roundInfo.title}</Text>
              
              <Text style={styles.roundIntroDescription}>{roundInfo.description}</Text>

              <Card style={styles.roundIntroTipsCard}>
                {roundInfo.tips.map((tip, index) => (
                  <View key={index} style={styles.roundIntroTipItem}>
                    <Text style={styles.roundIntroTipBullet}>•</Text>
                    <Text style={styles.roundIntroTipText}>{tip}</Text>
                  </View>
                ))}
              </Card>

              {round > 1 && numTeams > 0 && (
                <View style={styles.roundIntroScores}>
                  <Text style={styles.roundIntroScoresTitle}>Puntuación actual</Text>
                  <View style={styles.roundIntroScoresRow}>
                    {Array.from({ length: numTeams }, (_, i) => i + 1).map((teamNum) => {
                      const teamScore = getTotalScore(teamNum);
                      const teamColors = [colors.primary, colors.secondary, colors.warning, colors.success, colors.danger];
                      const teamColor = teamColors[(teamNum - 1) % teamColors.length];
                      return (
                        <View key={teamNum} style={styles.roundIntroScoreItem}>
                          <Text style={[styles.roundIntroScoreLabel, { color: teamColor }]}>
                            {gameMode === 'pairs' ? `Pareja ${teamNum}` : `Equipo ${teamNum}`}
                          </Text>
                          <Text style={styles.roundIntroScoreValue}>{teamScore}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            <View style={styles.roundIntroFooter}>
              <Button
                title="¡Comenzar Ronda!"
                onPress={() => setGameState('waiting')}
                size="large"
                fullWidth
                style={styles.roundIntroButton}
              />
              <TouchableOpacity
                onPress={() => setShowExitModal(true)}
                style={styles.roundIntroExitButton}
              >
                <Text style={styles.roundIntroExitText}>🚪 Salir del Juego</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ROUND INTRO MID-TURN
  if (gameState === 'round_intro_mid_turn') {
    const roundInfo = roundDetails[round];
    const currentPlayer = getCurrentPlayer();

    return (
      <LinearGradient colors={gradients.background} locations={[0, 1]} style={styles.gradientContainer}>
        <SafeAreaView style={styles.container}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.roundIntroContainer}>
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
              <View style={styles.midTurnTimerBadge}>
                <Text style={styles.midTurnTimerText}>⏱️ {timeLeft}s restantes</Text>
              </View>

              <View style={styles.roundIntroBannerWarning}>
                <Text style={styles.roundIntroBannerText}>¡NUEVA RONDA!</Text>
              </View>

              <Text style={styles.roundIntroIcon}>{roundInfo.icon}</Text>
              <Text style={styles.roundIntroTitle}>RONDA {round}: {roundInfo.title}</Text>
              
              <Text style={styles.roundIntroDescription}>{roundInfo.description}</Text>

              <View style={styles.roundIntroPlayerCard}>
                <Text style={styles.roundIntroPlayerLabel}>Sigues jugando:</Text>
                <View style={styles.roundIntroPlayerInfo}>
                  <Text style={styles.roundIntroPlayerAvatar}>{currentPlayer?.avatar}</Text>
                  <Text style={styles.roundIntroPlayerName}>{currentPlayer ? capitalize(currentPlayer.name) : ''}</Text>
                </View>
              </View>
            </View>

            <View style={styles.roundIntroFooter}>
              <Button
                title="¡Continuar!"
                onPress={() => {
                  setIsCardPressed(false);
                  setIsPaused(false);
                  setGameState('playing');
                }}
                size="large"
                fullWidth
                style={styles.roundIntroButton}
              />
              <TouchableOpacity
                onPress={() => setShowExitModal(true)}
                style={styles.roundIntroExitButton}
              >
                <Text style={styles.roundIntroExitText}>🚪 Salir del Juego</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // WAITING SCREEN
  if (gameState === 'waiting') {
    const nextPlayer = getCurrentPlayer();
    const numTeams = getNumTeams();

    return (
      <LinearGradient colors={gradients.background} locations={[0, 1]} style={styles.gradientContainer}>
        <SafeAreaView style={styles.container}>
          <View style={styles.waitingContainer}>
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
              <View style={styles.waitingPlayerContainer}>
                {nextPlayer && isPlayerMVP(nextPlayer.id) && (
                  <Text style={styles.waitingPlayerCrown}>👑</Text>
                )}
                <Text style={styles.waitingPlayerAvatar}>{nextPlayer?.avatar}</Text>
              </View>
              <Text style={styles.waitingPlayerName}>{nextPlayer?.name}</Text>
              {nextPlayer && (
                <Text style={styles.waitingPlayerStats}>
                  ✓ {getPlayerStats(nextPlayer.id).hits} aciertos • ✗ {getPlayerStats(nextPlayer.id).fails} fallos
                </Text>
              )}
              <View style={[styles.waitingTeamBadge, {
                backgroundColor: (() => {
                  const teamColors = [colors.primary, colors.secondary, colors.warning, colors.success, colors.danger];
                  return teamColors[(currentTeam - 1) % teamColors.length];
                })(),
              }]}>
                <Text style={styles.waitingTeamText}>
                  {gameMode === 'pairs' ? `Pareja ${currentTeam}` : `Equipo ${currentTeam}`}
                </Text>
              </View>
              
              {numTeams > 0 && (
                <View style={styles.waitingScoresRow}>
                  {Array.from({ length: numTeams }, (_, i) => i + 1).map((teamNum) => {
                    const teamScore = getTotalScore(teamNum);
                    const teamColors = [colors.primary, colors.secondary, colors.warning, colors.success, colors.danger];
                    const teamColor = teamColors[(teamNum - 1) % teamColors.length];
                    return (
                      <View key={teamNum} style={styles.waitingScoreItem}>
                        <Text style={[styles.waitingScoreLabel, { color: teamColor }]}>
                          {gameMode === 'pairs' ? `Pareja ${teamNum}` : `Equipo ${teamNum}`}
                        </Text>
                        <Text style={styles.waitingScoreValue}>{teamScore}</Text>
                      </View>
                    );
                  })}
                </View>
              )}

              <Text style={styles.waitingInstruction}>
                Pasa el dispositivo a {nextPlayer?.name}
              </Text>
              
              <Button
                title="¡Estoy Listo!"
                onPress={handlePlayerReady}
                size="large"
                fullWidth
                style={styles.waitingReadyButton}
              />
              <TouchableOpacity
                onPress={() => setShowExitModal(true)}
                style={styles.waitingExitButton}
              >
                <Text style={styles.waitingExitText}>🚪 Salir del Juego</Text>
              </TouchableOpacity>
            </Card>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // PLAYING SCREEN
  if (gameState === 'playing') {
    const currentPlayer = getCurrentPlayer();
    const numTeams = getNumTeams();
    let displayCharacter = currentCharacter;

    if ((!displayCharacter || blockedCharacters.includes(displayCharacter)) && roundCharacters.length > 0) {
      const availableChars = roundCharacters.filter(c => !blockedCharacters.includes(c));
      if (availableChars.length === 0) {
        handleTimeUp();
      } else {
        const newChar = pickRandomCharacter(roundCharacters, blockedCharacters);
        setCurrentCharacter(newChar);
        displayCharacter = newChar;
      }
    }

    return (
      <LinearGradient colors={gradients.background} locations={[0, 1]} style={styles.gradientContainer}>
        <SafeAreaView style={styles.container}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.playingScrollContent}>
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
            <View style={styles.playingHeader}>
              <View style={styles.playingHeaderLeft}>
                {currentPlayer && isPlayerMVP(currentPlayer.id) && (
                  <Text style={styles.playingHeaderMVP}>👑</Text>
                )}
                <Text style={styles.playingHeaderAvatar}>{currentPlayer?.avatar}</Text>
              </View>
              <View style={styles.playingHeaderCenter}>
                <Text style={styles.playingHeaderName}>{currentPlayer ? capitalize(currentPlayer.name) : ''}</Text>
                <View style={styles.playingHeaderInfoRow}>
                  <View style={[styles.playingHeaderTeamBadge, {
                    backgroundColor: (() => {
                      const teamColors = [colors.primary, colors.secondary, colors.warning, colors.success, colors.danger];
                      return teamColors[(currentTeam - 1) % teamColors.length];
                    })(),
                  }]}>
                    <Text style={styles.playingHeaderTeamText}>
                      {gameMode === 'pairs' ? `Pareja ${currentTeam}` : `Equipo ${currentTeam}`}
                    </Text>
                  </View>
                  {currentPlayer && (
                    <Text style={styles.playingHeaderStats}>
                      ✓{getPlayerStats(currentPlayer.id).hits} ✗{getPlayerStats(currentPlayer.id).fails}
                    </Text>
                  )}
                </View>
              </View>
              <View style={[styles.timerBadge, { backgroundColor: timeLeft <= 10 ? colors.danger : colors.primary }]}>
                <Text style={styles.timerBadgeText}>{timeLeft}s</Text>
              </View>
            </View>
            
            <View style={styles.roundInfoBadge}>
              <Text style={styles.roundInfoText}>
                Ronda {round} • {roundRules[round]}
              </Text>
            </View>

            <View style={styles.characterCardContainer}>
              <Pressable
                onPressIn={() => setIsCardPressed(true)}
                onPressOut={() => setIsCardPressed(false)}
                style={styles.characterCardPressable}
              >
                <Animated.View
                  style={[
                    styles.characterCard,
                    { transform: [{ scale: cardScaleRef.current }] },
                  ]}
                >
                  {!isCardPressed ? (
                    <View style={[styles.cardFace, styles.cardBack]}>
                      <View style={styles.cardBackContent}>
                        <Image 
                          source={require('../../assets/img/logo-personajes.png')} 
                          style={styles.cardLogo}
                          resizeMode="contain"
                        />
                        <Text style={styles.cardInstruction}>MANTÉN PRESIONADO</Text>
                        <Text style={styles.cardInstructionSubtitle}>para ver el personaje</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={[styles.cardFace, styles.cardFront]}>
                      <Text style={styles.characterMainName}>
                        {displayCharacter?.toUpperCase() || 'SIN TARJETAS'}
                      </Text>
                    </View>
                  )}
                </Animated.View>
              </Pressable>
            </View>

            <Text style={styles.remainingText}>
              {roundCharacters.length} personajes restantes
            </Text>

            {numTeams > 0 && (
              <View style={styles.scoresRow}>
                {Array.from({ length: numTeams }, (_, i) => i + 1).map((teamNum) => {
                  const teamScore = getTotalScore(teamNum);
                  const teamColors = [colors.primary, colors.secondary, colors.warning, colors.success, colors.danger];
                  const teamColor = teamColors[(teamNum - 1) % teamColors.length];
                  const isCurrent = currentTeam === teamNum;
                  return (
                    <View key={teamNum} style={[styles.scoreBadge, isCurrent && { borderColor: teamColor, borderWidth: 2 }]}>
                      <Text style={[styles.scoreBadgeLabel, { color: teamColor }]}>
                        {gameMode === 'pairs' ? `P${teamNum}` : `E${teamNum}`}
                      </Text>
                      <Text style={styles.scoreBadgeValue}>{teamScore}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.failButton]}
                onPress={handleFail}
                activeOpacity={0.8}
              >
                <Text style={styles.actionIcon}>✗</Text>
                <Text style={styles.actionLabel}>FALLO</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.successButton]}
                onPress={handleHit}
                activeOpacity={0.8}
              >
                <Text style={styles.actionIcon}>✓</Text>
                <Text style={styles.actionLabel}>ACIERTO</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.playingActions}>
              <TouchableOpacity
                onPress={() => setIsPaused(!isPaused)}
                style={styles.playingActionButton}
              >
                <Text style={styles.playingActionText}>
                  {isPaused ? '▶ Reanudar' : '⏸ Pausar'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowExitModal(true)}
                style={styles.playingActionButton}
              >
                <Text style={styles.playingActionText}>🚪 Salir del Juego</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // FINISHED SCREEN
  if (gameState === 'finished') {
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

    return (
      <LinearGradient colors={gradients.background} locations={[0, 1]} style={styles.gradientContainer}>
        <SafeAreaView style={styles.container}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <View style={styles.finishedContainer}>
              <Text style={styles.finishedIcon}>🏆</Text>
              <Text style={styles.finishedTitle}>¡Juego Terminado!</Text>
              {numTeams > 0 && (
                <View style={styles.finishedScoresRow}>
                  {teamScores.map((teamScore) => {
                    const teamColors = [colors.primary, colors.secondary, colors.warning, colors.success, colors.danger];
                    const teamColor = teamColors[(teamScore.teamNum - 1) % teamColors.length];
                    const isWinner = winningTeams.some(t => t.teamNum === teamScore.teamNum) && maxScore > 0;
                    return (
                      <View key={teamScore.teamNum} style={[styles.finalScoreCard, isWinner && styles.finalScoreCardWinner]}>
                        <Text style={[styles.finalTeamLabel, { color: teamColor }]}>
                          {gameMode === 'pairs' ? `Pareja ${teamScore.teamNum}` : `Equipo ${teamScore.teamNum}`}
                        </Text>
                        <Text style={styles.finalScoreValue}>{teamScore.score}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
              <Text style={styles.winnerText}>
                {winningTeams.length === 1 && maxScore > 0 
                  ? `🎉 ¡${gameMode === 'pairs' ? 'Pareja' : 'Equipo'} ${winningTeams[0].teamNum} Gana!`
                  : winningTeams.length > 1 
                    ? '🤝 ¡Empate!'
                    : '🤝 ¡Juego Terminado!'
                }
              </Text>
            </View>

            {mvpPlayer && mvpStats.hits > 0 && (
              <Card style={styles.mvpCard}>
                <Text style={styles.mvpTitle}>⭐ MVP del Juego ⭐</Text>
                <View style={styles.mvpContent}>
                  <View style={styles.mvpAvatarContainer}>
                    <Text style={styles.mvpCrown}>👑</Text>
                    <Text style={styles.mvpAvatar}>{mvpPlayer.avatar}</Text>
                  </View>
                  <View style={styles.mvpInfo}>
                    <Text style={styles.mvpName}>{capitalize(mvpPlayer.name)}</Text>
                    <Text style={styles.mvpTeam}>Equipo {mvpPlayer.team}</Text>
                    <View style={styles.mvpStatsRow}>
                      <Text style={styles.mvpHits}>✓ {mvpStats.hits}</Text>
                      <Text style={styles.mvpFails}>✗ {mvpStats.fails}</Text>
                    </View>
                  </View>
                </View>
              </Card>
            )}

            <Card style={styles.rankingCard}>
              <Text style={styles.rankingTitle}>📊 Estadísticas de Jugadores</Text>
              {rankedPlayers.map((player, index) => {
                const stats = getPlayerStats(player.id);
                const isFirst = index === 0 && stats.hits > 0;
                return (
                  <View
                    key={player.id}
                    style={[styles.rankingItem, isFirst && styles.rankingItemFirst]}
                  >
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

            <View style={styles.finishedActions}>
              <Button title="🔄 Jugar Otra Vez (mismos jugadores)" onPress={playAgain} size="large" fullWidth style={styles.finishedActionButton} />
              <Button title="Nueva Partida" onPress={resetGame} variant="outline" size="large" fullWidth style={styles.finishedActionButton} />
              <Button title="Volver al Menú" onPress={() => router.replace('/(app)/dashboard')} variant="secondary" size="large" fullWidth style={styles.finishedActionButton} />
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // RECONFIG SCREEN
  if (gameState === 'reconfig') {
    return (
      <LinearGradient colors={gradients.background} locations={[0, 1]} style={styles.gradientContainer}>
        <SafeAreaView style={styles.container}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <View style={styles.configHeader}>
              <View style={styles.configHeaderLeft}>
                <Text style={styles.configHeaderIcon}>🔄</Text>
                <Text style={styles.configHeaderTitle}>Reconfigurar Partida</Text>
              </View>
            </View>

            <Card style={styles.reconfigPlayersCard}>
              <Text style={styles.reconfigPlayersTitle}>✅ Jugadores Conservados</Text>
              <Text style={styles.reconfigPlayersText}>
                Se mantendrán los {players.length} jugadores actuales
              </Text>
              <View style={styles.reconfigPlayersList}>
                {players.map((p) => (
                  <View key={p.id} style={styles.reconfigPlayerBadge}>
                    <Text style={styles.reconfigPlayerAvatar}>{p.avatar}</Text>
                    <Text style={styles.reconfigPlayerName}>{capitalize(p.name)}</Text>
                  </View>
                ))}
              </View>
            </Card>

            <Card style={styles.configCard}>
              <Text style={styles.configCardTitle}>Cambiar Configuración</Text>
              
              <Input
                label="Personajes por jugador"
                value={charactersPerPlayer}
                onChangeText={(val) => handleNumericInput(val, setCharactersPerPlayer)}
                placeholder="2"
              />
              <Text style={styles.configHelperText}>
                Total de personajes: {players.length * (parseInt(charactersPerPlayer) || 2)} ({charactersPerPlayer} por jugador × {players.length} jugadores)
              </Text>

              <Text style={styles.configLabel}>Categoría de personajes</Text>
              <View style={styles.configToggle}>
                <TouchableOpacity
                  style={[styles.configToggleOption, !usePresetCategory && styles.configToggleOptionActive]}
                  onPress={() => {
                    setUsePresetCategory(false);
                    setSelectedCategory(null);
                    setMaxCharacters('');
                  }}
                >
                  <Text style={[styles.configToggleText, !usePresetCategory && styles.configToggleTextActive]}>Manual</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.configToggleOption, usePresetCategory && styles.configToggleOptionActive]}
                  onPress={() => setUsePresetCategory(true)}
                >
                  <Text style={[styles.configToggleText, usePresetCategory && styles.configToggleTextActive]}>Predefinida</Text>
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
                  {category && (
                    <Text style={styles.configCategoryHint}>
                      Los jugadores agregarán personajes de: {category}
                    </Text>
                  )}
                </>
              ) : (
                <View style={styles.categoriesSection}>
                  <Text style={styles.categoriesLabel}>Selecciona una categoría:</Text>
                  <View style={styles.categoriesGrid}>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.categoryCard, selectedCategory?.id === cat.id && styles.categoryCardSelected]}
                        onPress={() => selectCategory(cat.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.categoryIcon}>{cat.icon}</Text>
                        <Text style={[styles.categoryName, selectedCategory?.id === cat.id && styles.categoryNameSelected]}>
                          {cat.name}
                        </Text>
                        <Text style={styles.categoryCount}>{cat.characterCount} personajes</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {selectedCategory && (
                    <View style={styles.selectedCategoryCard}>
                      <Text style={styles.selectedCategoryTitle}>
                        {selectedCategory.icon} {selectedCategory.name}
                      </Text>
                      <Text style={styles.selectedCategoryDescription}>{selectedCategory.description}</Text>
                      <Text style={styles.selectedCategoryCount}>
                        ✅ {selectedCategory.characters.length} personajes disponibles
                      </Text>
                      
                      <View style={styles.selectedCategoryDivider} />
                      <Input
                        label="Límite de personajes (opcional)"
                        value={maxCharacters}
                        onChangeText={setMaxCharacters}
                        placeholder={`Máximo: ${selectedCategory.characters.length}`}
                      />
                      <Text style={styles.selectedCategoryHint}>
                        {maxCharacters
                          ? `Se usarán ${Math.min(parseInt(maxCharacters) || 0, selectedCategory.characters.length)} personajes (límite manual)`
                          : `Se usarán ${players.length * parseInt(charactersPerPlayer)} personajes (calculado automáticamente: ${players.length} jugadores × ${charactersPerPlayer} por jugador)`
                        }
                      </Text>
                    </View>
                  )}
                </View>
              )}
              
              <Button
                title="Continuar"
                onPress={handleReconfigSubmit}
                size="large"
                fullWidth
                style={styles.configButton}
                disabled={usePresetCategory && !selectedCategory}
              />
            </Card>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  configHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  configHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  configHeaderIcon: {
    fontSize: 28,
  },
  configHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textTransform: 'uppercase',
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  configCard: {
    marginBottom: 24,
  },
  configCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textTransform: 'uppercase',
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  configHelperText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: -8,
    marginBottom: 16,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  configLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 8,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  configToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  configToggleOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  configToggleOptionActive: {
    backgroundColor: colors.primary,
  },
  configToggleText: {
    color: colors.textMuted,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  configToggleTextActive: {
    color: colors.text,
  },
  timeOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  timeOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
    minWidth: 60,
  },
  timeOptionActive: {
    backgroundColor: colors.primary,
  },
  timeOptionText: {
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 15,
    textAlign: 'center',
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  timeOptionTextActive: {
    color: colors.text,
  },
  configCategoryHint: {
    color: colors.primary,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 8,
    fontStyle: 'italic',
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  categoriesSection: {
    marginTop: 8,
  },
  categoriesLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 8,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  categoryCard: {
    backgroundColor: 'rgba(30, 37, 74, 0.8)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    minWidth: 140,
    flex: 1,
    maxWidth: '48%',
    borderWidth: 3,
    borderColor: 'transparent',
    ...shadows.cardShadow,
  },
  categoryCardSelected: {
    borderColor: '#ffcc03',
    backgroundColor: 'rgba(30, 37, 74, 0.95)',
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    textAlign: 'center',
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  categoryNameSelected: {
    color: '#ffcc03',
  },
  categoryCount: {
    color: '#B0B0B0',
    fontSize: 11,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  selectedCategoryCard: {
    backgroundColor: `${colors.primary}15`,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    marginTop: 12,
  },
  selectedCategoryTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  selectedCategoryDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 4,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  selectedCategoryCount: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  selectedCategoryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 12,
    marginBottom: 12,
  },
  selectedCategoryHint: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  configButton: {
    marginTop: 16,
  },
  // Setup Screen Styles
  setupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  setupHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  setupInfoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  setupInfoText: {
    color: colors.textMuted,
    fontSize: 14,
    marginVertical: 4,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  setupCategoryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  setupCategoryIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  setupCategoryContent: {
    flex: 1,
  },
  setupCategoryLabel: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    opacity: 0.8,
    fontFamily: theme.fontFamily,
  },
  setupCategoryName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  addPlayerCard: {
    marginBottom: 16,
  },
  addPlayerTitle: {
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 12,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  addPlayerLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 8,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  teamsSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  teamSelectorButton: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  teamSelectorButtonActive: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  teamSelectorButtonFull: {
    opacity: 0.5,
  },
  teamSelectorText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  teamSelectorTextActive: {
    color: colors.primary,
  },
  teamSelectorTextFull: {
    color: colors.textMuted,
  },
  teamSelectorCount: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  teamSelectorFullLabel: {
    color: colors.success,
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  avatarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  avatarOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surfaceLight,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOptionSelected: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  avatarEmoji: {
    fontSize: 28,
  },
  allPlayersAddedCard: {
    marginBottom: 16,
    alignItems: 'center',
    padding: 24,
  },
  allPlayersAddedIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  allPlayersAddedTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  allPlayersAddedSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  editPlayerCard: {
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  editPlayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editPlayerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  editPlayerCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPlayerCloseText: {
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: theme.fontFamily,
  },
  editPlayerAvatarContainer: {
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  editPlayerAvatar: {
    fontSize: 48,
  },
  editPlayerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  editPlayerActionButton: {
    flex: 1,
  },
  playersListContainer: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 16,
  },
  teamCard: {
    marginBottom: 12,
  },
  teamCardTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  playerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerItemAvatar: {
    fontSize: 20,
    marginRight: 8,
  },
  playerItemName: {
    color: colors.text,
    fontSize: 14,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  playerItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  playerItemActionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerItemActionButtonDanger: {
    backgroundColor: `${colors.danger}20`,
  },
  playerItemActionIcon: {
    fontSize: 14,
  },
  teamCardEmpty: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  startGameButtonContainer: {
    marginBottom: 40,
  },
  // New Characters Screen Styles
  newCharsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  newCharsHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  newCharsHeaderProgress: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  newCharsCard: {
    marginBottom: 16,
  },
  newCharsPlayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  newCharsPlayerAvatar: {
    fontSize: 48,
    marginRight: 16,
  },
  newCharsPlayerName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  newCharsPlayerTeam: {
    color: colors.primary,
    fontSize: 14,
    marginTop: 2,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  newCharsLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 12,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  newCharsButtonContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  newCharsProgressContainer: {
    marginTop: 8,
    marginBottom: 40,
  },
  newCharsProgressLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: theme.fontFamily,
  },
  newCharsProgressAvatars: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  newCharsProgressAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  newCharsProgressAvatarDone: {
    backgroundColor: colors.success,
    opacity: 0.8,
  },
  newCharsProgressAvatarCurrent: {
    borderColor: colors.primary,
  },
  newCharsProgressAvatarEmoji: {
    fontSize: 24,
  },
  newCharsProgressAvatarCheck: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.success,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newCharsProgressAvatarCheckText: {
    color: colors.text,
    fontSize: 10,
    fontFamily: theme.fontFamily,
  },
  // Round Intro Styles (reusing from GameRoom)
  roundIntroContainer: {
    flex: 1,
    padding: 32,
  },
  roundIntroContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  roundIntroBanner: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginBottom: 24,
  },
  roundIntroBannerWarning: {
    backgroundColor: colors.warning,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginBottom: 24,
  },
  roundIntroBannerText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
    fontFamily: theme.fontFamily,
  },
  roundIntroIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  roundIntroTitle: {
    color: colors.text,
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 16,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: theme.fontFamily,
    ...shadows.titleShadow,
  },
  roundIntroDescription: {
    color: colors.textSecondary,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 18 * 1.44,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  roundIntroTipsCard: {
    width: '100%',
    marginBottom: 24,
  },
  roundIntroTipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  roundIntroTipBullet: {
    color: colors.primary,
    fontSize: 18,
    marginRight: 12,
    fontWeight: 'bold',
  },
  roundIntroTipText: {
    color: colors.text,
    fontSize: 15,
    flex: 1,
    lineHeight: 15 * 1.47,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  roundIntroScores: {
    alignItems: 'center',
    marginTop: 8,
  },
  roundIntroScoresTitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: theme.fontFamily,
  },
  roundIntroScoresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  roundIntroScoreItem: {
    alignItems: 'center',
  },
  roundIntroScoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  roundIntroScoreValue: {
    color: colors.text,
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  roundIntroPlayerCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    marginTop: 16,
  },
  roundIntroPlayerLabel: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 8,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  roundIntroPlayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roundIntroPlayerAvatar: {
    fontSize: 40,
  },
  roundIntroPlayerName: {
    color: colors.text,
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  roundIntroFooter: {
    width: '100%',
    gap: 8,
  },
  roundIntroButton: {
    marginHorizontal: 24,
    marginBottom: 8,
  },
  roundIntroExitButton: {
    width: '100%',
    marginHorizontal: 24,
    marginBottom: 32,
    alignItems: 'center',
    padding: 8,
  },
  roundIntroExitText: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  midTurnTimerBadge: {
    backgroundColor: colors.warning,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  midTurnTimerText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  // Waiting Screen Styles
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  waitingCard: {
    textAlign: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 400,
  },
  waitingRound: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  waitingRule: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  waitingDivider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  waitingLabel: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 8,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  waitingPlayerContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 8,
  },
  waitingPlayerCrown: {
    position: 'absolute',
    top: -20,
    left: '50%',
    transform: [{ translateX: -16 }],
    fontSize: 32,
    zIndex: 1,
  },
  waitingPlayerAvatar: {
    fontSize: 64,
    marginBottom: 8,
  },
  waitingPlayerName: {
    color: colors.text,
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  waitingPlayerStats: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 12,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  waitingTeamBadge: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 24,
  },
  waitingTeamText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  waitingScoresRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 24,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  waitingScoreItem: {
    alignItems: 'center',
  },
  waitingScoreLabel: {
    fontSize: 12,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  waitingScoreValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  waitingInstruction: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
    fontStyle: 'italic',
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  waitingReadyButton: {
    marginTop: 24,
  },
  waitingExitButton: {
    width: '100%',
    alignItems: 'center',
    padding: 8,
    marginTop: 8,
  },
  waitingExitText: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  // Playing Screen Styles
  playingScrollContent: {
    padding: 8,
    paddingBottom: 24,
  },
  playingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  playingHeaderLeft: {
    position: 'relative',
    marginRight: 12,
  },
  playingHeaderMVP: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: [{ translateX: -10 }],
    fontSize: 20,
    zIndex: 1,
  },
  playingHeaderAvatar: {
    fontSize: 40,
  },
  playingHeaderCenter: {
    flex: 1,
  },
  playingHeaderName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  playingHeaderInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  playingHeaderTeamBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  playingHeaderTeamText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  playingHeaderStats: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  timerBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBadgeText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  roundInfoBadge: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  roundInfoText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  characterCardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  characterCardPressable: {
    width: '100%',
    minHeight: 160,
    maxHeight: 220,
    aspectRatio: 4/3,
  },
  characterCard: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    borderWidth: 6,
    borderColor: '#660066',
    overflow: 'hidden',
    ...shadows.buttonShadow,
  },
  cardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  cardBack: {
    // Gradient applied via LinearGradient component
  },
  cardFront: {
    // Gradient applied via LinearGradient component
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
    maxHeight: '55%',
    opacity: 0.95,
  },
  cardInstruction: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
    fontFamily: theme.fontFamily,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  cardInstructionSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: theme.fontFamily,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  characterMainName: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: theme.fontFamily,
    ...shadows.titleShadow,
    padding: 20,
  },
  remainingText: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  scoresRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  scoreBadge: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  scoreBadgeLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  scoreBadgeValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 25,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 6,
    fontFamily: theme.fontFamily,
    letterSpacing: 0.08 * 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    ...shadows.buttonShadow,
  },
  failButton: {
    borderColor: '#660000',
    ...shadows.buttonShadow,
  },
  successButton: {
    borderColor: '#006600',
    ...shadows.buttonShadow,
  },
  actionIcon: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    ...shadows.titleShadow,
    fontFamily: theme.fontFamily,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
    color: '#ffffff',
    ...shadows.titleShadow,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  playingActions: {
    flexDirection: 'column',
    gap: 8,
  },
  playingActionButton: {
    width: '100%',
    alignItems: 'center',
    padding: 8,
  },
  playingActionText: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  // Finished Screen Styles
  finishedContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  finishedIcon: {
    fontSize: 56,
    marginBottom: 8,
  },
  finishedTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  finishedScoresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  finalScoreCard: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  finalScoreCardWinner: {
    borderColor: colors.warning,
  },
  finalTeamLabel: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  finalScoreValue: {
    color: colors.text,
    fontSize: 40,
    fontWeight: 'bold',
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  winnerText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  mvpCard: {
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.warning,
  },
  mvpTitle: {
    color: colors.warning,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  mvpContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mvpAvatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  mvpCrown: {
    position: 'absolute',
    top: -16,
    left: '50%',
    transform: [{ translateX: -12 }],
    fontSize: 24,
    zIndex: 1,
  },
  mvpAvatar: {
    fontSize: 56,
  },
  mvpInfo: {
    flex: 1,
  },
  mvpName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  mvpTeam: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 8,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  mvpStatsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  mvpHits: {
    color: colors.success,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  mvpFails: {
    color: colors.danger,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  rankingCard: {
    marginBottom: 24,
  },
  rankingTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rankingItemFirst: {
    backgroundColor: colors.surfaceLight,
    marginHorizontal: -16,
    paddingLeft: 16,
    paddingRight: 16,
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  rankingPosition: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: 'bold',
    width: 30,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  rankingAvatar: {
    fontSize: 28,
    marginRight: 12,
  },
  rankingInfo: {
    flex: 1,
  },
  rankingNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rankingName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  rankingCrown: {
    fontSize: 14,
  },
  rankingTeam: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  rankingStats: {
    flexDirection: 'row',
    gap: 12,
  },
  rankingHits: {
    color: colors.success,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  rankingFails: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  finishedActions: {
    flexDirection: 'column',
    gap: 12,
  },
  finishedActionButton: {
    marginBottom: 0,
  },
  // Reconfig Screen Styles
  reconfigPlayersCard: {
    marginBottom: 16,
    backgroundColor: `${colors.success}15`,
    borderWidth: 2,
    borderColor: colors.success,
  },
  reconfigPlayersTitle: {
    color: colors.success,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  reconfigPlayersText: {
    color: colors.text,
    fontSize: 14,
    marginBottom: 12,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
  reconfigPlayersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reconfigPlayerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  reconfigPlayerAvatar: {
    fontSize: 20,
  },
  reconfigPlayerName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  },
});
