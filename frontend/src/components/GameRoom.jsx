import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { soundService } from '../services/sound';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card, Modal, LoadingDots, AvatarSelector } from './index';
import { AVATARS } from './AvatarSelector';
import { colors } from '../theme';
import './GameRoom.css';

function GameRoom() {
  const { roomCode } = useParams();
  const { user, fetchUser } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playerCharacters, setPlayerCharacters] = useState(['', '']);
  const [submittingCharacters, setSubmittingCharacters] = useState(false);
  const timerRef = useRef(null);
  const [cardScale, setCardScale] = useState(1);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isCardPressed, setIsCardPressed] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [submittingAvatar, setSubmittingAvatar] = useState(false);
  const timeUpHandledRef = useRef(false);
  const [cardAnimation, setCardAnimation] = useState('');
  const [buttonAnimation, setButtonAnimation] = useState({ hit: false, fail: false });
  const prevCardPressedRef = useRef(false);

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

  useEffect(() => {
    if (roomCode) {
      // Primero intentar obtener el juego
      fetchGame();
      connectSocket();
      // Pre-cargar sonidos
      soundService.preloadAll();
    }
    return () => {
      socketService.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [roomCode]);

  useEffect(() => {
    if (game?.charactersPerPlayer) {
      const charsPerPlayer = game.charactersPerPlayer || 2;
      if (playerCharacters.length !== charsPerPlayer) {
        setPlayerCharacters(Array(charsPerPlayer).fill(''));
      }
    }
  }, [game?.charactersPerPlayer]);

  // Función helper para obtener el tiempo actual
  // Cuando el juego está corriendo, usa el timer local (se actualiza cada segundo)
  // Cuando está pausado o en intro, usa el tiempo del servidor (fuente de verdad)
  const getCurrentTimeLeft = () => {
    const isPaused = game?.timer?.isPaused || game?.waitingForPlayer || game?.showingRoundIntro || game?.showingRoundIntroMidTurn;
    
    // Si está pausado o en intro, usar el tiempo del servidor (fuente de verdad)
    if (isPaused && game?.timer && game.timer.timeLeft !== undefined && game.timer.timeLeft !== null) {
      return game.timer.timeLeft;
    }
    
    // Si está corriendo, usar el timer local que se actualiza cada segundo
    return timeLeft;
  };

  // Ref para rastrear el estado previo de showingRoundIntroMidTurn
  const prevShowingRoundIntroMidTurnRef = useRef(false);

  // Efecto principal: Controlar el timer local basado en el estado del juego
  // Este efecto se ejecuta cuando cambia el estado del juego (playing/paused/intro)
  useEffect(() => {
    if (!game) {
      return;
    }

    const isPlaying = game.status === 'playing';
    const isPaused = game.timer?.isPaused || game.waitingForPlayer || game.showingRoundIntro || game.showingRoundIntroMidTurn;
    const shouldRunTimer = isPlaying && !isPaused;
    const wasShowingIntroMidTurn = prevShowingRoundIntroMidTurnRef.current;
    const justExitedIntroMidTurn = wasShowingIntroMidTurn && !game.showingRoundIntroMidTurn;

    // Actualizar el ref con el estado actual
    prevShowingRoundIntroMidTurnRef.current = game.showingRoundIntroMidTurn || false;

    // Resetear el flag de timeUp cuando cambia el turno o el estado del juego
    timeUpHandledRef.current = false;

    if (shouldRunTimer) {
      // El juego está corriendo: inicializar timer local con tiempo del servidor y empezar
      // IMPORTANTE: Cuando se reanuda después de intro mid-turn, el servidor tiene el tiempo preservado
      // Necesitamos sincronizar el timer local con ese tiempo preservado
      if (!timerRef.current || justExitedIntroMidTurn) {
        // Si acabamos de salir de la intro mid-turn, siempre sincronizar el tiempo preservado
        // Esto asegura que el tiempo preservado se use correctamente
        if (game.timer && game.timer.timeLeft !== undefined && game.timer.timeLeft !== null) {
          setTimeLeft(game.timer.timeLeft);
        }
        if (!timerRef.current) {
          startTimer();
        }
      }
    } else {
      // El juego está pausado o no está jugando: detener timer y sincronizar con servidor
      stopTimer();
      if (isPaused && game.timer && game.timer.timeLeft !== undefined && game.timer.timeLeft !== null) {
        setTimeLeft(game.timer.timeLeft);
      }
    }

    return () => {
      // Cleanup: solo detener si el efecto se desmonta o cambia el estado
      if (!shouldRunTimer) {
        stopTimer();
      }
    };
  }, [game?.status, game?.timer?.isPaused, game?.waitingForPlayer, game?.showingRoundIntro, game?.showingRoundIntroMidTurn, game?.currentTeam, game?.currentPlayerIndex, game?.timer?.timeLeft]);

  const connectSocket = () => {
    socketService.connect();
    if (roomCode) socketService.joinGame(roomCode);
    socketService.onGameUpdated(() => fetchGame());
    // Escuchar evento de cancelación de partida
    socketService.onGameCancelled((data) => {
      // Redirigir inmediatamente al dashboard cuando se cancela la partida
      socketService.leaveGame(roomCode);
      socketService.disconnect();
      navigate('/dashboard');
    });
  };

  const joinGame = async (characters = null, avatar = null) => {
    try {
      const response = await api.joinGame(roomCode, characters || undefined, avatar || undefined);
      setGame(response.game);
      setTimeLeft(response.game.timer?.timeLeft || response.game.timePerRound);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al unirse');
      setLoading(false);
    }
  };

  const handleSubmitAvatar = async () => {
    if (!selectedAvatar) {
      setError('Selecciona un avatar');
      return;
    }
    setSubmittingAvatar(true);
    setError('');
    try {
      const response = await api.joinGame(roomCode, null, selectedAvatar);
      setGame(response.game);
      socketService.emitGameUpdate(roomCode);
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    } finally {
      setSubmittingAvatar(false);
    }
  };

  const handleCancelGame = async () => {
    try {
      await api.cancelGame(roomCode);
      socketService.emitGameUpdate(roomCode);
      socketService.leaveGame(roomCode);
      socketService.disconnect();
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cancelar la partida');
      setShowCancelModal(false);
    }
  };

  const handleLeaveGame = async () => {
    try {
      await api.leaveGame(roomCode);
      socketService.emitGameUpdate(roomCode);
      socketService.leaveGame(roomCode);
      socketService.disconnect();
      navigate('/dashboard');
    } catch (err) {
      // Si hay cualquier error (400, 404, etc.), permitir salir de todas formas
      // Esto evita que el usuario quede atrapado en la pantalla
      console.warn('Error al salirse de la partida, pero permitiendo salir:', err.response?.data?.message || err.message);
      socketService.leaveGame(roomCode);
      socketService.disconnect();
      navigate('/dashboard');
    }
  };

  const handleExit = async () => {
    try {
      if (!game) {
        socketService.leaveGame(roomCode);
        socketService.disconnect();
        navigate('/dashboard');
        return;
      }

      const gameHostId = typeof game.host === 'object' ? (game.host.id || game.host._id) : game.host;
      const userIsHost = gameHostId === user?.id;

      // Si es el anfitrión y el juego está en waiting, intentar cancelar
      if (game.status === 'waiting' && userIsHost) {
        try {
          await api.cancelGame(roomCode);
        } catch (cancelErr) {
          // Si falla cancelar, intentar salirse de todas formas
          console.warn('Error al cancelar, intentando salirse:', cancelErr.response?.data?.message);
          try {
            await api.leaveGame(roomCode);
          } catch (leaveErr) {
            // Si también falla, salir de todas formas
            console.warn('Error al salirse, pero permitiendo salir:', leaveErr.response?.data?.message);
          }
        }
      } else {
        // Si no es anfitrión o el juego ya empezó, salirse
        try {
          await api.leaveGame(roomCode);
        } catch (leaveErr) {
          // Si falla, permitir salir de todas formas
          console.warn('Error al salirse, pero permitiendo salir:', leaveErr.response?.data?.message);
        }
      }
      socketService.emitGameUpdate(roomCode);
      socketService.leaveGame(roomCode);
      socketService.disconnect();
      navigate('/dashboard');
    } catch (err) {
      // Cualquier error: permitir salir de todas formas
      console.warn('Error al salir del juego, pero permitiendo salir:', err.response?.data?.message || err.message);
      socketService.leaveGame(roomCode);
      socketService.disconnect();
      navigate('/dashboard');
    }
  };

  const fetchGame = async () => {
    try {
      const response = await api.getGame(roomCode);
      const previousStatus = game?.status;
      setGame(response.game);
      setLoading(false);
      // Sincronizar tiempo solo cuando está pausado o en intro
      // Cuando está corriendo, NO tocar el timer local (el efecto principal lo maneja)
      if (response.game.timer && response.game.timer.timeLeft !== undefined && response.game.timer.timeLeft !== null) {
        const isPaused = response.game.timer.isPaused || response.game.waitingForPlayer || response.game.showingRoundIntro || response.game.showingRoundIntroMidTurn;
        if (isPaused) {
          // Solo sincronizar cuando está pausado para evitar resetear el timer local cuando está corriendo
          setTimeLeft(response.game.timer.timeLeft);
        }
      }
      
      // Si el juego terminó y antes no estaba terminado, actualizar estadísticas del usuario
      if (response.game.status === 'finished' && previousStatus !== 'finished') {
        // Sonido de fin de juego
        soundService.playGameEnd();
        // Refrescar datos del usuario para obtener estadísticas actualizadas
        if (fetchUser) {
          fetchUser();
        }
      }
    } catch (err) {
      console.error('Error fetching game:', err);
      // Si el juego no existe (404), redirigir inmediatamente al dashboard
      // Esto puede pasar si el anfitrión canceló la partida o si alguien se salió
      if (err.response?.status === 404) {
        socketService.leaveGame(roomCode);
        socketService.disconnect();
        navigate('/dashboard');
        return;
      }
      setLoading(false);
    }
  };

  const handleTimeUp = async () => {
    // Cuando el tiempo se acaba, terminar el turno automáticamente (equivalente a un fallo)
    // Solo procesar si el juego está corriendo y es el turno del jugador actual
    if (!game || game.status !== 'playing' || game.timer?.isPaused || game.waitingForPlayer || game.showingRoundIntro || game.showingRoundIntroMidTurn) {
      return;
    }

    // Sonido de tiempo agotado
    soundService.playTimeUp();

    // Verificar que es el turno del jugador actual
    const currentTeamPlayers = game.players?.filter(p => p.team === game.currentTeam) || [];
    const currentPlayerIndex = game.currentPlayerIndex || 0;
    const activePlayer = currentTeamPlayers.length > 0 ? currentTeamPlayers[currentPlayerIndex % currentTeamPlayers.length] : null;
    if (!activePlayer) return;

    const activePlayerId = typeof activePlayer.user === 'object' ? (activePlayer.user.id || activePlayer.user._id) : activePlayer.user;
    if (activePlayerId !== user?.id) {
      // No es el turno del usuario actual, no hacer nada
      return;
    }

    stopTimer();
    try {
      const response = await api.failCharacter(roomCode);
      setGame(response.game);
      socketService.emitGameUpdate(roomCode);
    } catch (err) {
      console.error('Error al terminar turno por tiempo:', err);
      setError(err.response?.data?.message || 'Error al terminar turno');
    }
  };

  // Efecto para detectar cuando el tiempo llega a 0 y terminar el turno automáticamente
  useEffect(() => {
    if (timeLeft === 0 && game && game.status === 'playing' && !game.timer?.isPaused && !game.waitingForPlayer && !game.showingRoundIntro && !game.showingRoundIntroMidTurn && !timeUpHandledRef.current) {
      // Verificar que es el turno del jugador actual antes de terminar
      const currentTeamPlayers = game.players?.filter(p => p.team === game.currentTeam) || [];
      const currentPlayerIndex = game.currentPlayerIndex || 0;
      const activePlayer = currentTeamPlayers.length > 0 ? currentTeamPlayers[currentPlayerIndex % currentTeamPlayers.length] : null;
      
      if (activePlayer) {
        const activePlayerId = typeof activePlayer.user === 'object' ? (activePlayer.user.id || activePlayer.user._id) : activePlayer.user;
        if (activePlayerId === user?.id) {
          // Es el turno del usuario actual, terminar automáticamente
          timeUpHandledRef.current = true;
          handleTimeUp();
        }
      }
    } else if (timeLeft > 0) {
      // Resetear el flag cuando el tiempo no es 0
      timeUpHandledRef.current = false;
    }
  }, [timeLeft, game?.status, game?.timer?.isPaused, game?.waitingForPlayer, game?.showingRoundIntro, game?.showingRoundIntroMidTurn, game?.currentTeam, game?.currentPlayerIndex, user?.id]);

  // Efecto para reproducir tick del timer cuando queden exactamente 10 segundos
  const prevTimeLeftRef = useRef(null);
  useEffect(() => {
    if (game && game.status === 'playing' && !game.timer?.isPaused && !game.waitingForPlayer && !game.showingRoundIntro && !game.showingRoundIntroMidTurn) {
      const currentTimeLeft = getCurrentTimeLeft();
      // Reproducir solo cuando cambia de 11 a 10 segundos (para evitar múltiples reproducciones)
      if (currentTimeLeft === 10 && prevTimeLeftRef.current !== 10) {
        soundService.playTick();
      }
      prevTimeLeftRef.current = currentTimeLeft;
    }
  }, [timeLeft, game?.status, game?.timer?.isPaused, game?.waitingForPlayer, game?.showingRoundIntro, game?.showingRoundIntroMidTurn]);

  // Efecto para reproducir sonido al voltear la tarjeta
  useEffect(() => {
    if (isCardPressed && !prevCardPressedRef.current) {
      // La tarjeta acaba de ser presionada (cambio de false a true)
      soundService.playCardFlip();
    }
    prevCardPressedRef.current = isCardPressed;
  }, [isCardPressed]);

  const startTimer = () => {
    stopTimer();
    // El timer local se inicializa en el useEffect que controla cuando empieza a correr
    // Aquí solo iniciamos el intervalo que decrementa el tiempo cada segundo
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleCharacterChange = (index, value) => {
    const newChars = [...playerCharacters];
    newChars[index] = value;
    setPlayerCharacters(newChars);
  };

  const handleSubmitCharacters = async () => {
    const charsPerPlayer = game?.charactersPerPlayer || 2;
    const trimmedChars = playerCharacters.map((c) => c.trim()).filter((c) => c);
    if (trimmedChars.length !== charsPerPlayer) {
      setError(`Debes ingresar ${charsPerPlayer} personajes`);
      return;
    }
    const uniqueChars = [...new Set(trimmedChars)];
    if (uniqueChars.length !== trimmedChars.length) {
      setError('Los personajes deben ser diferentes');
      return;
    }
    setSubmittingCharacters(true);
    setError('');
    try {
      await joinGame(trimmedChars);
      socketService.emitGameUpdate(roomCode);
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    } finally {
      setSubmittingCharacters(false);
    }
  };

  const animateCard = () => {
    setCardScale(0.95);
    setTimeout(() => setCardScale(1), 150);
  };

  const handleHit = async () => {
    setIsCardPressed(false);
    
    // Sonido de acierto
    soundService.playHit();
    
    // Animación del botón
    setButtonAnimation(prev => ({ ...prev, hit: true }));
    setTimeout(() => setButtonAnimation(prev => ({ ...prev, hit: false })), 300);
    
    // Animación de la tarjeta (slide out)
    setCardAnimation('slide-out-right');
    
    // Después de la animación, actualizar el juego
    setTimeout(async () => {
      try {
        // Enviar el tiempo actual al backend para que lo preserve correctamente
        const currentTime = getCurrentTimeLeft();
        const response = await api.hitCharacter(roomCode, currentTime);
        setGame(response.game);
        socketService.emitGameUpdate(roomCode);
        
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
      } catch (err) {
        console.error('[handleHit] Error:', err);
        setError(err.response?.data?.message || 'Error');
        setCardAnimation(''); // Resetear animación en caso de error
      }
    }, 300);
  };

  const handleFail = async () => {
    setIsCardPressed(false);
    
    // Sonido de fallo
    soundService.playFail();
    
    // Animación del botón
    setButtonAnimation(prev => ({ ...prev, fail: true }));
    setTimeout(() => setButtonAnimation(prev => ({ ...prev, fail: false })), 300);
    
    try {
      const response = await api.failCharacter(roomCode);
      setGame(response.game);
      socketService.emitGameUpdate(roomCode);
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    }
  };

  const handlePlayerReady = async () => {
    try {
      const response = await api.playerReady(roomCode);
      setGame(response.game);
      // Usar el tiempo del servidor (puede ser timePerRound o tiempo preservado)
      if (response.game.timer && response.game.timer.timeLeft !== undefined && response.game.timer.timeLeft !== null) {
        setTimeLeft(response.game.timer.timeLeft);
      } else {
        setTimeLeft(response.game.timePerRound);
      }
      socketService.emitGameUpdate(roomCode);
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    }
  };

  const handleRoundIntroSeen = async () => {
    try {
      const response = await api.roundIntroSeen(roomCode);
      setGame(response.game);
      // Preservar el tiempo del servidor (especialmente importante para intro mid-turn)
      // El backend preserva el tiempo cuando es intro mid-turn
      if (response.game.timer && response.game.timer.timeLeft !== undefined && response.game.timer.timeLeft !== null) {
        setTimeLeft(response.game.timer.timeLeft);
      }
      // No reproducir sonido aquí, solo cuando realmente comience la ronda
      socketService.emitGameUpdate(roomCode);
    } catch (err) {
      console.error('[handleRoundIntroSeen] Error:', err);
      setError(err.response?.data?.message || 'Error');
    }
  };

  const handleStart = async () => {
    try {
      const response = await api.startGame(roomCode);
      setGame(response.game);
      // Usar el tiempo del servidor (puede ser timePerRound o tiempo preservado)
      if (response.game.timer && response.game.timer.timeLeft !== undefined && response.game.timer.timeLeft !== null) {
        setTimeLeft(response.game.timer.timeLeft);
      } else {
        setTimeLeft(response.game.timePerRound);
      }
      // Sonido de inicio de juego
      soundService.playGameStart();
      socketService.emitGameUpdate(roomCode);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar');
    }
  };

  const togglePause = async () => {
    try {
      // Preservar el tiempo actual al pausar/reanudar usando la función helper
      const currentTimeLeft = getCurrentTimeLeft();
      const willPause = !game?.timer?.isPaused;
      await api.updateTimer(roomCode, willPause, currentTimeLeft);
      // Sonido de pausar/reanudar
      if (willPause) {
        soundService.playPause();
      } else {
        soundService.playResume();
      }
      socketService.emitGameUpdate(roomCode);
      fetchGame();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const shareRoomCode = async () => {
    const gameUrl = `https://personajes.vercel.app/game/${roomCode}`;
    const shareText = `Únete a mi partida de Personajes con este código\n${gameUrl}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Únete a mi partida',
          text: shareText,
        });
      } catch (err) {}
    } else {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(shareText);
      alert(`Código y link copiados:\nÚnete a mi partida de Personajes con este código\n${gameUrl}`);
    }
  };

  // Helpers para estadísticas y MVP
  const getPlayerStats = (playerId) => {
    return game?.playerStats?.[playerId] || { hits: 0, fails: 0 };
  };

  const getMVP = () => {
    if (!game?.playerStats) return null;
    let maxHits = 0;
    let mvpId = null;
    Object.entries(game.playerStats).forEach(([id, stats]) => {
      if (stats.hits > maxHits) {
        maxHits = stats.hits;
        mvpId = id;
      }
    });
    return mvpId;
  };

  const isPlayerMVP = (playerId) => {
    const mvpId = getMVP();
    if (!mvpId) return false;
    const mvpStats = getPlayerStats(mvpId);
    if (mvpStats.hits === 0) return false;
    return playerId === mvpId;
  };

  const getPlayerRanking = () => {
    if (!game?.players) return [];
    return [...game.players].sort((a, b) => {
      const userIdA = typeof a.user === 'object' ? a.user.id : a.user;
      const userIdB = typeof b.user === 'object' ? b.user.id : b.user;
      const statsA = getPlayerStats(userIdA);
      const statsB = getPlayerStats(userIdB);
      return statsB.hits - statsA.hits;
    });
  };

  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  if (loading) {
    return (
      <div className="loading">
        <div style={{ textAlign: 'center', color: colors.textMuted }}>
          Cargando partida...
        </div>
      </div>
    );
  }

  if (error && !game) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: 'transparent' }}>
        <Card style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <h2 style={{ color: colors.danger, fontSize: '18px', marginBottom: '16px' }}>{error}</h2>
          <Button title="Volver" onClick={() => navigate('/dashboard')} silent />
        </Card>
      </div>
    );
  }

  if (!game) return null;

  const isHost = (typeof game.host === 'object' ? (game.host.id || game.host._id) : game.host) === user?.id;
  const currentPlayer = game.players.find((p) => {
    if (typeof p.user === 'object') {
      return (p.user.id || p.user._id) === user?.id;
    }
    return p.user === user?.id;
  });
  const currentPlayerId = currentPlayer ? (typeof currentPlayer.user === 'object' ? (currentPlayer.user.id || currentPlayer.user._id) : currentPlayer.user) : null;
  const isCurrentTeam = currentPlayer && currentPlayer.team === game.currentTeam;
  
  // Determinar si el usuario actual es el jugador activo (no solo del equipo, sino el específico que está de turno)
  const getCurrentActivePlayer = () => {
    if (!game || !game.players || game.players.length === 0) return null;
    
    // Obtener jugadores del equipo actual
    const currentTeamPlayers = game.players.filter(p => p.team === game.currentTeam);
    if (currentTeamPlayers.length === 0) return null;
    
    // Obtener el índice del jugador actual usando currentPlayerIndex
    const playerIndex = game.currentPlayerIndex || 0;
    const activePlayer = currentTeamPlayers[playerIndex % currentTeamPlayers.length];
    
    return activePlayer;
  };
  
  const activePlayer = getCurrentActivePlayer();
  const activePlayerId = activePlayer ? (typeof activePlayer.user === 'object' ? (activePlayer.user.id || activePlayer.user._id) : activePlayer.user) : null;
  const isCurrentActivePlayer = currentPlayerId && activePlayerId && currentPlayerId === activePlayerId;
  const team1Score = game.roundScores.round1.team1 + game.roundScores.round2.team1 + game.roundScores.round3.team1;
  const team2Score = game.roundScores.round1.team2 + game.roundScores.round2.team2 + game.roundScores.round3.team2;
  const playerCharactersData = game.playerCharacters || {};
  const usesCategory = game.usesCategory || game.charactersPerPlayer === 0;
  // Verificar si el usuario tiene personajes guardados
  const userCharacters = currentPlayerId ? (playerCharactersData[currentPlayerId] || []) : [];
  const hasSubmittedCharacters = usesCategory || (currentPlayer && Array.isArray(userCharacters) && userCharacters.length > 0);
  const needsToSubmitCharacters = !usesCategory && currentPlayer && currentPlayerId && !hasSubmittedCharacters && game.status === 'waiting';
  const charsPerPlayer = game.charactersPerPlayer || 2;
  const totalCharactersNeeded = usesCategory ? 0 : (game.numPlayers || 4) * charsPerPlayer;
  const myCharacters = currentPlayerId ? playerCharactersData[currentPlayerId] || [] : [];
  // Obtener información de categoría(es)
  const categoryInfo = game.category; // Legacy: una sola categoría
  const categoriesInfo = game.categories; // Array de categorías (múltiples)
  
  // Si hay múltiples categorías pero no categoryInfo, crear uno "Variados"
  const displayCategoryInfo = categoryInfo || (categoriesInfo && categoriesInfo.length > 1 ? {
    name: 'Variados',
    icon: '🎲'
  } : null);
  const playerAvatars = (game && game.playerAvatars) ? game.playerAvatars : {};
  const myAvatar = currentPlayerId && playerAvatars ? playerAvatars[currentPlayerId] : null;
  const needsToSelectAvatar = currentPlayer && !myAvatar && game.status === 'waiting';

  // Personajes disponibles
  const roundCharacters = game.roundCharacters || [];
  const blockedCharacters = game.blockedCharacters || [];
  const availableCharacters = roundCharacters.filter(c => !blockedCharacters.includes(c));
  const currentCharacter = availableCharacters.length > 0
    ? availableCharacters[game.currentCharacterIndex % availableCharacters.length]
    : null;

  // ROUND INTRO MID-TURN SCREEN (cambio de ronda en medio del turno, preserva tiempo)
  // Mostrar a todos los jugadores, pero solo el jugador del equipo actual puede confirmar
  if (game.status === 'playing' && game.showingRoundIntroMidTurn) {
    const roundInfo = roundDetails[game.currentRound];
    // Usar siempre el tiempo del servidor como fuente de verdad
    // El backend preserva el tiempo cuando cambia de ronda en medio del turno
    // Priorizar game.timer.timeLeft, luego timeLeft local, y finalmente 60 como fallback
    const actualTimeLeft = (game.timer && game.timer.timeLeft !== undefined && game.timer.timeLeft !== null) 
      ? game.timer.timeLeft 
      : (timeLeft !== undefined && timeLeft !== null ? timeLeft : 60);
    
    const canConfirm = isCurrentActivePlayer && currentPlayer; // Solo el jugador activo puede confirmar
    
    // Encontrar el jugador que está jugando actualmente (del equipo actual)
    const currentTeamPlayers = game.players.filter(p => p.team === game.currentTeam);
    const currentPlayerIndex = game.currentPlayerIndex || 0;
    const activePlayer = currentTeamPlayers.length > 0 ? currentTeamPlayers[currentPlayerIndex % currentTeamPlayers.length] : null;

    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'transparent', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px' }}>
        <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}>
          <Button
            title="Salir"
            onClick={() => {
              if (isHost) {
                setShowCancelModal(true);
              } else {
                setShowLeaveModal(true);
              }
            }}
            variant="secondary"
            size="small"
          />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: colors.warning, padding: '8px 18px', borderRadius: '20px', marginBottom: '12px' }}>
            <div style={{ color: colors.text, fontSize: '16px', fontWeight: 'bold' }}>⏱️ {actualTimeLeft}s restantes</div>
          </div>

          <div style={{ backgroundColor: colors.warning, padding: '6px 20px', borderRadius: '20px', marginBottom: '16px' }}>
            <div style={{ color: colors.text, fontSize: '14px', fontWeight: 'bold', letterSpacing: '2px' }}>¡NUEVA RONDA!</div>
          </div>

          <div style={{ fontSize: '64px', marginBottom: '12px' }}>{roundInfo.icon}</div>
          <h1 style={{ color: colors.text, fontSize: '32px', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '2px', textTransform: 'uppercase' }}>
            RONDA {game.currentRound}: {roundInfo.title}
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: '16px', textAlign: 'center', marginBottom: '20px', lineHeight: '22px', maxWidth: '600px' }}>
            {roundInfo.description}
          </p>

          <Card style={{ width: '100%', maxWidth: '600px', marginBottom: '16px' }}>
            {roundInfo.tips.map((tip, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: index < roundInfo.tips.length - 1 ? '8px' : '0' }}>
                <span style={{ color: colors.primary, fontSize: '16px', fontWeight: 'bold', marginRight: '10px' }}>•</span>
                <p style={{ color: colors.text, fontSize: '14px', flex: 1, lineHeight: '20px', margin: 0 }}>{tip}</p>
              </div>
            ))}
          </Card>

          {activePlayer && (
            <div style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '16px', width: '100%', maxWidth: '600px', alignItems: 'center', marginTop: '12px', marginBottom: '20px' }}>
              <div style={{ color: colors.textMuted, fontSize: '13px', marginBottom: '6px', textTransform: 'uppercase' }}>
                {canConfirm ? 'Sigues jugando:' : 'Jugando ahora:'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                {(() => {
                  const playerId = typeof activePlayer.user === 'object' ? (activePlayer.user.id || activePlayer.user._id) : activePlayer.user;
                  const playerGoogleAvatar = typeof activePlayer.user === 'object' ? activePlayer.user.avatar : null;
                  const playerSelectedAvatar = playerAvatars && playerAvatars[playerId] ? playerAvatars[playerId] : null;
                  const hasSelectedAvatar = playerSelectedAvatar && playerSelectedAvatar !== '👤';
                  
                  if (hasSelectedAvatar) {
                    return <div style={{ fontSize: '40px' }}>{playerSelectedAvatar}</div>;
                  } else if (playerGoogleAvatar) {
                    return (
                      <img 
                        src={playerGoogleAvatar} 
                        alt="Avatar"
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '50%', 
                          objectFit: 'cover',
                          border: '2px solid rgba(255, 255, 255, 0.3)'
                        }} 
                      />
                    );
                  } else {
                    return <div style={{ fontSize: '40px' }}>👤</div>;
                  }
                })()}
                <div style={{ color: colors.text, fontSize: '24px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {typeof activePlayer.user === 'object' ? activePlayer.user.username : 'Jugador'}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '20px' }}>
          {canConfirm ? (
            <>
              <Button
                title="¡Continuar!"
                onClick={handleRoundIntroSeen}
                size="large"
                style={{ marginHorizontal: '20px', marginBottom: '6px' }}
              />
              <button
                onClick={() => setShowExitModal(true)}
                style={{
                  width: 'calc(100% - 40px)',
                  margin: '0 20px 20px 20px',
                  textAlign: 'center',
                  padding: '6px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: colors.textMuted,
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                🚪 Salir del Juego
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: colors.textMuted }}>
              <p style={{ fontSize: '15px', marginBottom: '6px' }}>Esperando a que el jugador continúe...</p>
              <div style={{ fontSize: '28px' }}>⏳</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ROUND INTRO SCREEN
  if (game.status === 'playing' && game.showingRoundIntro) {
    const roundInfo = roundDetails[game.currentRound];

    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'transparent', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px' }}>
        <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}>
          <Button
            title="Salir"
            onClick={() => {
              if (isHost) {
                setShowCancelModal(true);
              } else {
                setShowLeaveModal(true);
              }
            }}
            variant="secondary"
            size="small"
          />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: colors.primary, padding: '6px 20px', borderRadius: '20px', marginBottom: '16px' }}>
            <span style={{ color: colors.text, fontSize: '14px', fontWeight: 'bold', letterSpacing: '2px' }}>
              RONDA {game.currentRound}
            </span>
          </div>

          <div style={{ fontSize: '64px', marginBottom: '12px' }}>{roundInfo.icon}</div>
          <h1 style={{ color: colors.text, fontSize: '36px', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '2px', textTransform: 'uppercase' }}>
            {roundInfo.title}
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: '16px', textAlign: 'center', marginBottom: '20px', lineHeight: '22px', maxWidth: '600px' }}>
            {roundInfo.description}
          </p>

          <Card style={{ width: '100%', maxWidth: '600px', marginBottom: '16px' }}>
            {roundInfo.tips.map((tip, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: index < roundInfo.tips.length - 1 ? '8px' : '0' }}>
                <span style={{ color: colors.primary, fontSize: '16px', fontWeight: 'bold', marginRight: '10px' }}>•</span>
                <p style={{ color: colors.text, fontSize: '14px', flex: 1, lineHeight: '20px', margin: 0 }}>{tip}</p>
              </div>
            ))}
          </Card>

          {game.currentRound > 1 && (
            <div style={{ alignItems: 'center', marginTop: '12px' }}>
              <p style={{ color: colors.textMuted, fontSize: '11px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Puntuación actual
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ alignItems: 'center' }}>
                  <p style={{ color: colors.primary, fontSize: '11px', fontWeight: '600' }}>Equipo 1</p>
                  <p style={{ color: colors.text, fontSize: '28px', fontWeight: 'bold' }}>{team1Score}</p>
                </div>
                <span style={{ color: colors.textMuted, fontSize: '12px' }}>vs</span>
                <div style={{ alignItems: 'center' }}>
                  <p style={{ color: colors.secondary, fontSize: '11px', fontWeight: '600' }}>Equipo 2</p>
                  <p style={{ color: colors.text, fontSize: '28px', fontWeight: 'bold' }}>{team2Score}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Button
            title="¡Continuar!"
            onClick={handleRoundIntroSeen}
            size="large"
            style={{ marginHorizontal: '20px', marginBottom: '6px' }}
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

  // WAITING FOR PLAYER SCREEN (tu turno)
  if (game.status === 'playing' && game.waitingForPlayer && isCurrentActivePlayer) {
    const myStats = currentPlayerId ? getPlayerStats(currentPlayerId) : { hits: 0, fails: 0 };
    const amMVP = currentPlayerId ? isPlayerMVP(currentPlayerId) : false;

    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
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
        <Card style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '24px 20px' }}>
          <p style={{ color: colors.primary, fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
            Ronda {game.currentRound}
          </p>
          <p style={{ color: colors.textSecondary, fontSize: '13px', textAlign: 'center', marginBottom: '12px' }}>
            {roundRules[game.currentRound]}
          </p>

          <div style={{ width: '100%', height: '1px', backgroundColor: colors.border, margin: '12px 0' }} />

          <p style={{ color: colors.textMuted, fontSize: '13px', marginBottom: '6px' }}>¡Es tu turno!</p>
          {amMVP && <div style={{ fontSize: '28px', marginBottom: '4px' }}>👑</div>}
          <h2 style={{ color: colors.text, fontSize: '28px', fontWeight: 'bold', textAlign: 'center', marginBottom: '4px' }}>
            {typeof currentPlayer?.user === 'object' ? currentPlayer?.user.username : 'Jugador'}
          </h2>
          <p style={{ color: colors.textMuted, fontSize: '12px', marginBottom: '10px' }}>
            ✓ {myStats.hits} aciertos • ✗ {myStats.fails} fallos
          </p>
          <div style={{
            backgroundColor: game.currentTeam === 1 ? colors.primary : colors.secondary,
            padding: '6px 18px',
            borderRadius: '20px',
            display: 'inline-block',
            marginBottom: '16px',
          }}>
            <span style={{ color: colors.text, fontSize: '14px', fontWeight: '600' }}>
              Equipo {game.currentTeam}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginTop: '16px', justifyContent: 'center' }}>
            <div style={{ alignItems: 'center' }}>
              <p style={{ color: colors.primary, fontSize: '11px' }}>Equipo 1</p>
              <p style={{ color: colors.text, fontSize: '24px', fontWeight: 'bold' }}>{team1Score}</p>
            </div>
            <div style={{ alignItems: 'center' }}>
              <p style={{ color: colors.secondary, fontSize: '11px' }}>Equipo 2</p>
              <p style={{ color: colors.text, fontSize: '24px', fontWeight: 'bold' }}>{team2Score}</p>
            </div>
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

  // WAITING FOR OTHER PLAYER (not your turn)
  if (game.status === 'playing' && game.waitingForPlayer && !isCurrentActivePlayer) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
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
        <Card style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '32px 24px' }}>
          <p style={{ color: colors.primary, fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
            Ronda {game.currentRound}
          </p>
          <p style={{ color: colors.textSecondary, fontSize: '14px', textAlign: 'center', marginBottom: '16px' }}>
            {roundRules[game.currentRound]}
          </p>

          <div style={{ width: '100%', height: '1px', backgroundColor: colors.border, margin: '16px 0' }} />

          <p style={{ color: colors.textMuted, fontSize: '14px', marginBottom: '12px' }}>
            Esperando al Equipo {game.currentTeam}...
          </p>
          {activePlayer && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
              {(() => {
                const playerId = typeof activePlayer.user === 'object' ? (activePlayer.user.id || activePlayer.user._id) : activePlayer.user;
                const playerGoogleAvatar = typeof activePlayer.user === 'object' ? activePlayer.user.avatar : null;
                const playerSelectedAvatar = playerAvatars && playerAvatars[playerId] ? playerAvatars[playerId] : null;
                const hasSelectedAvatar = playerSelectedAvatar && playerSelectedAvatar !== '👤';
                
                return (
                  <>
                    {hasSelectedAvatar ? (
                      <div style={{ fontSize: '32px' }}>{playerSelectedAvatar}</div>
                    ) : playerGoogleAvatar ? (
                      <img 
                        src={playerGoogleAvatar} 
                        alt="Avatar"
                        style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '50%', 
                          objectFit: 'cover',
                          border: '2px solid rgba(255, 255, 255, 0.3)'
                        }} 
                      />
                    ) : (
                      <div style={{ fontSize: '32px' }}>👤</div>
                    )}
                    <span style={{ color: colors.text, fontSize: '18px', fontWeight: '600' }}>
                      {typeof activePlayer.user === 'object' ? activePlayer.user.username : 'Jugador'}
                    </span>
                  </>
                );
              })()}
            </div>
          )}
          <div style={{ fontSize: '32px', color: colors.primary, marginBottom: '24px' }}>⏳</div>

          <div style={{ display: 'flex', gap: '48px', marginTop: '24px', justifyContent: 'center' }}>
            <div style={{ alignItems: 'center' }}>
              <p style={{ color: colors.primary, fontSize: '12px' }}>Equipo 1</p>
              <p style={{ color: colors.text, fontSize: '28px', fontWeight: 'bold' }}>{team1Score}</p>
            </div>
            <div style={{ alignItems: 'center' }}>
              <p style={{ color: colors.secondary, fontSize: '12px' }}>Equipo 2</p>
              <p style={{ color: colors.text, fontSize: '28px', fontWeight: 'bold' }}>{team2Score}</p>
            </div>
          </div>

          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: `1px solid ${colors.border}` }}>
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
        </Card>
      </div>
    );
  }

  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: 'transparent',
    padding: '24px',
    paddingBottom: '40px',
  };

  return (
    <div style={containerStyle}>
      {error && (
        <div style={{ backgroundColor: `${colors.danger}20`, borderRadius: '12px', padding: '16px', marginBottom: '16px', color: colors.danger, textAlign: 'center' }}>
          {error}
        </div>
      )}

      {/* Waiting for players */}
      {game.status === 'waiting' && (
        <Card>
          {/* Header con código de sala */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ color: colors.text, fontWeight: 'bold', fontSize: '20px', textTransform: 'uppercase', margin: 0 }}>
              Sala: {game.roomCode}
            </h2>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button
                title="Compartir 📤"
                onClick={shareRoomCode}
                size="small"
              />
              {isHost ? (
                <Button
                  title="Cancelar Partida"
                  onClick={() => setShowCancelModal(true)}
                  variant="danger"
                  size="small"
                  silent
                />
              ) : (
                <Button
                  title="Salirse"
                  onClick={handleLeaveGame}
                  size="small"
                  silent
                />
              )}
            </div>
          </div>

          {/* Mostrar categoría si se usa */}
          {usesCategory && displayCategoryInfo && (
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: `${colors.primary}15`, borderRadius: '12px', padding: '12px', marginBottom: '24px' }}>
              <span style={{ fontSize: '32px', marginRight: '12px' }}>{displayCategoryInfo.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ color: colors.primary, fontSize: '16px', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>
                  {displayCategoryInfo.name}
                </p>
                {categoriesInfo && categoriesInfo.length > 1 && (
                  <p style={{ color: colors.textSecondary, fontSize: '12px', margin: '4px 0 0 0' }}>
                    {categoriesInfo.map(cat => cat.name).join(', ')}
                  </p>
                )}
                <p style={{ color: colors.textMuted, fontSize: '12px', margin: 0 }}>
                  {game.characters?.length || 0} personajes
                </p>
              </div>
            </div>
          )}

          {/* Selección de avatar */}
          {needsToSelectAvatar && (
            <div style={{ marginBottom: '24px' }}>
              <AvatarSelector
                selectedAvatar={selectedAvatar}
                onSelect={setSelectedAvatar}
              />
              <Button
                title={submittingAvatar ? 'Guardando...' : 'Confirmar Avatar'}
                onClick={handleSubmitAvatar}
                loading={submittingAvatar}
                style={{ width: '100%', marginTop: '16px' }}
              />
            </div>
          )}

          {/* Lista de jugadores */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ color: colors.text, fontWeight: 'bold', fontSize: '18px', textTransform: 'uppercase', marginBottom: '16px', textAlign: 'center' }}>
              Jugadores ({game.players.length} / {game.numPlayers || 4})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
              {game.players.map((player, index) => {
                const playerId = typeof player.user === 'object' ? player.user.id : player.user;
                const playerName = typeof player.user === 'object' ? player.user.username : 'Jugador';
                const playerGoogleAvatar = typeof player.user === 'object' ? player.user.avatar : null;
                const playerSelectedAvatar = playerAvatars && playerAvatars[playerId] ? playerAvatars[playerId] : null;
                // Priorizar avatar seleccionado en la partida, si no hay, usar avatar de Google, si no hay ninguno, usar emoji por defecto
                const hasSelectedAvatar = playerSelectedAvatar && playerSelectedAvatar !== '👤';
                const isMe = playerId === user?.id;
                return (
                  <div
                    key={index}
                    style={{
                      backgroundColor: isMe ? `${colors.primary}20` : colors.surfaceLight,
                      borderRadius: '12px',
                      padding: '16px',
                      textAlign: 'center',
                      border: isMe ? `2px solid ${colors.primary}` : '2px solid transparent',
                    }}
                  >
                    {hasSelectedAvatar ? (
                      <div style={{ fontSize: '48px', marginBottom: '8px' }}>{playerSelectedAvatar}</div>
                    ) : playerGoogleAvatar ? (
                      <img 
                        src={playerGoogleAvatar} 
                        alt={playerName}
                        style={{ 
                          width: '48px', 
                          height: '48px', 
                          borderRadius: '50%', 
                          marginBottom: '8px',
                          objectFit: 'cover',
                          border: '2px solid rgba(255, 255, 255, 0.3)'
                        }} 
                      />
                    ) : (
                      <div style={{ fontSize: '48px', marginBottom: '8px' }}>👤</div>
                    )}
                    <p style={{ 
                      color: colors.text, 
                      fontSize: '14px', 
                      fontWeight: 'bold', 
                      margin: 0,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      wordBreak: 'break-word'
                    }}>
                      {playerName}
                      {isMe && ' (Tú)'}
                    </p>
                    {isHost && playerId === (typeof game.host === 'object' ? (game.host.id || game.host._id) : game.host) && (
                      <span style={{ 
                        fontSize: '10px', 
                        color: colors.primary, 
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Anfitrión
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Formulario de personajes */}
          {needsToSubmitCharacters && (
            <div style={{ marginTop: '24px', marginBottom: '24px' }}>
              <h3 style={{ color: colors.text, fontWeight: 'bold', marginBottom: '12px', textTransform: 'uppercase' }}>
                Ingresa tus {charsPerPlayer} personajes
              </h3>
              {Array(charsPerPlayer).fill(0).map((_, index) => (
                <Input
                  key={index}
                  placeholder={`Personaje ${index + 1}`}
                  value={playerCharacters[index] || ''}
                  onChange={(val) => handleCharacterChange(index, val)}
                />
              ))}
              <Button
                title={submittingCharacters ? 'Enviando...' : 'Agregar'}
                onClick={handleSubmitCharacters}
                loading={submittingCharacters}
                style={{ marginTop: '12px', width: '100%' }}
              />
            </div>
          )}

          {/* Tus personajes */}
          {!usesCategory && !needsToSubmitCharacters && myCharacters.length > 0 && (
            <div style={{ marginTop: '16px', marginBottom: '24px' }}>
              <p style={{ color: colors.textMuted, fontSize: '14px', marginBottom: '8px', textTransform: 'uppercase' }}>Tus personajes:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {myCharacters.map((char, i) => (
                  <span
                    key={i}
                    style={{
                      backgroundColor: `${colors.primary}20`,
                      padding: '6px 14px',
                      borderRadius: '20px',
                      color: colors.primaryLight,
                      fontSize: '14px',
                      fontWeight: '600',
                      border: `1px solid ${colors.primary}40`,
                    }}
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Estado de espera */}
          {!needsToSubmitCharacters && !needsToSelectAvatar && (
            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ color: colors.textMuted, fontSize: '16px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Esperando jugadores
                </p>
                <LoadingDots />
              </div>
              {!usesCategory && (
                <p style={{ color: colors.textMuted, fontSize: '14px', marginBottom: '16px' }}>
                  Personajes: {game.characters?.length || 0} / {totalCharactersNeeded}
                </p>
              )}
              {isHost && (usesCategory || game.characters?.length >= totalCharactersNeeded) && game.players.length >= 2 && (
                <div style={{ marginTop: '24px' }}>
                  <Button 
                    title="Iniciar Partida" 
                    onClick={handleStart} 
                    size="large" 
                    style={{ width: '100%' }}
                  />
                </div>
              )}
              {!isHost && (
                <div style={{ marginTop: '24px' }}>
                  <Button 
                    title="Salirse de la Partida" 
                    onClick={() => setShowLeaveModal(true)} 
                    size="large" 
                    style={{ width: '100%' }}
                  />
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Modal de confirmación para cancelar partida */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancelar Partida"
        message="¿Estás seguro de que quieres cancelar la partida? Todos los jugadores serán expulsados y se perderá el progreso."
        onConfirm={handleCancelGame}
        confirmText="Cancelar Partida"
        cancelText="Volver"
        variant="danger"
      />

      {/* Modal de confirmación para salirse de la partida */}
      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="Salirse de la Partida"
        message="¿Estás seguro de que quieres salirte de la partida? Se perderá tu progreso actual."
        onConfirm={handleLeaveGame}
        confirmText="Salirse"
        cancelText="Cancelar"
        variant="danger"
      />

      {/* Playing */}
      {game.status === 'playing' && !game.waitingForPlayer && !game.showingRoundIntro && !game.showingRoundIntroMidTurn && (
        <>
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
          {/* Header con info del jugador */}
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: colors.surface, borderRadius: '16px', padding: '12px', marginBottom: '8px' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {currentPlayerId && isPlayerMVP(currentPlayerId) && <span style={{ fontSize: '16px' }}>👑</span>}
              <span style={{ color: colors.text, fontSize: '18px', fontWeight: 'bold' }}>
                {isCurrentActivePlayer ? 'Tu turno' : `Equipo ${game.currentTeam}`}
              </span>
              {currentPlayer && (
                <span style={{ 
                  color: colors.textMuted, 
                  fontSize: '12px',
                  backgroundColor: currentPlayer.team === 1 ? `${colors.primary}20` : `${colors.secondary}20`,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: '600'
                }}>
                  Equipo {currentPlayer.team}
                </span>
              )}
              {currentPlayerId && (
                <span style={{ color: colors.textMuted, fontSize: '12px' }}>
                  ✓{getPlayerStats(currentPlayerId).hits} ✗{getPlayerStats(currentPlayerId).fails}
                </span>
              )}
            </div>
            <div style={{
              backgroundColor: getCurrentTimeLeft() <= 10 ? colors.danger : colors.primary,
              width: '56px',
              height: '56px',
              borderRadius: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ color: colors.text, fontSize: '18px', fontWeight: 'bold' }}>{getCurrentTimeLeft()}s</span>
            </div>
          </div>

          <div style={{ backgroundColor: colors.surfaceLight, borderRadius: '8px', padding: '8px', alignItems: 'center', marginBottom: '16px', textAlign: 'center' }}>
            <p style={{ color: colors.textSecondary, fontSize: '13px', margin: 0 }}>
              Ronda {game.currentRound} • {roundRules[game.currentRound]}
            </p>
          </div>

          {/* Puntuaciones */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '16px' }}>
            <div style={{
              alignItems: 'center',
              backgroundColor: colors.surface,
              padding: '8px 20px',
              borderRadius: '12px',
              border: game.currentTeam === 1 ? `2px solid ${colors.primary}` : 'none',
            }}>
              <p style={{ color: colors.primary, fontSize: '12px', fontWeight: '600', margin: '0 0 4px 0' }}>E1</p>
              <p style={{ color: colors.text, fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{team1Score}</p>
            </div>
            <div style={{
              alignItems: 'center',
              backgroundColor: colors.surface,
              padding: '8px 20px',
              borderRadius: '12px',
              border: game.currentTeam === 2 ? `2px solid ${colors.secondary}` : 'none',
            }}>
              <p style={{ color: colors.secondary, fontSize: '12px', fontWeight: '600', margin: '0 0 4px 0' }}>E2</p>
              <p style={{ color: colors.text, fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{team2Score}</p>
            </div>
          </div>

          {/* Tarjeta del personaje */}
          {isCurrentActivePlayer ? (
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
                  {currentCharacter?.toUpperCase() || 'SIN TARJETAS'}
                </div>
                {currentCharacter && game?.characterCategories && game.characterCategories[currentCharacter] && (
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
                    ({game.characterCategories[currentCharacter].name})
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              backgroundColor: colors.surface,
              borderRadius: '24px',
              padding: '32px',
              alignItems: 'center',
              border: `3px solid ${colors.primary}`,
              marginBottom: '16px',
            }}>
              <h2 style={{ color: colors.text, fontSize: '32px', fontWeight: 'bold', textAlign: 'center', letterSpacing: '1px', margin: 0 }}>
                ???
              </h2>
            </div>
          )}

          <p style={{ color: colors.textMuted, fontSize: '14px', textAlign: 'center', marginBottom: '16px' }}>
            {availableCharacters.length} personajes restantes
          </p>

          {isCurrentActivePlayer ? (
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
          ) : (
            <Card style={{ textAlign: 'center', paddingVertical: '24px' }}>
              <p style={{ color: colors.textMuted, fontSize: '18px', fontWeight: '600', margin: '0 0 4px 0' }}>
                Espera tu turno...
              </p>
              <p style={{ color: colors.textMuted, fontSize: '14px', margin: '0 0 8px 0' }}>
                El equipo {game.currentTeam} está jugando
              </p>
              {activePlayer && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
                  {(() => {
                    const playerId = typeof activePlayer.user === 'object' ? (activePlayer.user.id || activePlayer.user._id) : activePlayer.user;
                    const playerGoogleAvatar = typeof activePlayer.user === 'object' ? activePlayer.user.avatar : null;
                    const playerSelectedAvatar = playerAvatars && playerAvatars[playerId] ? playerAvatars[playerId] : null;
                    const hasSelectedAvatar = playerSelectedAvatar && playerSelectedAvatar !== '👤';
                    
                    return (
                      <>
                        {hasSelectedAvatar ? (
                          <div style={{ fontSize: '24px' }}>{playerSelectedAvatar}</div>
                        ) : playerGoogleAvatar ? (
                          <img 
                            src={playerGoogleAvatar} 
                            alt="Avatar"
                            style={{ 
                              width: '24px', 
                              height: '24px', 
                              borderRadius: '50%', 
                              objectFit: 'cover',
                              border: '2px solid rgba(255, 255, 255, 0.3)'
                            }} 
                          />
                        ) : (
                          <div style={{ fontSize: '24px' }}>👤</div>
                        )}
                        <span style={{ color: colors.text, fontSize: '16px', fontWeight: '600' }}>
                          {typeof activePlayer.user === 'object' ? activePlayer.user.username : 'Jugador'}
                        </span>
                      </>
                    );
                  })()}
                </div>
              )}
            </Card>
          )}

          {isCurrentActivePlayer && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={togglePause}
                style={{
                  width: '100%',
                  textAlign: 'center',
                  padding: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: colors.textMuted,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                {game.timer?.isPaused ? '▶ Reanudar' : '⏸ Pausar'}
              </button>
              <button
                onClick={() => setShowExitModal(true)}
                style={{
                  width: '100%',
                  textAlign: 'center',
                  padding: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: colors.textMuted,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                🚪 Salir del Juego
              </button>
            </div>
          )}
          {!isCurrentActivePlayer && (
            <button
              onClick={() => setShowExitModal(true)}
              style={{
                width: '100%',
                textAlign: 'center',
                padding: '8px',
                border: 'none',
                background: 'transparent',
                color: colors.textMuted,
                fontSize: '14px',
                cursor: 'pointer',
                marginTop: '8px',
              }}
            >
              🚪 Salir del Juego
            </button>
          )}
        </>
      )}

      {/* Finished */}
      {game.status === 'finished' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', width: '100%' }}>
            <div style={{ fontSize: '56px', marginBottom: '8px', textAlign: 'center' }}>🏆</div>
            <h1 style={{ color: colors.text, fontSize: '26px', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>
              ¡Juego Terminado!
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '12px', width: '100%' }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '12px',
                borderRadius: '16px',
                backgroundColor: colors.surface,
                border: team1Score > team2Score ? `2px solid ${colors.warning}` : 'none',
              }}>
                <p style={{ color: colors.primary, fontSize: '12px', marginBottom: '4px', margin: '0 0 4px 0' }}>Equipo 1</p>
                <p style={{ color: colors.text, fontSize: '36px', fontWeight: 'bold', margin: 0 }}>{team1Score}</p>
              </div>
              <span style={{ color: colors.textMuted, fontSize: '14px' }}>vs</span>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '12px',
                borderRadius: '16px',
                backgroundColor: colors.surface,
                border: team2Score > team1Score ? `2px solid ${colors.warning}` : 'none',
              }}>
                <p style={{ color: colors.secondary, fontSize: '12px', marginBottom: '4px', margin: '0 0 4px 0' }}>Equipo 2</p>
                <p style={{ color: colors.text, fontSize: '36px', fontWeight: 'bold', margin: 0 }}>{team2Score}</p>
              </div>
            </div>
            <h2 style={{ color: colors.text, fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>
              {team1Score > team2Score ? '🎉 ¡Equipo 1 Gana!' : team2Score > team1Score ? '🎉 ¡Equipo 2 Gana!' : '🤝 ¡Empate!'}
            </h2>
          </div>

          {/* Ranking de jugadores */}
          <Card style={{ marginBottom: '12px', width: '100%' }}>
            <h3 style={{ color: colors.text, fontSize: '15px', fontWeight: 'bold', marginBottom: '12px' }}>
              📊 Estadísticas de Jugadores
            </h3>
            {getPlayerRanking().map((player, index) => {
              const playerId = typeof player.user === 'object' ? player.user.id : player.user;
              const playerName = typeof player.user === 'object' ? player.user.username : 'Jugador';
              const stats = getPlayerStats(playerId);
              const isFirst = index === 0 && stats.hits > 0;
              return (
                <div
                  key={playerId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: index < getPlayerRanking().length - 1 ? `1px solid ${colors.border}` : 'none',
                    backgroundColor: isFirst ? colors.surfaceLight : 'transparent',
                    paddingLeft: isFirst ? '16px' : '0',
                    paddingRight: isFirst ? '16px' : '0',
                    marginLeft: isFirst ? '-16px' : '0',
                    marginRight: isFirst ? '-16px' : '0',
                    borderRadius: isFirst ? '8px' : '0',
                  }}
                >
                  <span style={{ color: colors.textMuted, fontSize: '13px', fontWeight: 'bold', width: '28px' }}>
                    #{index + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: colors.text, fontSize: '15px', fontWeight: '600' }}>
                        {capitalize(playerName)}
                      </span>
                      {isFirst && <span style={{ fontSize: '12px' }}>👑</span>}
                    </div>
                    <p style={{ color: colors.textMuted, fontSize: '11px', margin: 0 }}>Equipo {player.team}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ color: colors.success, fontSize: '13px', fontWeight: 'bold' }}>✓ {stats.hits}</span>
                    <span style={{ color: colors.danger, fontSize: '13px', fontWeight: 'bold' }}>✗ {stats.fails}</span>
                  </div>
                </div>
              );
            })}
          </Card>

          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
            <Button 
              title="Volver al Dashboard" 
              onClick={() => navigate('/dashboard')} 
              size="large" 
              style={{ width: '100%' }}
              silent
            />
          </div>
        </div>
      )}

    </div>
  );
}

export default GameRoom;
