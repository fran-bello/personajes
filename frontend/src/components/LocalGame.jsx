import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card, Modal } from './index';
import { colors } from '../theme';
import { api } from '../services/api';
import { soundService } from '../services/sound';
import { OFFLINE_CATEGORIES, getCategoryById, LOCAL_AVATARS } from '../data/categories';
import './LocalGame.css';

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

function LocalGame() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('config'); // config, setup, playing, waiting, round_intro, round_intro_mid_turn, finished, new_characters, reconfig
  const [numPlayers, setNumPlayers] = useState('4');
  const [gameMode, setGameMode] = useState('teams');
  const [charactersPerPlayer, setCharactersPerPlayer] = useState('2');
  const [timePerRound, setTimePerRound] = useState('60');
  const [category, setCategory] = useState('');
  const [usePresetCategory, setUsePresetCategory] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]); // Array de IDs de categorías seleccionadas
  const [useAllCategories, setUseAllCategories] = useState(false); // Flag para usar todas las categorías (Variados)
  const [maxCharacters, setMaxCharacters] = useState('');
  const [categories, setCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [players, setPlayers] = useState([]);
  const [roundPlayerIndex, setRoundPlayerIndex] = useState(0);
  const [globalPlayerIndex, setGlobalPlayerIndex] = useState(0); // Índice global para alternar entre equipos
  const [characters, setCharacters] = useState([]);
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const [roundCharacters, setRoundCharacters] = useState([]);
  const [round, setRound] = useState(1);
  const [currentTeam, setCurrentTeam] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPaused, setIsPaused] = useState(false);
  const [scores, setScores] = useState({
    round1: { team1: 0, team2: 0 },
    round2: { team1: 0, team2: 0 },
    round3: { team1: 0, team2: 0 },
  });
  const [playerName, setPlayerName] = useState('');
  const [playerCharacters, setPlayerCharacters] = useState(['', '']);
  const [team1Players, setTeam1Players] = useState([]);
  const [team2Players, setTeam2Players] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState(LOCAL_AVATARS[0]);
  const [usedAvatars, setUsedAvatars] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(1);
  const [blockedCharacters, setBlockedCharacters] = useState([]);
  const [playerStats, setPlayerStats] = useState({});
  const [isCardPressed, setIsCardPressed] = useState(false);
  const [currentPlayerForChars, setCurrentPlayerForChars] = useState(0);
  const [newPlayerCharacters, setNewPlayerCharacters] = useState([]);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editPlayerName, setEditPlayerName] = useState('');
  const [editPlayerTeam, setEditPlayerTeam] = useState(1);
  const [editPlayerCharacters, setEditPlayerCharacters] = useState([]);
  const cardScaleRef = useRef(1);
  const [showExitModal, setShowExitModal] = useState(false);
  const [cardAnimation, setCardAnimation] = useState('');
  const [buttonAnimation, setButtonAnimation] = useState({ hit: false, fail: false });

  // Cargar categorías al activar el modo categoría
  useEffect(() => {
    if (usePresetCategory && categories.length === 0) {
      loadCategories();
    }
  }, [usePresetCategory]);

  // Pre-cargar sonidos cuando el componente se monta
  useEffect(() => {
    soundService.preloadAll();
  }, []);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const data = await api.getCategories();
      // Obtener los personajes de cada categoría
      const categoriesWithCharacters = await Promise.all(
        data.map(async (cat) => {
          try {
            const categoryData = await api.getCategory(cat.id);
            return {
              ...cat,
              characters: categoryData.characters || []
            };
          } catch (err) {
            console.error(`Error loading characters for category ${cat.id}:`, err);
            return {
              ...cat,
              characters: []
            };
          }
        })
      );
      setCategories(categoriesWithCharacters);
    } catch (err) {
      console.error('Error loading categories:', err);
      // Si falla, usar categorías offline como fallback
      setCategories(OFFLINE_CATEGORIES.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        characterCount: cat.characters.length,
        characters: cat.characters
      })));
    } finally {
      setLoadingCategories(false);
    }
  };

  // Filtrar categorías según búsqueda
  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(categorySearch.toLowerCase()))
  );

  // Validar que solo se ingresen números enteros
  const handleNumericInput = (value, setter) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setter(numericValue);
  };

  const capitalize = (text) => {
    return text.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Función helper para obtener la categoría de un personaje
  const getCharacterCategory = (characterName) => {
    if (!characterName || !usePresetCategory) return null;
    
    // Buscar en todas las categorías del estado
    for (const category of categories) {
      if (category.characters && Array.isArray(category.characters) && category.characters.includes(characterName)) {
        return {
          name: category.name,
          icon: category.icon
        };
      }
    }
    return null;
  };

  const handleExit = () => {
    resetGame();
    navigate('/dashboard');
  };

  useEffect(() => {
    if (gameState === 'playing' && !isPaused && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, isPaused, timeLeft]);

  // Efecto para reproducir tick del timer cuando queden exactamente 10 segundos
  const prevTimeLeftRef = useRef(null);
  useEffect(() => {
    if (gameState === 'playing' && !isPaused) {
      // Reproducir solo cuando cambia de 11 a 10 segundos (para evitar múltiples reproducciones)
      if (timeLeft === 10 && prevTimeLeftRef.current !== 10) {
        soundService.playTick();
      }
      prevTimeLeftRef.current = timeLeft;
    }
  }, [timeLeft, gameState, isPaused]);

  // Efecto para reproducir sonido al voltear la tarjeta
  const prevCardPressedRef = useRef(false);
  useEffect(() => {
    if (isCardPressed && !prevCardPressedRef.current) {
      // La tarjeta acaba de ser presionada (cambio de false a true)
      soundService.playCardFlip();
    }
    prevCardPressedRef.current = isCardPressed;
  }, [isCardPressed]);

  useEffect(() => {
    setPlayerCharacters(Array(parseInt(charactersPerPlayer) || 2).fill(''));
  }, [charactersPerPlayer]);

  const toggleCategory = (categoryId) => {
    if (selectedCategories.includes(categoryId)) {
      // Deseleccionar
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      // Seleccionar
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const handleCharacterChange = (index, value) => {
    const newChars = [...playerCharacters];
    newChars[index] = value;
    setPlayerCharacters(newChars);
  };

  const handleConfigSubmit = () => {
    const numPlayersInt = parseInt(numPlayers) || 0;

    if (numPlayersInt < 2) {
      alert('Debe haber al menos 2 jugadores');
      return;
    }

    if (gameMode === 'pairs' && numPlayersInt % 2 !== 0) {
      alert('Para jugar en parejas, el número de jugadores debe ser par');
      return;
    }

    if (usePresetCategory && !useAllCategories && selectedCategories.length === 0) {
      alert('Selecciona al menos una categoría predefinida o activa "Variados"');
      return;
    }

    if (usePresetCategory && (useAllCategories || selectedCategories.length > 0)) {
      let allCharacters = [];
      
      if (useAllCategories) {
        // Obtener personajes de TODAS las categorías del servidor
        for (const cat of categories) {
          if (cat.characters) {
            allCharacters = allCharacters.concat(cat.characters);
          }
        }
      } else {
        // Obtener todas las categorías seleccionadas
        const selectedCats = categories.filter(cat => selectedCategories.includes(cat.id));
        
        // Combinar todos los personajes de todas las categorías seleccionadas
        for (const cat of selectedCats) {
          if (cat.characters) {
            allCharacters = allCharacters.concat(cat.characters);
          }
        }
      }
      
      // Eliminar duplicados
      allCharacters = [...new Set(allCharacters)];
      
      const charsPerPlayer = parseInt(charactersPerPlayer) || 2;
      const calculatedMax = numPlayersInt * charsPerPlayer;
      
      let limitToUse;
      if (maxCharacters) {
        const maxChars = parseInt(maxCharacters);
        if (isNaN(maxChars) || maxChars < 1) {
          alert('El límite de personajes debe ser un número mayor a 0');
          return;
        }
        if (maxChars > allCharacters.length) {
          alert(`El límite no puede exceder ${allCharacters.length} personajes (total combinado de las categorías seleccionadas)`);
          return;
        }
        limitToUse = maxChars;
      } else {
        limitToUse = calculatedMax;
        if (limitToUse > allCharacters.length) {
          alert(`Se necesitan ${limitToUse} personajes (${numPlayersInt} jugadores × ${charsPerPlayer} por jugador), pero las categorías seleccionadas solo tienen ${allCharacters.length} personajes disponibles en total`);
          return;
        }
      }
      
      allCharacters = shuffleArray(allCharacters);
      allCharacters = allCharacters.slice(0, limitToUse);
      
      setCharacters(allCharacters);
      // Mostrar nombres de categorías separados por comas
      if (useAllCategories) {
        setCategory('Variados');
      } else {
        const selectedCats = categories.filter(cat => selectedCategories.includes(cat.id));
        const categoryNames = selectedCats.map(cat => cat.name).join(', ');
        setCategory(categoryNames);
      }
    }

    setGameState('setup');
  };

  const getNumTeams = () => {
    const numPlayersInt = parseInt(numPlayers) || 4;
    if (gameMode === 'pairs') {
      return numPlayersInt / 2;
    }
    return 2;
  };

  const isTeamFull = (teamNum) => {
    const numPlayersInt = parseInt(numPlayers) || 4;
    const playersInTeam = players.filter(p => p.team === teamNum).length;
    
    if (gameMode === 'pairs') {
      return playersInTeam >= 2;
    }
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
      alert(`Ya se alcanzó el límite de ${numPlayersInt} jugadores`);
      return;
    }

    if (!playerName.trim()) {
      alert('Ingresa el nombre del jugador');
      return;
    }

    const charsPerPlayer = parseInt(charactersPerPlayer) || 2;

    let trimmedChars = [];
    if (!usePresetCategory) {
      trimmedChars = playerCharacters.map((c) => c.trim()).filter((c) => c);
      if (trimmedChars.length !== charsPerPlayer) {
        alert(`Necesitas ${charsPerPlayer} personajes.`);
        return;
      }
      const uniqueChars = [...new Set(trimmedChars)];
      if (uniqueChars.length !== trimmedChars.length) {
        alert('Los personajes deben ser diferentes');
        return;
      }
    }

    if (isTeamFull(selectedTeam)) {
      alert(`${gameMode === 'pairs' ? 'La pareja' : 'El equipo'} ${selectedTeam} ya está completo`);
      return;
    }

    const newPlayer = {
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

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const initializeScores = () => {
    const numTeams = getNumTeams();
    const initialScores = {
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
      alert(`Se necesitan ${numPlayersInt} jugadores. Hay ${players.length}`);
      return;
    }
    if (characters.length < totalNeeded) {
      alert(`Se necesitan ${totalNeeded} personajes. Hay ${characters.length}`);
      return;
    }
    const allChars = [...characters];
    setCharacters(allChars);
    setRoundCharacters(allChars);
    setCurrentCharacter(pickRandomCharacter(allChars, []));
    setIsPaused(true);
    setGameState('round_intro');
    setRoundPlayerIndex(0);
    setGlobalPlayerIndex(0); // Inicializar índice global
    setCurrentTeam(1);
    setTimeLeft(parseInt(timePerRound) || 60);
    // Inicializar scores dinámicamente según número de equipos
    setScores(initializeScores());
    // Sonido de inicio de juego
    soundService.playGameStart();
  };

  // Helper para calcular el siguiente turno alternando entre equipos y jugadores
  const getNextTurn = (playersList, currentGlobalIndex) => {
    // Organizar jugadores por equipo
    const playersByTeam = {};
    playersList.forEach((player) => {
      const team = player.team;
      if (!playersByTeam[team]) {
        playersByTeam[team] = [];
      }
      playersByTeam[team].push(player);
    });

    // Obtener todos los equipos y ordenarlos
    const teams = Object.keys(playersByTeam).map(Number).sort((a, b) => a - b);
    const totalTeams = teams.length;
    const maxPlayersPerTeam = Math.max(...teams.map(team => playersByTeam[team].length));

    // Calcular el siguiente índice global
    const nextGlobalIndex = currentGlobalIndex + 1;
    
    // Calcular qué posición de jugador dentro del equipo (0, 1, 2, ...)
    const playerPosition = Math.floor(nextGlobalIndex / totalTeams);
    
    // Calcular qué equipo debe jugar (alternando)
    const teamIndex = nextGlobalIndex % totalTeams;
    const nextTeam = teams[teamIndex];
    
    // Obtener el jugador específico de ese equipo en esa posición
    const teamPlayers = playersByTeam[nextTeam] || [];
    const playerIndexInTeam = playerPosition % teamPlayers.length;
    
    // Si hemos completado una ronda completa de todos los jugadores de todos los equipos, reiniciar
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

  // Helper para obtener el equipo y jugador actual basándose en el índice global
  const getCurrentTurn = (playersList, currentGlobalIndex) => {
    // Organizar jugadores por equipo
    const playersByTeam = {};
    playersList.forEach((player) => {
      const team = player.team;
      if (!playersByTeam[team]) {
        playersByTeam[team] = [];
      }
      playersByTeam[team].push(player);
    });

    // Obtener todos los equipos y ordenarlos
    const teams = Object.keys(playersByTeam).map(Number).sort((a, b) => a - b);
    const totalTeams = teams.length;

    // Calcular qué posición de jugador dentro del equipo (0, 1, 2, ...)
    const playerPosition = Math.floor(currentGlobalIndex / totalTeams);
    
    // Calcular qué equipo debe jugar (alternando)
    const teamIndex = currentGlobalIndex % totalTeams;
    const currentTeamNum = teams[teamIndex];
    
    // Obtener el jugador específico de ese equipo en esa posición
    const teamPlayers = playersByTeam[currentTeamNum] || [];
    const playerIndexInTeam = playerPosition % teamPlayers.length;

    return {
      team: currentTeamNum,
      playerIndexInTeam: playerIndexInTeam
    };
  };

  const getCurrentPlayer = () => {
    const currentTurn = getCurrentTurn(players, globalPlayerIndex);
    const teamPlayers = players.filter(p => p.team === currentTurn.team);
    if (teamPlayers.length === 0) return null;
    return teamPlayers[currentTurn.playerIndexInTeam];
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

  const pickRandomCharacter = (availableChars, blocked = []) => {
    const pool = availableChars.filter(c => !blocked.includes(c));
    if (pool.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
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
        // Sonido de cambio de ronda
        soundService.playRoundStart();
        // No cambiar turno en cambio de ronda mid-turn, mantener el mismo jugador
      } else {
        setGameState('finished');
        // Sonido de fin de juego
        soundService.playGameEnd();
      }
    } else {
      // Hay personajes restantes: solo cambiar el personaje, mantener el mismo turno
      // El jugador continúa jugando hasta que falle o se le acabe el tiempo
      setRoundCharacters(newRoundCharacters);
      const newChar = pickRandomCharacter(newRoundCharacters, blockedCharacters);
      setCurrentCharacter(newChar);
      // No cambiar turno, el jugador sigue jugando
    }
  };

  const handleTimeUp = () => {
    const timePerRoundInt = parseInt(timePerRound) || 60;
    
    // Sonido de tiempo agotado
    soundService.playTimeUp();
    
    setIsPaused(true);
    
    // Avanzar al siguiente turno alternando entre equipos usando la función helper
    const nextTurn = getNextTurn(players, globalPlayerIndex);
    
    // Si se completó un ciclo completo (vuelve al índice 0) pero todavía hay personajes,
    // simplemente continuar con el siguiente ciclo sin cambiar de ronda
    // El cambio de ronda solo ocurre cuando se terminan todos los personajes (en advanceAfterHit)
    
    setGlobalPlayerIndex(nextTurn.globalIndex);
    setCurrentTeam(nextTurn.team);
    setRoundPlayerIndex(nextTurn.playerIndexInTeam);
    setBlockedCharacters([]);
    setCurrentCharacter(pickRandomCharacter(roundCharacters, []));
    setTimeLeft(timePerRoundInt);
    setGameState('waiting');
  };

  const handleHit = () => {
    setIsCardPressed(false);
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return;
    
    // Sonido de acierto
    soundService.playHit();
    
    // Animación del botón
    setButtonAnimation(prev => ({ ...prev, hit: true }));
    setTimeout(() => setButtonAnimation(prev => ({ ...prev, hit: false })), 300);
    
    // Animación de la tarjeta (slide out)
    setCardAnimation('slide-out-right');
    
    // Después de la animación, cambiar el personaje y hacer slide in
    setTimeout(() => {
      const roundKey = `round${round}`;
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
      
      // Aplicar slide in inmediatamente sin limpiar primero para evitar parpadeo
      // Usar doble requestAnimationFrame para asegurar que el DOM se actualice
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // La nueva card ya está renderizada, aplicar animación de entrada
          setCardAnimation('slide-in-left');
          setTimeout(() => {
            setCardAnimation('');
          }, 250);
        });
      });
    }, 300);
  };

  const handlePlayerReady = () => {
    setBlockedCharacters([]);
    setIsCardPressed(false);
    setIsPaused(false);
    setGameState('playing');
    // Sonido de inicio de ronda (cuando se confirma estar listo)
    soundService.playRoundStart();
  };

  const handleFail = () => {
    // Sonido de fallo
    soundService.playFail();
    
    // Animación del botón
    setButtonAnimation(prev => ({ ...prev, fail: true }));
    setTimeout(() => setButtonAnimation(prev => ({ ...prev, fail: false })), 300);
    
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
    setGlobalPlayerIndex(0); // Resetear índice global
    setScores({ round1: { team1: 0, team2: 0 }, round2: { team1: 0, team2: 0 }, round3: { team1: 0, team2: 0 } });
    setUsedAvatars([]);
    setSelectedAvatar(LOCAL_AVATARS[0]);
    setSelectedTeam(1);
    setBlockedCharacters([]);
    setPlayerStats({});
    setIsCardPressed(false);
    setCategory('');
    setUsePresetCategory(false);
    setSelectedCategories([]);
  };

  const playAgain = () => {
    setCharacters([]);
    setRoundCharacters([]);
    setCurrentCharacter(null);
    setRound(1);
    setCurrentTeam(1);
    setRoundPlayerIndex(0);
    setGlobalPlayerIndex(0); // Resetear índice global
    setScores({ round1: { team1: 0, team2: 0 }, round2: { team1: 0, team2: 0 }, round3: { team1: 0, team2: 0 } });
    setBlockedCharacters([]);
    setPlayerStats({});
    setIsCardPressed(false);
    setGameState('reconfig');
  };

  const handleReconfigSubmit = () => {
    const numPlayersInt = players.length;

    if (numPlayersInt < 2) {
      alert('Debe haber al menos 2 jugadores');
      return;
    }

    if (gameMode === 'pairs' && numPlayersInt % 2 !== 0) {
      alert('Para jugar en parejas, el número de jugadores debe ser par');
      return;
    }
    
    setNumPlayers(numPlayersInt.toString());

    if (usePresetCategory && !useAllCategories && selectedCategories.length === 0) {
      alert('Selecciona al menos una categoría predefinida o activa "Variados"');
      return;
    }

    if (usePresetCategory && (useAllCategories || selectedCategories.length > 0)) {
      let allCharacters = [];
      
      if (useAllCategories) {
        // Obtener personajes de TODAS las categorías del servidor
        for (const cat of categories) {
          if (cat.characters) {
            allCharacters = allCharacters.concat(cat.characters);
          }
        }
      } else {
        // Obtener todas las categorías seleccionadas
        const selectedCats = categories.filter(cat => selectedCategories.includes(cat.id));
        
        // Combinar todos los personajes de todas las categorías seleccionadas
        for (const cat of selectedCats) {
          if (cat.characters) {
            allCharacters = allCharacters.concat(cat.characters);
          }
        }
      }
      
      // Eliminar duplicados
      allCharacters = [...new Set(allCharacters)];
      
      const charsPerPlayer = parseInt(charactersPerPlayer) || 2;
      const calculatedMax = numPlayersInt * charsPerPlayer;
      
      let limitToUse;
      if (maxCharacters) {
        const maxChars = parseInt(maxCharacters);
        if (isNaN(maxChars) || maxChars < 1) {
          alert('El límite de personajes debe ser un número mayor a 0');
          return;
        }
        if (maxChars > allCharacters.length) {
          alert(`El límite no puede exceder ${allCharacters.length} personajes (total combinado de las categorías seleccionadas)`);
          return;
        }
        limitToUse = maxChars;
      } else {
        limitToUse = calculatedMax;
        if (limitToUse > allCharacters.length) {
          alert(`Se necesitan ${limitToUse} personajes (${numPlayersInt} jugadores × ${charsPerPlayer} por jugador), pero las categorías seleccionadas solo tienen ${allCharacters.length} personajes disponibles en total`);
          return;
        }
      }
      
      allCharacters = shuffleArray(allCharacters);
      allCharacters = allCharacters.slice(0, limitToUse);
      
      setCharacters(allCharacters);
      // Mostrar nombres de categorías separados por comas
      if (useAllCategories) {
        setCategory('Variados');
      } else {
        const selectedCats = categories.filter(cat => selectedCategories.includes(cat.id));
        const categoryNames = selectedCats.map(cat => cat.name).join(', ');
        setCategory(categoryNames);
      }
      
      setRoundCharacters(allCharacters);
      setCurrentCharacter(pickRandomCharacter(allCharacters, []));
      setIsPaused(true);
      setTimeLeft(parseInt(timePerRound) || 60);
      setGameState('round_intro');
      // Inicializar scores dinámicamente según número de equipos
      setScores(initializeScores());
    } else {
      setCharacters([]);
      setCurrentPlayerForChars(0);
      setNewPlayerCharacters(Array(parseInt(charactersPerPlayer) || 2).fill(''));
      setGameState('new_characters');
    }
  };

  const handleNewCharacterChange = (index, value) => {
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
      // Inicializar scores dinámicamente según número de equipos
      setScores(initializeScores());
      return;
    }

    const charsPerPlayer = parseInt(charactersPerPlayer) || 2;
    const trimmedChars = newPlayerCharacters.map((c) => c.trim()).filter((c) => c);
    
    if (trimmedChars.length !== charsPerPlayer) {
      alert(`Necesitas ${charsPerPlayer} personajes.`);
      return;
    }
    
    const uniqueChars = [...new Set(trimmedChars)];
    if (uniqueChars.length !== trimmedChars.length) {
      alert('Los personajes deben ser diferentes');
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
      // Inicializar scores dinámicamente según número de equipos
      setScores(initializeScores());
    }
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
      alert('El nombre no puede estar vacío');
      return;
    }

    const charsPerPlayer = parseInt(charactersPerPlayer) || 2;
    const trimmedChars = editPlayerCharacters.map(c => c.trim()).filter(c => c);
    if (trimmedChars.length !== charsPerPlayer) {
      alert(`Necesitas ${charsPerPlayer} personajes.`);
      return;
    }

    if (editPlayerTeam !== editingPlayer.team) {
      const targetTeamPlayers = players.filter(p => p.team === editPlayerTeam && p.id !== editingPlayer.id);
      const maxPerTeam = gameMode === 'pairs' ? 2 : Math.ceil((parseInt(numPlayers) || 4) / 2);
      if (targetTeamPlayers.length >= maxPerTeam) {
        alert(`El ${gameMode === 'pairs' ? 'pareja' : 'equipo'} ${editPlayerTeam} está lleno`);
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

  const deletePlayer = (playerId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este jugador?')) {
      return;
    }

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
  };

  const handleEditCharacterChange = (index, value) => {
    const newChars = [...editPlayerCharacters];
    newChars[index] = value;
    setEditPlayerCharacters(newChars);
  };

  const totalCharactersNeeded = parseInt(numPlayers) * (parseInt(charactersPerPlayer) || 2);

  // CONFIG SCREEN
  if (gameState === 'config') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'transparent', padding: '24px', paddingBottom: '40px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '28px' }}>🎮</span>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: colors.text, margin: 0, textTransform: 'uppercase' }}>Un Solo Dispositivo</h1>
            </div>
            <Button title="Volver" onClick={() => navigate('/dashboard')} variant="secondary" size="small" silent />
          </div>

          <Card>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: colors.text, marginBottom: '16px', textTransform: 'uppercase' }}>Configurar Partida</h2>
            <Input
              label="Número de jugadores"
              value={numPlayers}
              onChange={(val) => handleNumericInput(val, setNumPlayers)}
              placeholder="4"
            />
            <p style={{ color: colors.textMuted, fontSize: '12px', marginTop: '-8px', marginBottom: '16px' }}>
              Total de personajes: {totalCharactersNeeded}
            </p>

            <label style={{ color: colors.textSecondary, fontSize: '14px', fontWeight: '500', marginBottom: '8px', marginTop: '8px', display: 'block' }}>
              Modo de juego
            </label>
            <div style={{ display: 'flex', backgroundColor: colors.surfaceLight, borderRadius: '12px', padding: '4px', marginBottom: '16px' }}>
              <button
                onClick={() => setGameMode('teams')}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: gameMode === 'teams' ? colors.primary : 'transparent',
                  color: gameMode === 'teams' ? colors.text : colors.textMuted,
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Equipos
              </button>
              <button
                onClick={() => setGameMode('pairs')}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: gameMode === 'pairs' ? colors.primary : 'transparent',
                  color: gameMode === 'pairs' ? colors.text : colors.textMuted,
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Parejas
              </button>
            </div>

            <Input
              label="Personajes por jugador"
              value={charactersPerPlayer}
              onChange={(val) => handleNumericInput(val, setCharactersPerPlayer)}
              placeholder="2"
            />
            
            <label style={{ color: colors.textSecondary, fontSize: '14px', fontWeight: '500', marginBottom: '8px', marginTop: '8px', display: 'block' }}>
              Tiempo por ronda
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {timeOptions.map((time) => (
                <button
                  key={time}
                  onClick={() => setTimePerRound(time.toString())}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: timePerRound === time.toString() ? colors.primary : colors.surfaceLight,
                    color: timePerRound === time.toString() ? colors.text : colors.textMuted,
                    fontWeight: '600',
                    fontSize: '15px',
                    minWidth: '60px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {time}s
                </button>
              ))}
            </div>
            
            <label style={{ color: colors.textSecondary, fontSize: '14px', fontWeight: '500', marginBottom: '8px', marginTop: '8px', display: 'block' }}>
              Categoría de personajes
            </label>
            <div style={{ display: 'flex', backgroundColor: colors.surfaceLight, borderRadius: '12px', padding: '4px', marginBottom: '16px' }}>
              <button
                onClick={() => {
                  setUsePresetCategory(false);
                  setSelectedCategories([]);
                  setMaxCharacters('');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: !usePresetCategory ? colors.primary : 'transparent',
                  color: !usePresetCategory ? colors.text : colors.textMuted,
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Manual
              </button>
              <button
                onClick={() => setUsePresetCategory(true)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: usePresetCategory ? colors.primary : 'transparent',
                  color: usePresetCategory ? colors.text : colors.textMuted,
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Predefinida
              </button>
            </div>

            {!usePresetCategory ? (
              <>
                <Input
                  label="Categoría (opcional)"
                  value={category}
                  onChange={setCategory}
                  placeholder="Ej: Películas, Famosos, Anime..."
                />
                {category && (
                  <p style={{ color: colors.primary, fontSize: '13px', marginTop: '4px', marginBottom: '8px', fontStyle: 'italic' }}>
                    Los jugadores agregarán personajes de: {category}
                  </p>
                )}
              </>
            ) : (
              <div style={{ marginTop: '8px' }}>
                <p style={{ color: colors.textSecondary, fontSize: '12px', marginBottom: '8px' }}>Selecciona una o más categorías:</p>
                
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
                
                {!useAllCategories && (
                  <>
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
                <div className="categories-grid">
                  {filteredCategories.map((cat) => {
                    const isSelected = selectedCategories.includes(cat.id);
                    return (
                      <div
                        key={cat.id}
                        onClick={() => toggleCategory(cat.id)}
                        className={`category-card ${isSelected ? 'selected' : ''}`}
                        style={{ cursor: 'pointer', position: 'relative' }}
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
                          fontSize: '12px',
                          color: colors.text
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
                  )}
                </>
                )}
                {(useAllCategories || selectedCategories.length > 0) && (
                  <div style={{ backgroundColor: colors.primary + '15', borderRadius: '12px', padding: '12px', borderLeft: `4px solid ${colors.primary}`, marginTop: '12px' }}>
                    {!useAllCategories && (
                      <>
                    <div style={{ color: colors.text, fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                      📚 Categorías Seleccionadas ({selectedCategories.length})
                    </div>
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
                        <div style={{ color: colors.success, fontSize: '12px', fontWeight: '500', marginBottom: '12px' }}>
                          ✅ {totalChars} personajes disponibles en total
                        </div>
                      );
                    })()}
                    
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${colors.border}` }}>
                      <Input
                        label="Límite de personajes (opcional)"
                        value={maxCharacters}
                        onChange={setMaxCharacters}
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
                          : `Se usarán ${parseInt(numPlayers) * parseInt(charactersPerPlayer)} personajes (calculado automáticamente: ${numPlayers} jugadores × ${charactersPerPlayer} por jugador)`
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <Button
              title="Continuar"
              onClick={handleConfigSubmit}
              size="large"
              style={{ width: '100%', marginTop: '16px' }}
              disabled={usePresetCategory && !useAllCategories && selectedCategories.length === 0}
            />
          </Card>
        </div>
      </div>
    );
  }

  // SETUP SCREEN
  if (gameState === 'setup') {
    const availableAvatars = LOCAL_AVATARS.filter(a => !usedAvatars.includes(a));
    
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'transparent', padding: '24px', paddingBottom: '40px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: colors.text, margin: 0 }}>Agregar Jugadores</h1>
            <Button title="Atrás" onClick={() => setGameState('config')} variant="secondary" size="small" />
          </div>

          <div style={{ backgroundColor: colors.surface, borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <p style={{ color: colors.textMuted, fontSize: '14px', margin: '4px 0' }}>Jugadores: {players.length} / {numPlayers}</p>
            {usePresetCategory ? (
              <p style={{ color: colors.textMuted, fontSize: '14px', margin: '4px 0' }}>Personajes: {characters.length} (predefinidos)</p>
            ) : (
              <p style={{ color: colors.textMuted, fontSize: '14px', margin: '4px 0' }}>Personajes: {characters.length} / {totalCharactersNeeded}</p>
            )}
          </div>

          {category && (
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: colors.primary, borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
              {usePresetCategory && selectedCategories.length > 0 && (() => {
                const firstCat = categories.find(c => c.id === selectedCategories[0]);
                return firstCat ? (
                  <span style={{ fontSize: '28px', marginRight: '12px' }}>
                    {firstCat.icon}
                  </span>
                ) : null;
              })()}
              <div style={{ flex: 1 }}>
                <div style={{ color: colors.text, fontSize: '10px', fontWeight: '600', letterSpacing: '1px', opacity: 0.8 }}>CATEGORÍA</div>
                <div style={{ color: colors.text, fontSize: '18px', fontWeight: 'bold' }}>{category}</div>
              </div>
            </div>
          )}

          {!isPlayerLimitReached() ? (
            <Card style={{ marginBottom: '16px' }}>
              <h3 style={{ color: colors.text, fontWeight: 'bold', marginBottom: '12px' }}>Agregar Jugador</h3>
              
              <label style={{ color: colors.textSecondary, fontSize: '14px', fontWeight: '500', marginBottom: '8px', marginTop: '8px', display: 'block' }}>
                {gameMode === 'pairs' ? 'Selecciona la pareja' : 'Selecciona el equipo'}
              </label>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                {Array.from({ length: getNumTeams() }, (_, i) => i + 1).map((teamNum) => {
                  const teamPlayers = players.filter(p => p.team === teamNum);
                  const isFull = isTeamFull(teamNum);
                  const maxPlayers = gameMode === 'pairs' ? 2 : Math.ceil((parseInt(numPlayers) || 4) / 2);
                  
                  return (
                    <button
                      key={teamNum}
                      onClick={() => !isFull && setSelectedTeam(teamNum)}
                      disabled={isFull}
                      style={{
                        flex: 1,
                        backgroundColor: isFull ? colors.surfaceLight : (selectedTeam === teamNum ? colors.surface : colors.surfaceLight),
                        borderRadius: '12px',
                        padding: '12px',
                        textAlign: 'center',
                        border: `2px solid ${selectedTeam === teamNum ? colors.primary : 'transparent'}`,
                        opacity: isFull ? 0.5 : 1,
                        cursor: isFull ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <div style={{
                        color: isFull ? colors.textMuted : (selectedTeam === teamNum ? colors.primary : colors.textSecondary),
                        fontSize: '14px',
                        fontWeight: '600',
                      }}>
                        {gameMode === 'pairs' ? `Pareja ${teamNum}` : `Equipo ${teamNum}`}
                      </div>
                      <div style={{
                        color: colors.textMuted,
                        fontSize: '12px',
                        marginTop: '4px',
                      }}>
                        {teamPlayers.length}/{maxPlayers}
                      </div>
                      {isFull && <div style={{ color: colors.success, fontSize: '10px', fontWeight: 'bold', marginTop: '4px' }}>LLENO</div>}
                    </button>
                  );
                })}
              </div>
              
              <label style={{ color: colors.textSecondary, fontSize: '14px', fontWeight: '500', marginBottom: '8px', marginTop: '8px', display: 'block' }}>
                Elige tu avatar
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                {availableAvatars.map((avatar) => (
                  <button
                    key={avatar}
                    onClick={() => setSelectedAvatar(avatar)}
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '25px',
                      backgroundColor: selectedAvatar === avatar ? colors.surface : colors.surfaceLight,
                      border: `2px solid ${selectedAvatar === avatar ? colors.primary : 'transparent'}`,
                      fontSize: '28px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
              
              <Input placeholder="Nombre del jugador" value={playerName} onChange={setPlayerName} />
              {!usePresetCategory && Array(parseInt(charactersPerPlayer) || 2).fill(0).map((_, index) => (
                <Input
                  key={index}
                  placeholder={`Personaje ${index + 1}`}
                  value={playerCharacters[index] || ''}
                  onChange={(value) => handleCharacterChange(index, value)}
                />
              ))}
              <Button title="Agregar Jugador" onClick={handleAddPlayer} style={{ width: '100%' }} />
            </Card>
          ) : (
            <Card style={{ marginBottom: '16px', textAlign: 'center', padding: '24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>✅</div>
              <div style={{ color: colors.text, fontSize: '18px', fontWeight: 'bold' }}>¡Todos los jugadores agregados!</div>
              <div style={{ color: colors.textMuted, fontSize: '14px', marginTop: '4px' }}>{players.length} de {numPlayers} jugadores</div>
            </Card>
          )}

          {editingPlayer && (
            <Card style={{ marginBottom: '16px', border: `2px solid ${colors.primary}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ color: colors.text, fontSize: '18px', fontWeight: 'bold' }}>✏️ Editar Jugador</h3>
                <button
                  onClick={cancelEditPlayer}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '16px',
                    backgroundColor: colors.surfaceLight,
                    border: 'none',
                    color: colors.textMuted,
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>
              
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '48px' }}>{editingPlayer.avatar}</div>
              </div>

              <label style={{ color: colors.textSecondary, fontSize: '14px', fontWeight: '500', marginBottom: '8px', marginTop: '8px', display: 'block' }}>
                Nombre
              </label>
              <Input
                placeholder="Nombre del jugador"
                value={editPlayerName}
                onChange={setEditPlayerName}
              />

              <label style={{ color: colors.textSecondary, fontSize: '14px', fontWeight: '500', marginBottom: '8px', marginTop: '8px', display: 'block' }}>
                {gameMode === 'pairs' ? 'Pareja' : 'Equipo'}
              </label>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                {Array.from({ length: getNumTeams() }, (_, i) => i + 1).map((teamNum) => {
                  const teamPlayers = players.filter(p => p.team === teamNum && p.id !== editingPlayer.id);
                  const maxPlayers = gameMode === 'pairs' ? 2 : Math.ceil((parseInt(numPlayers) || 4) / 2);
                  const isFull = teamPlayers.length >= maxPlayers;
                  
                  return (
                    <button
                      key={teamNum}
                      onClick={() => !isFull && setEditPlayerTeam(teamNum)}
                      disabled={isFull}
                      style={{
                        flex: 1,
                        backgroundColor: isFull ? colors.surfaceLight : (editPlayerTeam === teamNum ? colors.surface : colors.surfaceLight),
                        borderRadius: '12px',
                        padding: '12px',
                        textAlign: 'center',
                        border: `2px solid ${editPlayerTeam === teamNum ? colors.primary : 'transparent'}`,
                        opacity: isFull ? 0.5 : 1,
                        cursor: isFull ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <div style={{
                        color: isFull ? colors.textMuted : (editPlayerTeam === teamNum ? colors.primary : colors.textSecondary),
                        fontSize: '14px',
                        fontWeight: '600',
                      }}>
                        {gameMode === 'pairs' ? `Pareja ${teamNum}` : `Equipo ${teamNum}`}
                      </div>
                    </button>
                  );
                })}
              </div>

              <label style={{ color: colors.textSecondary, fontSize: '14px', fontWeight: '500', marginBottom: '8px', marginTop: '8px', display: 'block' }}>
                Personajes
              </label>
              {Array(parseInt(charactersPerPlayer) || 2).fill(0).map((_, index) => (
                <Input
                  key={index}
                  placeholder={`Personaje ${index + 1}`}
                  value={editPlayerCharacters[index] || ''}
                  onChange={(value) => handleEditCharacterChange(index, value)}
                />
              ))}

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <Button title="Cancelar" onClick={cancelEditPlayer} variant="secondary" style={{ flex: 1 }} />
                <Button title="Guardar" onClick={saveEditPlayer} style={{ flex: 1 }} />
              </div>
            </Card>
          )}

          {players.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              {Array.from({ length: getNumTeams() }, (_, i) => i + 1).map((teamNum) => {
                const teamPlayers = players.filter(p => p.team === teamNum);
                const teamColors = [colors.primary, colors.secondary, colors.warning, colors.success, colors.danger];
                const teamColor = teamColors[(teamNum - 1) % teamColors.length];
                
                return (
                  <Card key={teamNum}>
                    <h3 style={{ color: teamColor, fontWeight: 'bold', marginBottom: '8px' }}>
                      {gameMode === 'pairs' ? `Pareja ${teamNum}` : `Equipo ${teamNum}`}
                    </h3>
                    {teamPlayers.map((p) => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${colors.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                          <span style={{ fontSize: '20px', marginRight: '8px' }}>{p.avatar}</span>
                          <span style={{ color: colors.text, fontSize: '14px' }}>{capitalize(p.name)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => startEditPlayer(p)}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              backgroundColor: colors.surfaceLight,
                              border: 'none',
                              fontSize: '14px',
                              cursor: 'pointer',
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => deletePlayer(p.id)}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              backgroundColor: colors.danger + '20',
                              border: 'none',
                              fontSize: '14px',
                              cursor: 'pointer',
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                    {teamPlayers.length === 0 && (
                      <div style={{ color: colors.textMuted, fontSize: '12px', fontStyle: 'italic', textAlign: 'center', padding: '8px 0' }}>Sin jugadores</div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {players.length >= parseInt(numPlayers) && (usePresetCategory || characters.length >= totalCharactersNeeded) && (
            <div style={{ marginBottom: '40px' }}>
              <Button title="Iniciar Juego" onClick={handleStartGame} size="large" style={{ width: '100%' }} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ROUND INTRO SCREEN
  if (gameState === 'round_intro') {
    const roundInfo = roundDetails[round];
    const numTeams = getNumTeams();

    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'transparent', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px' }}>
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 20px' }}>
          <div style={{ backgroundColor: colors.primary, padding: '6px 20px', borderRadius: '20px', marginBottom: '16px' }}>
            <div style={{ color: colors.text, fontSize: '14px', fontWeight: 'bold', letterSpacing: '2px' }}>RONDA {round}</div>
          </div>

          <div style={{ fontSize: '64px', marginBottom: '12px' }}>{roundInfo.icon}</div>
          <h1 style={{ color: colors.text, fontSize: '36px', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '2px' }}>{roundInfo.title}</h1>
          
          <p style={{ color: colors.textSecondary, fontSize: '16px', textAlign: 'center', marginBottom: '20px', lineHeight: '22px' }}>{roundInfo.description}</p>

          <div style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '16px', width: '100%', marginBottom: '16px' }}>
            {roundInfo.tips.map((tip, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: index < roundInfo.tips.length - 1 ? '8px' : '0' }}>
                <span style={{ color: colors.primary, fontSize: '16px', marginRight: '10px', fontWeight: 'bold' }}>•</span>
                <span style={{ color: colors.text, fontSize: '14px', flex: 1, lineHeight: '20px' }}>{tip}</span>
              </div>
            ))}
          </div>

          {round > 1 && numTeams > 0 && (
            <div style={{ alignItems: 'center', marginTop: '12px' }}>
              <div style={{ color: colors.textMuted, fontSize: '11px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Puntuación actual</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {Array.from({ length: numTeams }, (_, i) => i + 1).map((teamNum) => {
                  const teamScore = getTotalScore(teamNum);
                  const teamColors = [colors.primary, colors.secondary, colors.warning, colors.success, colors.danger];
                  const teamColor = teamColors[(teamNum - 1) % teamColors.length];
                  return (
                    <div key={teamNum} style={{ alignItems: 'center' }}>
                      <div style={{ color: teamColor, fontSize: '11px', fontWeight: '600' }}>{gameMode === 'pairs' ? `Pareja ${teamNum}` : `Equipo ${teamNum}`}</div>
                      <div style={{ color: colors.text, fontSize: '28px', fontWeight: 'bold' }}>{teamScore}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Button
            title="¡Comenzar Ronda!"
            onClick={() => setGameState('waiting')}
            size="large"
            style={{ margin: '0 20px 6px 20px' }}
          />
          <button
            onClick={() => setShowExitModal(true)}
            style={{
              width: 'calc(100% - 40px)',
              margin: '0 20px 20px 20px',
              textAlign: 'center',
              padding: '6px',
              border: 'none',
              background: 'transparent',
              color: colors.textMuted,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            🚪 Salir del Juego
          </button>
        </div>
      </div>
    );
  }

  // ROUND INTRO MID-TURN
  if (gameState === 'round_intro_mid_turn') {
    const roundInfo = roundDetails[round];
    const currentPlayer = getCurrentPlayer();

    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'transparent', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px' }}>
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 20px' }}>
          <div style={{ backgroundColor: colors.surface, padding: '8px 18px', borderRadius: '20px', marginBottom: '12px' }}>
            <div style={{ color: colors.warning, fontSize: '16px', fontWeight: 'bold' }}>⏱️ {timeLeft}s restantes</div>
          </div>

          <div style={{ backgroundColor: colors.warning, padding: '6px 20px', borderRadius: '20px', marginBottom: '16px' }}>
            <div style={{ color: colors.text, fontSize: '14px', fontWeight: 'bold', letterSpacing: '2px' }}>¡NUEVA RONDA!</div>
          </div>

          <div style={{ fontSize: '64px', marginBottom: '12px' }}>{roundInfo.icon}</div>
          <h1 style={{ color: colors.text, fontSize: '32px', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '2px' }}>RONDA {round}: {roundInfo.title}</h1>
          
          <p style={{ color: colors.textSecondary, fontSize: '16px', textAlign: 'center', marginBottom: '20px', lineHeight: '22px' }}>{roundInfo.description}</p>

          <div style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '16px', width: '100%', alignItems: 'center', marginTop: '12px' }}>
            <div style={{ color: colors.textMuted, fontSize: '13px', marginBottom: '6px' }}>Sigues jugando:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '36px' }}>{currentPlayer?.avatar}</div>
              <div style={{ color: colors.text, fontSize: '20px', fontWeight: 'bold' }}>{currentPlayer ? capitalize(currentPlayer.name) : ''}</div>
            </div>
          </div>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '20px' }}>
          <Button
            title="¡Continuar!"
            onClick={() => {
              setIsCardPressed(false);
              setIsPaused(false);
              setGameState('playing');
              // Sonido de inicio de ronda
              soundService.playRoundStart();
            }}
            size="large"
            style={{ margin: '0 20px 6px 20px' }}
          />
          <button
            onClick={() => setShowExitModal(true)}
            style={{
              width: 'calc(100% - 40px)',
              margin: '0 20px 20px 20px',
              textAlign: 'center',
              padding: '6px',
              border: 'none',
              background: 'transparent',
              color: colors.textMuted,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            🚪 Salir del Juego
          </button>
        </div>
      </div>
    );
  }

  // WAITING SCREEN
  if (gameState === 'waiting') {
    const nextPlayer = getCurrentPlayer();
    const numTeams = getNumTeams();

    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
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
        <Card style={{ textAlign: 'center', padding: '24px 20px', width: '100%', maxWidth: '400px' }}>
          <div style={{ color: colors.primary, fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>Ronda {round}</div>
          <div style={{ color: colors.textSecondary, fontSize: '13px', textAlign: 'center', marginBottom: '12px' }}>{roundRules[round]}</div>
          
          <div style={{ width: '100%', height: '1px', backgroundColor: colors.border, margin: '12px 0' }} />
          
          <div style={{ color: colors.textMuted, fontSize: '13px', marginBottom: '6px' }}>Siguiente turno:</div>
          <div style={{ position: 'relative', alignItems: 'center' }}>
            {nextPlayer && isPlayerMVP(nextPlayer.id) && (
              <div style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', fontSize: '28px', zIndex: 1 }}>👑</div>
            )}
            <div style={{ fontSize: '56px', marginBottom: '6px' }}>{nextPlayer?.avatar}</div>
          </div>
          <div style={{ color: colors.text, fontSize: '32px', fontWeight: 'bold', textAlign: 'center', marginBottom: '4px' }}>{nextPlayer?.name}</div>
          {nextPlayer && (
            <div style={{ color: colors.textMuted, fontSize: '12px', marginBottom: '10px' }}>
              ✓ {getPlayerStats(nextPlayer.id).hits} aciertos • ✗ {getPlayerStats(nextPlayer.id).fails} fallos
            </div>
          )}
          <div style={{
            backgroundColor: (() => {
              const teamColors = [colors.primary, colors.secondary, colors.warning, colors.success, colors.danger];
              return teamColors[(currentTeam - 1) % teamColors.length];
            })(),
            padding: '6px 18px',
            borderRadius: '20px',
            display: 'inline-block',
            marginBottom: '16px',
          }}>
            <div style={{ color: colors.text, fontSize: '14px', fontWeight: '600' }}>{gameMode === 'pairs' ? `Pareja ${currentTeam}` : `Equipo ${currentTeam}`}</div>
          </div>
          
          {numTeams > 0 && (
            <div style={{ display: 'flex', gap: '20px', marginTop: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {Array.from({ length: numTeams }, (_, i) => i + 1).map((teamNum) => {
                const teamScore = getTotalScore(teamNum);
                const teamColors = [colors.primary, colors.secondary, colors.warning, colors.success, colors.danger];
                const teamColor = teamColors[(teamNum - 1) % teamColors.length];
                return (
                  <div key={teamNum} style={{ alignItems: 'center' }}>
                    <div style={{ color: teamColor, fontSize: '11px' }}>{gameMode === 'pairs' ? `Pareja ${teamNum}` : `Equipo ${teamNum}`}</div>
                    <div style={{ color: colors.text, fontSize: '24px', fontWeight: 'bold' }}>{teamScore}</div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ color: colors.textMuted, fontSize: '13px', textAlign: 'center', marginTop: '16px', fontStyle: 'italic' }}>
            Pasa el dispositivo a {nextPlayer?.name}
          </div>
          
          <Button
            title="¡Estoy Listo!"
            onClick={handlePlayerReady}
            size="large"
            style={{ marginTop: '16px', width: '100%' }}
          />
          <button
            onClick={() => setShowExitModal(true)}
            style={{
              width: '100%',
              textAlign: 'center',
              padding: '6px',
              border: 'none',
              background: 'transparent',
              color: colors.textMuted,
              fontSize: '13px',
              cursor: 'pointer',
              marginTop: '6px',
            }}
          >
            🚪 Salir del Juego
          </button>
        </Card>
      </div>
    );
  }

  // PLAYING SCREEN
  if (gameState === 'playing') {
    const currentPlayer = getCurrentPlayer();
    const numTeams = getNumTeams();
    const displayCharacter = currentCharacter;

    if ((!displayCharacter || blockedCharacters.includes(displayCharacter)) && roundCharacters.length > 0) {
      const availableChars = roundCharacters.filter(c => !blockedCharacters.includes(c));
      if (availableChars.length === 0) {
        handleTimeUp();
      } else {
        const newChar = pickRandomCharacter(roundCharacters, blockedCharacters);
        setCurrentCharacter(newChar);
      }
    }

    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'transparent', display: 'flex', flexDirection: 'column' }}>
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
        <div style={{ padding: '8px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: colors.surface, borderRadius: '16px', padding: '12px', marginBottom: '8px' }}>
            <div style={{ position: 'relative', marginRight: '12px' }}>
              {currentPlayer && isPlayerMVP(currentPlayer.id) && (
                <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', fontSize: '20px', zIndex: 1 }}>👑</div>
              )}
              <div style={{ fontSize: '40px' }}>{currentPlayer?.avatar}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: colors.text, fontSize: '22px', fontWeight: 'bold' }}>{currentPlayer ? capitalize(currentPlayer.name) : ''}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <div style={{
              backgroundColor: (() => {
                const teamColors = [colors.primary, colors.secondary, colors.warning, colors.success, colors.danger];
                return teamColors[(currentTeam - 1) % teamColors.length];
              })(),
              padding: '4px 10px',
              borderRadius: '10px',
            }}>
              <div style={{ color: colors.text, fontSize: '12px', fontWeight: '600' }}>{gameMode === 'pairs' ? `Pareja ${currentTeam}` : `Equipo ${currentTeam}`}</div>
            </div>
                {currentPlayer && (
                  <div style={{ color: colors.textMuted, fontSize: '12px' }}>
                    ✓{getPlayerStats(currentPlayer.id).hits} ✗{getPlayerStats(currentPlayer.id).fails}
                  </div>
                )}
              </div>
            </div>
            <div style={{
              backgroundColor: timeLeft <= 10 ? colors.danger : colors.primary,
              width: '60px',
              height: '60px',
              borderRadius: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{ color: colors.text, fontSize: '20px', fontWeight: 'bold' }}>{timeLeft}s</div>
            </div>
          </div>
          
          <div style={{ backgroundColor: colors.surfaceLight, borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
            <div style={{ color: colors.textSecondary, fontSize: '13px' }}>Ronda {round} • {roundRules[round]}</div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 24px' }}>
          <div style={{ width: '100%' }}>
            <div
              className={`character-game-card ${cardAnimation}`}
              onMouseDown={() => setIsCardPressed(true)}
              onMouseUp={() => setIsCardPressed(false)}
              onMouseLeave={() => setIsCardPressed(false)}
              onTouchStart={() => setIsCardPressed(true)}
              onTouchEnd={() => setIsCardPressed(false)}
              data-flipped={isCardPressed}
            >
              <div className="card-face card-back">
                <div className="card-back-content">
                  <img src="/img/logo-personajes.png" alt="Personajes" className="card-logo" />
                  <div className="card-instruction">
                    MANTÉN PRESIONADO
                  </div>
                  <div className="card-instruction-subtitle">
                    para ver el personaje
                  </div>
                </div>
              </div>
              <div className="card-face card-front" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div className="character-name">
                  {displayCharacter?.toUpperCase() || 'SIN TARJETAS'}
                </div>
                {displayCharacter && usePresetCategory && (() => {
                  const charCategory = getCharacterCategory(displayCharacter);
                  return charCategory ? (
                    <div style={{ 
                      fontSize: '20px', 
                      color: '#ffffff', 
                      marginTop: '12px',
                      fontWeight: '500',
                      textTransform: 'none',
                      textAlign: 'center',
                      textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
                      fontFamily: "'Truculenta', sans-serif"
                    }}>
                      ({charCategory.name})
                    </div>
                  ) : null;
                })()}
              </div>
            </div>

            <div style={{ color: colors.textMuted, fontSize: '14px', marginTop: '16px', textAlign: 'center' }}>
              {roundCharacters.length} personajes restantes
            </div>
          </div>
        </div>

        <div style={{ padding: '0 16px 24px 16px' }}>
          {numTeams > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {Array.from({ length: numTeams }, (_, i) => i + 1).map((teamNum) => {
                const teamScore = getTotalScore(teamNum);
                const teamColors = [colors.primary, colors.secondary, colors.warning, colors.success, colors.danger];
                const teamColor = teamColors[(teamNum - 1) % teamColors.length];
                const isCurrent = currentTeam === teamNum;
                return (
                  <div key={teamNum} style={{
                    alignItems: 'center',
                    backgroundColor: colors.surface,
                    padding: '8px 20px',
                    borderRadius: '12px',
                    border: isCurrent ? `2px solid ${teamColor}` : 'none',
                  }}>
                    <div style={{ color: teamColor, fontSize: '12px', fontWeight: '600' }}>{gameMode === 'pairs' ? `P${teamNum}` : `E${teamNum}`}</div>
                    <div style={{ color: colors.text, fontSize: '24px', fontWeight: 'bold' }}>{teamScore}</div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
            <button
              onClick={handleFail}
              className={`action-button fail-button ${buttonAnimation.fail ? 'animate-pulse' : ''}`}
            >
              <div className="action-icon">✗</div>
              <div className="action-label">FALLO</div>
            </button>
            
            <button
              onClick={handleHit}
              className={`action-button success-button ${buttonAnimation.hit ? 'animate-pulse' : ''}`}
            >
              <div className="action-icon">✓</div>
              <div className="action-label">ACIERTO</div>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => {
                const newPausedState = !isPaused;
                setIsPaused(newPausedState);
                // Sonido de pausar/reanudar
                if (newPausedState) {
                  soundService.playPause();
                } else {
                  soundService.playResume();
                }
              }}
              style={{
                width: '100%',
                textAlign: 'center',
                padding: '8px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
              }}
            >
              <div style={{ color: colors.textMuted, fontSize: '14px' }}>{isPaused ? '▶ Reanudar' : '⏸ Pausar'}</div>
            </button>
            <button
              onClick={() => setShowExitModal(true)}
              style={{
                width: '100%',
                textAlign: 'center',
                padding: '8px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
              }}
            >
              <div style={{ color: colors.textMuted, fontSize: '14px' }}>🚪 Salir del Juego</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // FINISHED SCREEN
  if (gameState === 'finished') {
    const numTeams = getNumTeams();
    const rankedPlayers = getPlayerRanking();
    const mvpPlayer = rankedPlayers[0];
    const mvpStats = mvpPlayer ? getPlayerStats(mvpPlayer.id) : { hits: 0, fails: 0 };
    
    // Calcular puntuaciones de todos los equipos
    const teamScores = Array.from({ length: numTeams }, (_, i) => ({
      teamNum: i + 1,
      score: getTotalScore(i + 1),
    })).sort((a, b) => b.score - a.score);
    
    const maxScore = teamScores[0]?.score || 0;
    const winningTeams = teamScores.filter(t => t.score === maxScore);

    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'transparent', padding: '20px', paddingBottom: '32px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '56px', marginBottom: '8px', textAlign: 'center' }}>🏆</div>
            <h1 style={{ color: colors.text, fontSize: '26px', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>¡Juego Terminado!</h1>
            {numTeams > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {teamScores.map((teamScore, index) => {
                  const teamColors = [colors.primary, colors.secondary, colors.warning, colors.success, colors.danger];
                  const teamColor = teamColors[(teamScore.teamNum - 1) % teamColors.length];
                  const isWinner = winningTeams.some(t => t.teamNum === teamScore.teamNum) && maxScore > 0;
                  return (
                    <div key={teamScore.teamNum} style={{
                      alignItems: 'center',
                      padding: '12px',
                      borderRadius: '16px',
                      backgroundColor: colors.surface,
                      border: isWinner ? `2px solid ${colors.warning}` : 'none',
                    }}>
                      <div style={{ color: teamColor, fontSize: '12px', marginBottom: '4px' }}>{gameMode === 'pairs' ? `Pareja ${teamScore.teamNum}` : `Equipo ${teamScore.teamNum}`}</div>
                      <div style={{ color: colors.text, fontSize: '36px', fontWeight: 'bold' }}>{teamScore.score}</div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ color: colors.text, fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>
              {winningTeams.length === 1 && maxScore > 0 
                ? `🎉 ¡${gameMode === 'pairs' ? 'Pareja' : 'Equipo'} ${winningTeams[0].teamNum} Gana!`
                : winningTeams.length > 1 
                  ? '🤝 ¡Empate!'
                  : '🤝 ¡Juego Terminado!'
              }
            </div>
          </div>

          {mvpPlayer && mvpStats.hits > 0 && (
            <Card style={{ marginBottom: '12px', border: `2px solid ${colors.warning}` }}>
              <div style={{ color: colors.warning, fontSize: '14px', fontWeight: 'bold', textAlign: 'center', marginBottom: '12px' }}>⭐ MVP del Juego ⭐</div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ position: 'relative', marginRight: '12px' }}>
                  <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', fontSize: '20px', zIndex: 1 }}>👑</div>
                  <div style={{ fontSize: '48px' }}>{mvpPlayer.avatar}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: colors.text, fontSize: '20px', fontWeight: 'bold' }}>{capitalize(mvpPlayer.name)}</div>
                  <div style={{ color: colors.textMuted, fontSize: '13px', marginBottom: '6px' }}>Equipo {mvpPlayer.team}</div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ color: colors.success, fontSize: '16px', fontWeight: 'bold' }}>✓ {mvpStats.hits}</div>
                    <div style={{ color: colors.danger, fontSize: '16px', fontWeight: 'bold' }}>✗ {mvpStats.fails}</div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <Card style={{ marginBottom: '16px' }}>
            <h2 style={{ color: colors.text, fontSize: '15px', fontWeight: 'bold', marginBottom: '12px' }}>📊 Estadísticas de Jugadores</h2>
            {rankedPlayers.map((player, index) => {
              const stats = getPlayerStats(player.id);
              const isFirst = index === 0 && stats.hits > 0;
              return (
                <div
                  key={player.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: index < rankedPlayers.length - 1 ? `1px solid ${colors.border}` : 'none',
                    backgroundColor: isFirst ? colors.surfaceLight : 'transparent',
                    margin: isFirst ? '0 -16px' : '0',
                    paddingLeft: isFirst ? '16px' : '0',
                    paddingRight: isFirst ? '16px' : '0',
                    borderRadius: isFirst ? '8px' : '0',
                  }}
                >
                  <div style={{ color: colors.textMuted, fontSize: '13px', fontWeight: 'bold', width: '28px' }}>#{index + 1}</div>
                  <div style={{ fontSize: '24px', marginRight: '10px' }}>{player.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ color: colors.text, fontSize: '15px', fontWeight: '600' }}>{capitalize(player.name)}</div>
                      {isFirst && <div style={{ fontSize: '12px' }}>👑</div>}
                    </div>
                    <div style={{ color: colors.textMuted, fontSize: '11px' }}>Equipo {player.team}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ color: colors.success, fontSize: '13px', fontWeight: 'bold' }}>✓ {stats.hits}</div>
                    <div style={{ color: colors.danger, fontSize: '13px', fontWeight: 'bold' }}>✗ {stats.fails}</div>
                  </div>
                </div>
              );
            })}
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Button title="🔄 Jugar Otra Vez (mismos jugadores)" onClick={playAgain} size="large" />
            <Button title="Nueva Partida" onClick={resetGame} variant="outline" size="large" />
            <Button title="Volver al Menú" onClick={() => navigate('/dashboard')} variant="secondary" size="large" silent />
          </div>
        </div>
      </div>
    );
  }

  // RECONFIG SCREEN
  if (gameState === 'reconfig') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'transparent', padding: '24px', paddingBottom: '40px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '28px' }}>🔄</span>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: colors.text, margin: 0 }}>Reconfigurar Partida</h1>
            </div>
          </div>

          <Card style={{ marginBottom: '16px', backgroundColor: colors.success + '15', border: `2px solid ${colors.success}` }}>
            <div style={{ color: colors.success, fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>✅ Jugadores Conservados</div>
            <div style={{ color: colors.text, fontSize: '14px', marginBottom: '12px' }}>
              Se mantendrán los {players.length} jugadores actuales
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {players.map((p) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', backgroundColor: colors.surface, padding: '6px 12px', borderRadius: '20px', gap: '6px' }}>
                  <div style={{ fontSize: '20px' }}>{p.avatar}</div>
                  <div style={{ color: colors.text, fontSize: '13px', fontWeight: '500' }}>{capitalize(p.name)}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: colors.text, marginBottom: '16px' }}>Cambiar Configuración</h2>
            
            <Input
              label="Personajes por jugador"
              value={charactersPerPlayer}
              onChange={(val) => handleNumericInput(val, setCharactersPerPlayer)}
              placeholder="2"
            />
            <p style={{ color: colors.textMuted, fontSize: '12px', marginTop: '-8px', marginBottom: '16px' }}>
              Total de personajes: {players.length * (parseInt(charactersPerPlayer) || 2)} ({charactersPerPlayer} por jugador × {players.length} jugadores)
            </p>

            <label style={{ color: colors.textSecondary, fontSize: '14px', fontWeight: '500', marginBottom: '8px', marginTop: '8px', display: 'block' }}>
              Categoría de personajes
            </label>
            <div style={{ display: 'flex', backgroundColor: colors.surfaceLight, borderRadius: '12px', padding: '4px', marginBottom: '16px' }}>
              <button
                onClick={() => {
                  setUsePresetCategory(false);
                  setSelectedCategories([]);
                  setUseAllCategories(false);
                  setMaxCharacters('');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: !usePresetCategory ? colors.primary : 'transparent',
                  color: !usePresetCategory ? colors.text : colors.textMuted,
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Manual
              </button>
              <button
                onClick={() => setUsePresetCategory(true)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: usePresetCategory ? colors.primary : 'transparent',
                  color: usePresetCategory ? colors.text : colors.textMuted,
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Predefinida
              </button>
            </div>

            {!usePresetCategory ? (
              <>
                <Input
                  label="Categoría (opcional)"
                  value={category}
                  onChange={setCategory}
                  placeholder="Ej: Películas, Famosos, Anime..."
                />
                {category && (
                  <p style={{ color: colors.primary, fontSize: '13px', marginTop: '4px', marginBottom: '8px', fontStyle: 'italic' }}>
                    Los jugadores agregarán personajes de: {category}
                  </p>
                )}
              </>
            ) : (
              <div style={{ marginTop: '8px' }}>
                <p style={{ color: colors.textSecondary, fontSize: '12px', marginBottom: '8px' }}>Selecciona una o más categorías:</p>
                
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
                
                {!useAllCategories && (
                  <>
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
                <div className="categories-grid">
                  {filteredCategories.map((cat) => {
                    const isSelected = selectedCategories.includes(cat.id);
                    return (
                      <div
                        key={cat.id}
                        onClick={() => toggleCategory(cat.id)}
                        className={`category-card ${isSelected ? 'selected' : ''}`}
                        style={{ cursor: 'pointer', position: 'relative' }}
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
                          fontSize: '12px',
                          color: colors.text
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
                  )}
                </>
                )}
                {(useAllCategories || selectedCategories.length > 0) && (
                  <div style={{ backgroundColor: colors.primary + '15', borderRadius: '12px', padding: '12px', borderLeft: `4px solid ${colors.primary}`, marginTop: '12px' }}>
                    {!useAllCategories && (
                      <>
                    <div style={{ color: colors.text, fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                      📚 Categorías Seleccionadas ({selectedCategories.length})
                    </div>
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
                        <div style={{ color: colors.success, fontSize: '12px', fontWeight: '500', marginBottom: '12px' }}>
                          ✅ {totalChars} personajes disponibles en total
                        </div>
                      );
                    })()}
                    
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${colors.border}` }}>
                      <Input
                        label="Límite de personajes (opcional)"
                        value={maxCharacters}
                        onChange={setMaxCharacters}
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
                          : `Se usarán ${players.length * parseInt(charactersPerPlayer)} personajes (calculado automáticamente: ${players.length} jugadores × ${charactersPerPlayer} por jugador)`
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <Button
              title="Continuar"
              onClick={handleReconfigSubmit}
              size="large"
              style={{ width: '100%', marginTop: '16px' }}
              disabled={usePresetCategory && !useAllCategories && selectedCategories.length === 0}
            />
          </Card>
        </div>
      </div>
    );
  }

  // NEW CHARACTERS SCREEN
  if (gameState === 'new_characters') {
    const currentPlayer = players[currentPlayerForChars];
    const charsPerPlayer = parseInt(charactersPerPlayer) || 2;
    
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'transparent', padding: '24px', paddingBottom: '40px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: colors.text, margin: 0 }}>Nuevos Personajes</h1>
            <div style={{ color: colors.textMuted, fontSize: '14px' }}>
              {currentPlayerForChars + 1} / {players.length}
            </div>
          </div>

          {category && (
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: colors.primary, borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
              {usePresetCategory && selectedCategories.length > 0 && (() => {
                const firstCat = categories.find(c => c.id === selectedCategories[0]);
                return firstCat ? (
                  <span style={{ fontSize: '28px', marginRight: '12px' }}>
                    {firstCat.icon}
                  </span>
                ) : null;
              })()}
              <div style={{ flex: 1 }}>
                <div style={{ color: colors.text, fontSize: '10px', fontWeight: '600', letterSpacing: '1px', opacity: 0.8 }}>CATEGORÍA</div>
                <div style={{ color: colors.text, fontSize: '18px', fontWeight: 'bold' }}>{category}</div>
              </div>
            </div>
          )}

          <Card style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: `1px solid ${colors.border}` }}>
              <div style={{ fontSize: '48px', marginRight: '16px' }}>{currentPlayer?.avatar}</div>
              <div>
                <div style={{ color: colors.text, fontSize: '22px', fontWeight: 'bold' }}>{currentPlayer ? capitalize(currentPlayer.name) : ''}</div>
                <div style={{ color: colors.primary, fontSize: '14px', marginTop: '2px' }}>
                  {gameMode === 'pairs' ? `Pareja ${currentPlayer?.team}` : `Equipo ${currentPlayer?.team}`}
                </div>
              </div>
            </div>

            <div style={{ color: colors.textSecondary, fontSize: '14px', marginBottom: '12px' }}>
              Ingresa {charsPerPlayer} personajes nuevos:
            </div>
            
            {Array(charsPerPlayer).fill(0).map((_, index) => (
              <Input
                key={index}
                placeholder={`Personaje ${index + 1}`}
                value={newPlayerCharacters[index] || ''}
                onChange={(value) => handleNewCharacterChange(index, value)}
              />
            ))}

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
              <Button
                title={currentPlayerForChars < players.length - 1 ? "Siguiente Jugador →" : "¡Comenzar Juego!"}
                onClick={confirmNewCharacters}
                size="large"
              />
            </div>
          </Card>

          <div style={{ marginTop: '8px', marginBottom: '40px' }}>
            <div style={{ color: colors.textMuted, fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Jugadores:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {players.map((player, index) => (
                <div
                  key={player.id}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '22px',
                    backgroundColor: index < currentPlayerForChars ? colors.success : colors.surfaceLight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    opacity: index < currentPlayerForChars ? 0.8 : 1,
                    border: index === currentPlayerForChars ? `3px solid ${colors.primary}` : 'none',
                  }}
                >
                  <div style={{ fontSize: '24px' }}>{player.avatar}</div>
                  {index < currentPlayerForChars && (
                    <div style={{
                      position: 'absolute',
                      bottom: '-2px',
                      right: '-2px',
                      backgroundColor: colors.success,
                      color: colors.text,
                      fontSize: '10px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>✓</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default LocalGame;
