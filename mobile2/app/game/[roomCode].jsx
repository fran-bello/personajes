import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, Dimensions, Share, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../src/theme';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Input } from '../../src/components/Input';
import Modal from '../../src/components/Modal';
import LoadingDots from '../../src/components/LoadingDots';
import AvatarSelector, { AVATARS } from '../../src/components/AvatarSelector';
import Toast from '../../src/components/Toast';
import { api } from '../../src/services/api';
import { socketService } from '../../src/services/socket';
import { useAuth } from '../../src/context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

export default function GameRoom() {
  const { roomCode } = useLocalSearchParams();
  const router = useRouter();
  const { user, fetchUser } = useAuth();
  const [game, setGame] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playerCharacters, setPlayerCharacters] = useState(['', '']);
  const [submittingCharacters, setSubmittingCharacters] = useState(false);
  const timerRef = useRef(null);
  const [isCardPressed, setIsCardPressed] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [submittingAvatar, setSubmittingAvatar] = useState(false);
  const timeUpHandledRef = useRef(false);
  const prevShowingRoundIntroMidTurnRef = useRef(false);
  const cardFlipAnimation = useRef(new Animated.Value(0)).current;
  const [showExitModal, setShowExitModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  useEffect(() => {
    if (roomCode) {
      fetchGame();
      connectSocket();
    }
    return () => {
      // Limpiar listeners antes de desconectar
      socketService.removeListener('game-updated');
      socketService.removeListener('game-cancelled');
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

  // Animación del card flip
  useEffect(() => {
    if (isCardPressed) {
      Animated.timing(cardFlipAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(cardFlipAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isCardPressed]);

  const connectSocket = async () => {
    try {
      await socketService.connect();
      if (roomCode) socketService.joinGame(roomCode);
      socketService.onGameUpdated(() => {
        fetchGame();
      });
      socketService.onGameCancelled(() => {
        socketService.leaveGame(roomCode);
        socketService.disconnect();
        router.push('/dashboard');
      });
    } catch (error) {
      console.error('Error connecting socket:', error);
      setError('Error al conectar con el servidor');
    }
  };

  const fetchGame = async () => {
    try {
      const response = await api.getGame(roomCode);
      const previousStatus = game?.status;
      setGame(response.game);
      setLoading(false);
      if (response.game.timer && response.game.timer.timeLeft !== undefined && response.game.timer.timeLeft !== null) {
        const isPaused = response.game.timer.isPaused || response.game.waitingForPlayer || response.game.showingRoundIntro || response.game.showingRoundIntroMidTurn;
        if (isPaused) {
          setTimeLeft(response.game.timer.timeLeft);
        }
      }
      if (response.game.status === 'finished' && previousStatus !== 'finished') {
        if (fetchUser) fetchUser();
      }
    } catch (err) {
      console.error('Error fetching game:', err);
      if (err.response?.status === 404) {
        socketService.leaveGame(roomCode);
        socketService.disconnect();
        router.push('/dashboard');
        return;
      }
      setLoading(false);
    }
  };

  const getCurrentTimeLeft = () => {
    const isPaused = game?.timer?.isPaused || game?.waitingForPlayer || game?.showingRoundIntro || game?.showingRoundIntroMidTurn;
    if (isPaused && game?.timer && game.timer.timeLeft !== undefined && game.timer.timeLeft !== null) {
      return game.timer.timeLeft;
    }
    return timeLeft;
  };

  // Control del timer local
  useEffect(() => {
    if (!game) return;

    const isPlaying = game.status === 'playing';
    const isPaused = game.timer?.isPaused || game.waitingForPlayer || game.showingRoundIntro || game.showingRoundIntroMidTurn;
    const shouldRunTimer = isPlaying && !isPaused;
    const wasShowingIntroMidTurn = prevShowingRoundIntroMidTurnRef.current;
    const justExitedIntroMidTurn = wasShowingIntroMidTurn && !game.showingRoundIntroMidTurn;

    prevShowingRoundIntroMidTurnRef.current = game.showingRoundIntroMidTurn || false;
    timeUpHandledRef.current = false;

    if (shouldRunTimer) {
      if (!timerRef.current || justExitedIntroMidTurn) {
        if (game.timer && game.timer.timeLeft !== undefined && game.timer.timeLeft !== null) {
          setTimeLeft(game.timer.timeLeft);
        }
        if (!timerRef.current) {
          startTimer();
        }
      }
    } else {
      stopTimer();
      if (isPaused && game.timer && game.timer.timeLeft !== undefined && game.timer.timeLeft !== null) {
        setTimeLeft(game.timer.timeLeft);
      }
    }

    return () => {
      if (!shouldRunTimer) {
        stopTimer();
      }
    };
  }, [game?.status, game?.timer?.isPaused, game?.waitingForPlayer, game?.showingRoundIntro, game?.showingRoundIntroMidTurn, game?.currentTeam, game?.currentPlayerIndex, game?.timer?.timeLeft]);

  // Manejar timeUp automático
  useEffect(() => {
    if (timeLeft === 0 && game && game.status === 'playing' && !game.timer?.isPaused && !game.waitingForPlayer && !game.showingRoundIntro && !game.showingRoundIntroMidTurn && !timeUpHandledRef.current) {
      const currentTeamPlayers = game.players?.filter(p => p.team === game.currentTeam) || [];
      const currentPlayerIndex = game.currentPlayerIndex || 0;
      const activePlayer = currentTeamPlayers.length > 0 ? currentTeamPlayers[currentPlayerIndex % currentTeamPlayers.length] : null;
      
      if (activePlayer) {
        const activePlayerId = typeof activePlayer.user === 'object' ? (activePlayer.user.id || activePlayer.user._id) : activePlayer.user;
        if (activePlayerId === user?.id) {
          timeUpHandledRef.current = true;
          handleTimeUp();
        }
      }
    } else if (timeLeft > 0) {
      timeUpHandledRef.current = false;
    }
  }, [timeLeft, game?.status, game?.timer?.isPaused, game?.waitingForPlayer, game?.showingRoundIntro, game?.showingRoundIntroMidTurn, game?.currentTeam, game?.currentPlayerIndex, user?.id]);

  const startTimer = () => {
    stopTimer();
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

  const handleTimeUp = async () => {
    if (!game || game.status !== 'playing' || game.timer?.isPaused || game.waitingForPlayer || game.showingRoundIntro || game.showingRoundIntroMidTurn) {
      return;
    }

    const currentTeamPlayers = game.players?.filter(p => p.team === game.currentTeam) || [];
    const currentPlayerIndex = game.currentPlayerIndex || 0;
    const activePlayer = currentTeamPlayers.length > 0 ? currentTeamPlayers[currentPlayerIndex % currentTeamPlayers.length] : null;
    if (!activePlayer) return;

    const activePlayerId = typeof activePlayer.user === 'object' ? (activePlayer.user.id || activePlayer.user._id) : activePlayer.user;
    if (activePlayerId !== user?.id) {
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
      const response = await api.joinGame(roomCode, trimmedChars);
      setGame(response.game);
      setTimeLeft(response.game.timer?.timeLeft || response.game.timePerRound);
      socketService.emitGameUpdate(roomCode);
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    } finally {
      setSubmittingCharacters(false);
    }
  };

  const handleStart = async () => {
    try {
      const response = await api.startGame(roomCode);
      setGame(response.game);
      if (response.game.timer && response.game.timer.timeLeft !== undefined && response.game.timer.timeLeft !== null) {
        setTimeLeft(response.game.timer.timeLeft);
      } else {
        setTimeLeft(response.game.timePerRound);
      }
      socketService.emitGameUpdate(roomCode);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar');
    }
  };

  const handleCancelGame = async () => {
    try {
      await api.cancelGame(roomCode);
      socketService.emitGameUpdate(roomCode);
      socketService.leaveGame(roomCode);
      socketService.disconnect();
      router.push('/dashboard');
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
      router.push('/dashboard');
    } catch (err) {
      console.warn('Error al salirse de la partida, pero permitiendo salir:', err.response?.data?.message || err.message);
      socketService.leaveGame(roomCode);
      socketService.disconnect();
      router.push('/dashboard');
    }
  };

  const handleExit = async () => {
    try {
      if (!game) {
        socketService.leaveGame(roomCode);
        socketService.disconnect();
        router.push('/dashboard');
        return;
      }

      const gameHostId = typeof game.host === 'object' ? (game.host.id || game.host._id) : game.host;
      const userIsHost = gameHostId === user?.id;

      if (game.status === 'waiting' && userIsHost) {
        try {
          await api.cancelGame(roomCode);
        } catch (cancelErr) {
          console.warn('Error al cancelar, intentando salirse:', cancelErr.response?.data?.message);
          try {
            await api.leaveGame(roomCode);
          } catch (leaveErr) {
            console.warn('Error al salirse, pero permitiendo salir:', leaveErr.response?.data?.message);
          }
        }
      } else {
        try {
          await api.leaveGame(roomCode);
        } catch (leaveErr) {
          console.warn('Error al salirse, pero permitiendo salir:', leaveErr.response?.data?.message);
        }
      }
      socketService.emitGameUpdate(roomCode);
      socketService.leaveGame(roomCode);
      socketService.disconnect();
      router.push('/dashboard');
    } catch (err) {
      console.warn('Error al salir del juego, pero permitiendo salir:', err.response?.data?.message || err.message);
      socketService.leaveGame(roomCode);
      socketService.disconnect();
      router.push('/dashboard');
    }
  };

  const handleHit = async () => {
    setIsCardPressed(false);
    try {
      const currentTime = getCurrentTimeLeft();
      const response = await api.hitCharacter(roomCode, currentTime);
      setGame(response.game);
      socketService.emitGameUpdate(roomCode);
    } catch (err) {
      console.error('[handleHit] Error:', err);
      setError(err.response?.data?.message || 'Error');
    }
  };

  const handleFail = async () => {
    setIsCardPressed(false);
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
      if (response.game.timer && response.game.timer.timeLeft !== undefined && response.game.timer.timeLeft !== null) {
        setTimeLeft(response.game.timer.timeLeft);
      }
      socketService.emitGameUpdate(roomCode);
    } catch (err) {
      console.error('[handleRoundIntroSeen] Error:', err);
      setError(err.response?.data?.message || 'Error');
    }
  };

  const togglePause = async () => {
    try {
      const currentTimeLeft = getCurrentTimeLeft();
      await api.updateTimer(roomCode, !game?.timer?.isPaused, currentTimeLeft);
      socketService.emitGameUpdate(roomCode);
      fetchGame();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const shareRoomCode = async () => {
    try {
      await Share.share({
        message: `¡Únete a mi partida de Personajes! Código: ${roomCode}`,
        title: 'Únete a mi partida',
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

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
      <LinearGradient colors={theme.gradients.background} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Cargando partida...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (error && !game) {
    return (
      <LinearGradient colors={theme.gradients.background} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Card style={styles.errorCard}>
              <Text style={styles.errorTitle}>{error}</Text>
              <Button title="Volver" onPress={() => router.push('/dashboard')} />
            </Card>
          </View>
        </SafeAreaView>
      </LinearGradient>
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
  const team1Score = game.roundScores.round1.team1 + game.roundScores.round2.team1 + game.roundScores.round3.team1;
  const team2Score = game.roundScores.round1.team2 + game.roundScores.round2.team2 + game.roundScores.round3.team2;
  const playerCharactersData = game.playerCharacters || {};
  const usesCategory = game.usesCategory || game.charactersPerPlayer === 0;
  const userCharacters = currentPlayerId ? (playerCharactersData[currentPlayerId] || []) : [];
  const hasSubmittedCharacters = usesCategory || (currentPlayer && Array.isArray(userCharacters) && userCharacters.length > 0);
  const needsToSubmitCharacters = !usesCategory && currentPlayer && currentPlayerId && !hasSubmittedCharacters && game.status === 'waiting';
  const charsPerPlayer = game.charactersPerPlayer || 2;
  const totalCharactersNeeded = usesCategory ? 0 : (game.numPlayers || 4) * charsPerPlayer;
  const myCharacters = currentPlayerId ? playerCharactersData[currentPlayerId] || [] : [];
  const categoryInfo = game.category;
  const playerAvatars = (game && game.playerAvatars) ? game.playerAvatars : {};
  const myAvatar = currentPlayerId && playerAvatars ? playerAvatars[currentPlayerId] : null;
  const needsToSelectAvatar = currentPlayer && !myAvatar && game.status === 'waiting';

  const roundCharacters = game.roundCharacters || [];
  const blockedCharacters = game.blockedCharacters || [];
  const availableCharacters = roundCharacters.filter(c => !blockedCharacters.includes(c));
  const currentCharacter = availableCharacters.length > 0
    ? availableCharacters[game.currentCharacterIndex % availableCharacters.length]
    : null;

  // ROUND INTRO MID-TURN SCREEN
  if (game.status === 'playing' && game.showingRoundIntroMidTurn) {
    return renderRoundIntroMidTurn();
  }

  // ROUND INTRO SCREEN
  if (game.status === 'playing' && game.showingRoundIntro) {
    return renderRoundIntro();
  }

  // WAITING FOR PLAYER SCREEN (tu turno)
  if (game.status === 'playing' && game.waitingForPlayer && isCurrentTeam) {
    return renderWaitingForPlayer(true);
  }

  // WAITING FOR OTHER PLAYER (not your turn)
  if (game.status === 'playing' && game.waitingForPlayer && !isCurrentTeam) {
    return renderWaitingForPlayer(false);
  }

  // WAITING SCREEN
  if (game.status === 'waiting') {
    return renderWaiting();
  }

  // PLAYING SCREEN
  if (game.status === 'playing' && !game.waitingForPlayer && !game.showingRoundIntro && !game.showingRoundIntroMidTurn) {
    return renderPlaying();
  }

  // FINISHED SCREEN
  if (game.status === 'finished') {
    return renderFinished();
  }

  return null;

  function renderRoundIntroMidTurn() {
    const roundInfo = roundDetails[game.currentRound];
    const actualTimeLeft = (game.timer && game.timer.timeLeft !== undefined && game.timer.timeLeft !== null) 
      ? game.timer.timeLeft 
      : (timeLeft !== undefined && timeLeft !== null ? timeLeft : 60);
    
    const canConfirm = isCurrentTeam && currentPlayer;
    
    const currentTeamPlayers = game.players.filter(p => p.team === game.currentTeam);
    const currentPlayerIndex = game.currentPlayerIndex || 0;
    const activePlayer = currentTeamPlayers.length > 0 ? currentTeamPlayers[currentPlayerIndex % currentTeamPlayers.length] : null;

    return (
      <LinearGradient colors={theme.gradients.background} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <Toast message={error} isVisible={!!error} onClose={() => setError('')} />
          <ScrollView contentContainerStyle={styles.roundIntroContainer}>
            <View style={styles.roundIntroHeader}>
              <Button
                title="Salir"
                onPress={() => {
                  if (isHost) {
                    setShowCancelModal(true);
                  } else {
                    setShowLeaveModal(true);
                  }
                }}
                variant="secondary"
                size="small"
              />
            </View>
            
            <View style={styles.roundIntroContent}>
              <View style={[styles.timeBadge, { backgroundColor: theme.colors.warning }]}>
                <Text style={styles.timeBadgeText}>⏱️ {actualTimeLeft}s restantes</Text>
              </View>

              <View style={[styles.roundBadge, { backgroundColor: theme.colors.warning }]}>
                <Text style={styles.roundBadgeText}>¡NUEVA RONDA!</Text>
              </View>

              <Text style={styles.roundIcon}>{roundInfo.icon}</Text>
              <Text style={styles.roundTitle}>
                RONDA {game.currentRound}: {roundInfo.title}
              </Text>
              <Text style={styles.roundDescription}>{roundInfo.description}</Text>

              <Card style={styles.roundTipsCard}>
                {roundInfo.tips.map((tip, index) => (
                  <View key={index} style={styles.tipRow}>
                    <Text style={styles.tipBullet}>•</Text>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </Card>

              {activePlayer && (
                <Card style={styles.activePlayerCard}>
                  <Text style={styles.activePlayerLabel}>
                    {canConfirm ? 'Sigues jugando:' : 'Jugando ahora:'}
                  </Text>
                  <View style={styles.activePlayerInfo}>
                    {(() => {
                      const playerId = typeof activePlayer.user === 'object' ? (activePlayer.user.id || activePlayer.user._id) : activePlayer.user;
                      const playerSelectedAvatar = playerAvatars && playerAvatars[playerId] ? playerAvatars[playerId] : null;
                      const hasSelectedAvatar = playerSelectedAvatar && playerSelectedAvatar !== '👤';
                      
                      if (hasSelectedAvatar) {
                        return <Text style={styles.activePlayerAvatar}>{playerSelectedAvatar}</Text>;
                      } else {
                        return <Text style={styles.activePlayerAvatar}>👤</Text>;
                      }
                    })()}
                    <Text style={styles.activePlayerName}>
                      {typeof activePlayer.user === 'object' ? activePlayer.user.username : 'Jugador'}
                    </Text>
                  </View>
                </Card>
              )}
            </View>

            <View style={styles.roundIntroActions}>
              {canConfirm ? (
                <>
                  <Button
                    title="¡Continuar!"
                    onPress={handleRoundIntroSeen}
                    size="large"
                    style={styles.continueButton}
                  />
                  <TouchableOpacity onPress={() => setShowExitModal(true)} style={styles.exitLink}>
                    <Text style={styles.exitLinkText}>🚪 Salir del Juego</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.waitingForPlayer}>
                  <Text style={styles.waitingText}>Esperando a que el jugador continúe...</Text>
                  <Text style={styles.waitingIcon}>⏳</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  function renderRoundIntro() {
    const roundInfo = roundDetails[game.currentRound];

    return (
      <LinearGradient colors={theme.gradients.background} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <Toast message={error} isVisible={!!error} onClose={() => setError('')} />
          <ScrollView contentContainerStyle={styles.roundIntroContainer}>
            <View style={styles.roundIntroHeader}>
              <Button
                title="Salir"
                onPress={() => {
                  if (isHost) {
                    setShowCancelModal(true);
                  } else {
                    setShowLeaveModal(true);
                  }
                }}
                variant="secondary"
                size="small"
              />
            </View>
            
            <View style={styles.roundIntroContent}>
              <View style={[styles.roundBadge, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.roundBadgeText}>RONDA {game.currentRound}</Text>
              </View>

              <Text style={styles.roundIcon}>{roundInfo.icon}</Text>
              <Text style={styles.roundTitle}>{roundInfo.title}</Text>
              <Text style={styles.roundDescription}>{roundInfo.description}</Text>

              <Card style={styles.roundTipsCard}>
                {roundInfo.tips.map((tip, index) => (
                  <View key={index} style={styles.tipRow}>
                    <Text style={styles.tipBullet}>•</Text>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </Card>

              {game.currentRound > 1 && (
                <View style={styles.currentScores}>
                  <Text style={styles.currentScoresLabel}>Puntuación actual</Text>
                  <View style={styles.currentScoresRow}>
                    <View style={styles.currentScoreItem}>
                      <Text style={styles.currentScoreLabel}>Equipo 1</Text>
                      <Text style={styles.currentScoreValue}>{team1Score}</Text>
                    </View>
                    <Text style={styles.currentScoresVS}>vs</Text>
                    <View style={styles.currentScoreItem}>
                      <Text style={styles.currentScoreLabel}>Equipo 2</Text>
                      <Text style={styles.currentScoreValue}>{team2Score}</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.roundIntroActions}>
              <Button
                title="¡Continuar!"
                onPress={handleRoundIntroSeen}
                size="large"
                style={styles.continueButton}
              />
              <TouchableOpacity onPress={() => setShowExitModal(true)} style={styles.exitLink}>
                <Text style={styles.exitLinkText}>🚪 Salir del Juego</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  function renderWaitingForPlayer(isMyTurn) {
    const myStats = currentPlayerId ? getPlayerStats(currentPlayerId) : { hits: 0, fails: 0 };
    const amMVP = currentPlayerId ? isPlayerMVP(currentPlayerId) : false;

    return (
      <LinearGradient colors={theme.gradients.background} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
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
          <View style={styles.waitingForPlayerContainer}>
            <Card style={styles.waitingForPlayerCard}>
              <Text style={styles.waitingRoundLabel}>Ronda {game.currentRound}</Text>
              <Text style={styles.waitingRoundRule}>{roundRules[game.currentRound]}</Text>
              <View style={styles.waitingDivider} />
              
              {isMyTurn ? (
                <>
                  <Text style={styles.waitingTurnLabel}>¡Es tu turno!</Text>
                  {amMVP && <Text style={styles.mvpIcon}>👑</Text>}
                  <Text style={styles.waitingPlayerName}>
                    {typeof currentPlayer?.user === 'object' ? currentPlayer?.user.username : 'Jugador'}
                  </Text>
                  <Text style={styles.waitingPlayerStats}>
                    ✓ {myStats.hits} aciertos • ✗ {myStats.fails} fallos
                  </Text>
                  <View style={[styles.waitingTeamBadge, { backgroundColor: game.currentTeam === 1 ? theme.colors.primary : theme.colors.secondary }]}>
                    <Text style={styles.waitingTeamText}>Equipo {game.currentTeam}</Text>
                  </View>

                  <View style={styles.waitingScores}>
                    <View style={styles.waitingScoreItem}>
                      <Text style={styles.waitingScoreLabel}>Equipo 1</Text>
                      <Text style={styles.waitingScoreValue}>{team1Score}</Text>
                    </View>
                    <View style={styles.waitingScoreItem}>
                      <Text style={styles.waitingScoreLabel}>Equipo 2</Text>
                      <Text style={styles.waitingScoreValue}>{team2Score}</Text>
                    </View>
                  </View>

                  <Button
                    title="¡Estoy Listo!"
                    onPress={handlePlayerReady}
                    size="large"
                    style={styles.readyButton}
                  />
                  <TouchableOpacity onPress={() => setShowExitModal(true)} style={styles.exitLink}>
                    <Text style={styles.exitLinkText}>🚪 Salir del Juego</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.waitingTurnLabel}>Esperando al Equipo {game.currentTeam}...</Text>
                  <Text style={styles.waitingIcon}>⏳</Text>

                  <View style={styles.waitingScores}>
                    <View style={styles.waitingScoreItem}>
                      <Text style={styles.waitingScoreLabel}>Equipo 1</Text>
                      <Text style={styles.waitingScoreValue}>{team1Score}</Text>
                    </View>
                    <View style={styles.waitingScoreItem}>
                      <Text style={styles.waitingScoreLabel}>Equipo 2</Text>
                      <Text style={styles.waitingScoreValue}>{team2Score}</Text>
                    </View>
                  </View>
                </>
              )}
            </Card>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  function renderWaiting() {
    return (
      <LinearGradient colors={theme.gradients.background} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <Toast message={error} isVisible={!!error} onClose={() => setError('')} />
          <ScrollView contentContainerStyle={styles.waitingContainer}>
            <Card>
              <View style={styles.waitingHeader}>
                <Text style={styles.waitingRoomCode}>Sala: {game.roomCode}</Text>
                <View style={styles.waitingHeaderActions}>
                  <Button
                    title="Compartir 📤"
                    onPress={shareRoomCode}
                    size="small"
                  />
                  {isHost ? (
                    <Button
                      title="Cancelar Partida"
                      onPress={() => setShowCancelModal(true)}
                      variant="danger"
                      size="small"
                    />
                  ) : (
                    <Button
                      title="Salirse"
                      onPress={handleLeaveGame}
                      size="small"
                    />
                  )}
                </View>
              </View>

              {usesCategory && categoryInfo && (
                <View style={styles.categoryBanner}>
                  <Text style={styles.categoryBannerIcon}>{categoryInfo.icon}</Text>
                  <View style={styles.categoryBannerInfo}>
                    <Text style={styles.categoryBannerName}>{categoryInfo.name}</Text>
                    <Text style={styles.categoryBannerCount}>{game.characters?.length || 0} personajes</Text>
                  </View>
                </View>
              )}

              {needsToSelectAvatar && (
                <View style={styles.avatarSection}>
                  <AvatarSelector
                    selectedAvatar={selectedAvatar}
                    onSelect={setSelectedAvatar}
                  />
                  <Button
                    title={submittingAvatar ? 'Guardando...' : 'Confirmar Avatar'}
                    onPress={handleSubmitAvatar}
                    loading={submittingAvatar}
                    style={styles.confirmButton}
                  />
                </View>
              )}

              <View style={styles.playersSection}>
                <Text style={styles.playersTitle}>
                  Jugadores ({game.players.length} / {game.numPlayers || 4})
                </Text>
                <View style={styles.playersGrid}>
                  {game.players.map((player, index) => {
                    const playerId = typeof player.user === 'object' ? player.user.id : player.user;
                    const playerName = typeof player.user === 'object' ? player.user.username : 'Jugador';
                    const playerSelectedAvatar = playerAvatars && playerAvatars[playerId] ? playerAvatars[playerId] : null;
                    const hasSelectedAvatar = playerSelectedAvatar && playerSelectedAvatar !== '👤';
                    const isMe = playerId === user?.id;
                    return (
                      <View
                        key={index}
                        style={[
                          styles.playerCard,
                          isMe && styles.playerCardMe
                        ]}
                      >
                        {hasSelectedAvatar ? (
                          <Text style={styles.playerAvatar}>{playerSelectedAvatar}</Text>
                        ) : (
                          <Text style={styles.playerAvatar}>👤</Text>
                        )}
                        <Text style={styles.playerName}>
                          {playerName}
                          {isMe && ' (Tú)'}
                        </Text>
                        {isHost && playerId === (typeof game.host === 'object' ? (game.host.id || game.host._id) : game.host) && (
                          <Text style={styles.hostLabel}>Anfitrión</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>

              {needsToSubmitCharacters && (
                <View style={styles.charactersFormSection}>
                  <Text style={styles.charactersFormTitle}>Ingresa tus {charsPerPlayer} personajes</Text>
                  {Array(charsPerPlayer).fill(0).map((_, index) => (
                    <Input
                      key={index}
                      placeholder={`Personaje ${index + 1}`}
                      value={playerCharacters[index] || ''}
                      onChangeText={(val) => handleCharacterChange(index, val)}
                    />
                  ))}
                  <Button
                    title={submittingCharacters ? 'Enviando...' : 'Agregar'}
                    onPress={handleSubmitCharacters}
                    loading={submittingCharacters}
                    style={styles.submitButton}
                  />
                </View>
              )}

              {!usesCategory && !needsToSubmitCharacters && myCharacters.length > 0 && (
                <View style={styles.myCharactersSection}>
                  <Text style={styles.myCharactersLabel}>Tus personajes:</Text>
                  <View style={styles.myCharactersList}>
                    {myCharacters.map((char, i) => (
                      <View key={i} style={styles.characterTag}>
                        <Text style={styles.characterTagText}>{char}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {!needsToSubmitCharacters && !needsToSelectAvatar && (
                <View style={styles.waitingStatus}>
                  <Text style={styles.waitingStatusText}>Esperando jugadores</Text>
                  <LoadingDots />
                  {!usesCategory && (
                    <Text style={styles.waitingCharactersCount}>
                      Personajes: {game.characters?.length || 0} / {totalCharactersNeeded}
                    </Text>
                  )}
                  {isHost && (usesCategory || game.characters?.length >= totalCharactersNeeded) && game.players.length >= 2 && (
                    <Button 
                      title="Iniciar Partida" 
                      onPress={handleStart} 
                      size="large" 
                      style={styles.startButton}
                    />
                  )}
                  {!isHost && (
                    <Button 
                      title="Salirse de la Partida" 
                      onPress={() => setShowLeaveModal(true)} 
                      size="large" 
                      style={styles.startButton}
                    />
                  )}
                </View>
              )}
            </Card>

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
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  function renderPlaying() {
    const backOpacity = cardFlipAnimation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 0, 0],
    });

    const frontOpacity = cardFlipAnimation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0, 1],
    });

    const backAnimatedStyle = { opacity: backOpacity };
    const frontAnimatedStyle = { opacity: frontOpacity };

    return (
      <LinearGradient colors={theme.gradients.background} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <Toast message={error} isVisible={!!error} onClose={() => setError('')} />
          <ScrollView contentContainerStyle={styles.playingContainer}>
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
                {currentPlayerId && isPlayerMVP(currentPlayerId) && (
                  <Text style={styles.mvpBadge}>👑</Text>
                )}
                <Text style={styles.playingTurnText}>
                  {isCurrentTeam ? 'Tu turno' : `Equipo ${game.currentTeam}`}
                </Text>
                {currentPlayerId && (
                  <Text style={styles.playingStats}>
                    ✓{getPlayerStats(currentPlayerId).hits} ✗{getPlayerStats(currentPlayerId).fails}
                  </Text>
                )}
              </View>
              <View style={[styles.timerCircle, { backgroundColor: getCurrentTimeLeft() <= 10 ? theme.colors.danger : theme.colors.primary }]}>
                <Text style={styles.timerText}>{getCurrentTimeLeft()}s</Text>
              </View>
            </View>

            <View style={styles.roundInfoBar}>
              <Text style={styles.roundInfoText}>
                Ronda {game.currentRound} • {roundRules[game.currentRound]}
              </Text>
            </View>

            <View style={styles.scoresRow}>
              <View style={[styles.scoreCard, game.currentTeam === 1 && styles.scoreCardActive]}>
                <Text style={styles.scoreLabel}>E1</Text>
                <Text style={styles.scoreValue}>{team1Score}</Text>
              </View>
              <View style={[styles.scoreCard, game.currentTeam === 2 && styles.scoreCardActive]}>
                <Text style={styles.scoreLabel}>E2</Text>
                <Text style={styles.scoreValue}>{team2Score}</Text>
              </View>
            </View>

            {isCurrentTeam ? (
              <View style={styles.cardWrapper}>
                <TouchableOpacity
                  activeOpacity={1}
                  onPressIn={() => setIsCardPressed(true)}
                  onPressOut={() => setIsCardPressed(false)}
                  style={styles.cardContainer}
                >
                  <Animated.View style={[styles.cardFace, styles.cardBack, backAnimatedStyle]}>
                    <LinearGradient
                      colors={['#ff66ff', '#cc00cc', '#990099']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.cardGradient}
                    >
                      <View style={styles.cardBackContent}>
                        <Image source={require('../../assets/img/logo-personajes.png')} style={styles.cardLogo} />
                        <Text style={styles.cardInstruction}>MANTÉN PRESIONADO</Text>
                        <Text style={styles.cardInstructionSubtitle}>para ver el personaje</Text>
                      </View>
                    </LinearGradient>
                  </Animated.View>
                  <Animated.View style={[styles.cardFace, styles.cardFront, frontAnimatedStyle]}>
                    <LinearGradient
                      colors={['#ff66ff', '#cc00cc', '#990099']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.cardGradient}
                    >
                      <Text style={styles.characterName}>
                        {currentCharacter ? String(currentCharacter).toUpperCase() : 'SIN TARJETAS'}
                      </Text>
                    </LinearGradient>
                  </Animated.View>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.hiddenCard}>
                <Text style={styles.hiddenCardText}>???</Text>
              </View>
            )}

            <Text style={styles.charactersRemaining}>
              {availableCharacters.length} personajes restantes
            </Text>

            {isCurrentTeam ? (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.actionButtonContainerFail}
                  onPress={handleFail}
                  activeOpacity={0.8}
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
                  style={styles.actionButtonContainerSuccess}
                  onPress={handleHit}
                  activeOpacity={0.8}
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
            ) : (
              <Card style={styles.waitTurnCard}>
                <Text style={styles.waitTurnTitle}>Espera tu turno...</Text>
                <Text style={styles.waitTurnText}>El equipo {game.currentTeam} está jugando</Text>
              </Card>
            )}

            {isCurrentTeam && (
              <View style={styles.playingActions}>
                <TouchableOpacity onPress={togglePause} style={styles.actionLink}>
                  <Text style={styles.actionLinkText}>
                    {game.timer?.isPaused ? '▶ Reanudar' : '⏸ Pausar'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowExitModal(true)} style={styles.actionLink}>
                  <Text style={styles.actionLinkText}>🚪 Salir del Juego</Text>
                </TouchableOpacity>
              </View>
            )}
            {!isCurrentTeam && (
              <TouchableOpacity onPress={() => setShowExitModal(true)} style={styles.actionLink}>
                <Text style={styles.actionLinkText}>🚪 Salir del Juego</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  function renderFinished() {
    return (
      <LinearGradient colors={theme.gradients.background} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.finishedContainer}>
            <Text style={styles.finishedTrophy}>🏆</Text>
            <Text style={styles.finishedTitle}>¡Juego Terminado!</Text>
            
            <View style={styles.finishedScores}>
              <View style={[styles.finishedScoreCard, team1Score > team2Score && styles.finishedScoreCardWinner]}>
                <Text style={styles.finishedScoreLabel}>Equipo 1</Text>
                <Text style={styles.finishedScoreValue}>{team1Score}</Text>
              </View>
              <Text style={styles.finishedScoresVS}>vs</Text>
              <View style={[styles.finishedScoreCard, team2Score > team1Score && styles.finishedScoreCardWinner]}>
                <Text style={styles.finishedScoreLabel}>Equipo 2</Text>
                <Text style={styles.finishedScoreValue}>{team2Score}</Text>
              </View>
            </View>

            <Text style={styles.finishedWinner}>
              {team1Score > team2Score ? '🎉 ¡Equipo 1 Gana!' : team2Score > team1Score ? '🎉 ¡Equipo 2 Gana!' : '🤝 ¡Empate!'}
            </Text>

            <Card style={styles.statsCard}>
              <Text style={styles.statsTitle}>📊 Estadísticas de Jugadores</Text>
              {getPlayerRanking().map((player, index) => {
                const playerId = typeof player.user === 'object' ? player.user.id : player.user;
                const playerName = typeof player.user === 'object' ? player.user.username : 'Jugador';
                const stats = getPlayerStats(playerId);
                const isFirst = index === 0 && stats.hits > 0;
                return (
                  <View
                    key={playerId}
                    style={[styles.statsRow, isFirst && styles.statsRowFirst]}
                  >
                    <Text style={styles.statsRank}>#{index + 1}</Text>
                    <View style={styles.statsPlayerInfo}>
                      <View style={styles.statsPlayerNameRow}>
                        <Text style={styles.statsPlayerName}>{capitalize(playerName)}</Text>
                        {isFirst && <Text style={styles.statsMVP}>👑</Text>}
                      </View>
                      <Text style={styles.statsPlayerTeam}>Equipo {player.team}</Text>
                    </View>
                    <View style={styles.statsNumbers}>
                      <Text style={styles.statsHits}>✓ {stats.hits}</Text>
                      <Text style={styles.statsFails}>✗ {stats.fails}</Text>
                    </View>
                  </View>
                );
              })}
            </Card>

            <Button 
              title="Volver al Dashboard" 
              onPress={() => router.push('/dashboard')} 
              size="large" 
              style={styles.backButton}
            />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorCard: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  errorTitle: {
    color: theme.colors.danger,
    fontSize: 18,
    fontFamily: 'Truculenta-Bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  roundIntroContainer: {
    flexGrow: 1,
    padding: 32,
    justifyContent: 'space-between',
  },
  roundIntroHeader: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  roundIntroContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeBadge: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  timeBadgeText: {
    color: theme.colors.text,
    fontSize: 18,
    fontFamily: 'Truculenta-Bold',
  },
  roundBadge: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginBottom: 24,
  },
  roundBadgeText: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: 'Truculenta-Bold',
    letterSpacing: 2,
  },
  roundIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  roundTitle: {
    color: theme.colors.text,
    fontSize: 42,
    fontFamily: 'Truculenta-Bold',
    marginBottom: 16,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  roundDescription: {
    color: theme.colors.textSecondary,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 26,
    maxWidth: 600,
  },
  roundTipsCard: {
    width: '100%',
    maxWidth: 600,
    marginBottom: 24,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipBullet: {
    color: theme.colors.primary,
    fontSize: 18,
    fontFamily: 'Truculenta-Bold',
    marginRight: 12,
  },
  tipText: {
    color: theme.colors.text,
    fontSize: 15,
    flex: 1,
    lineHeight: 22,
  },
  activePlayerCard: {
    width: '100%',
    maxWidth: 600,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
    padding: 20,
  },
  activePlayerLabel: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  activePlayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
  },
  activePlayerAvatar: {
    fontSize: 40,
  },
  activePlayerName: {
    color: theme.colors.text,
    fontSize: 24,
    fontFamily: 'Truculenta-Bold',
    textTransform: 'uppercase',
  },
  roundIntroActions: {
    width: '100%',
    gap: 8,
  },
  continueButton: {
    marginHorizontal: 24,
    marginBottom: 8,
  },
  exitLink: {
    padding: 8,
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 32,
  },
  exitLinkText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  waitingForPlayer: {
    alignItems: 'center',
    padding: 24,
  },
  waitingText: {
    color: theme.colors.textMuted,
    fontSize: 16,
    marginBottom: 8,
  },
  waitingIcon: {
    fontSize: 32,
  },
  currentScores: {
    alignItems: 'center',
    marginTop: 8,
  },
  currentScoresLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  currentScoresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  currentScoreItem: {
    alignItems: 'center',
  },
  currentScoreLabel: {
    color: theme.colors.primary,
    fontSize: 12,
    fontFamily: 'Truculenta-Bold',
    marginBottom: 4,
  },
  currentScoreValue: {
    color: theme.colors.text,
    fontSize: 32,
    fontFamily: 'Truculenta-Bold',
  },
  currentScoresVS: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  waitingForPlayerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  waitingForPlayerCard: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  waitingRoundLabel: {
    color: theme.colors.primary,
    fontSize: 18,
    fontFamily: 'Truculenta-Bold',
    marginBottom: 4,
  },
  waitingRoundRule: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  waitingDivider: {
    width: '100%',
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 16,
  },
  waitingTurnLabel: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginBottom: 24,
  },
  mvpIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  waitingPlayerName: {
    color: theme.colors.text,
    fontSize: 32,
    fontFamily: 'Truculenta-Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  waitingPlayerStats: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginBottom: 12,
  },
  waitingTeamBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  waitingTeamText: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: 'Truculenta-Bold',
  },
  waitingScores: {
    flexDirection: 'row',
    gap: 48,
    marginTop: 24,
    justifyContent: 'center',
  },
  waitingScoreItem: {
    alignItems: 'center',
  },
  waitingScoreLabel: {
    color: theme.colors.primary,
    fontSize: 12,
    marginBottom: 4,
  },
  waitingScoreValue: {
    color: theme.colors.text,
    fontSize: 28,
    fontFamily: 'Truculenta-Bold',
  },
  readyButton: {
    marginTop: 24,
    width: '100%',
  },
  waitingContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  waitingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12,
  },
  waitingRoomCode: {
    color: theme.colors.text,
    fontFamily: 'Truculenta-Bold',
    fontSize: 20,
    textTransform: 'uppercase',
  },
  waitingHeaderActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '15',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  categoryBannerIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  categoryBannerInfo: {
    flex: 1,
  },
  categoryBannerName: {
    color: theme.colors.primary,
    fontSize: 16,
    fontFamily: 'Truculenta-Bold',
    textTransform: 'uppercase',
  },
  categoryBannerCount: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  avatarSection: {
    marginBottom: 24,
  },
  confirmButton: {
    width: '100%',
    marginTop: 16,
  },
  playersSection: {
    marginBottom: 24,
  },
  playersTitle: {
    color: theme.colors.text,
    fontFamily: 'Truculenta-Bold',
    fontSize: 18,
    textTransform: 'uppercase',
    marginBottom: 16,
    textAlign: 'center',
  },
  playersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  playerCard: {
    width: '31%',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  playerCardMe: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
  },
  playerAvatar: {
    fontSize: 48,
    marginBottom: 8,
  },
  playerName: {
    color: theme.colors.text,
    fontSize: 14,
    fontFamily: 'Truculenta-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.05,
    textAlign: 'center',
  },
  hostLabel: {
    fontSize: 10,
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.05,
    marginTop: 4,
  },
  charactersFormSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  charactersFormTitle: {
    color: theme.colors.text,
    fontFamily: 'Truculenta-Bold',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  submitButton: {
    marginTop: 12,
    width: '100%',
  },
  myCharactersSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  myCharactersLabel: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  myCharactersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  characterTag: {
    backgroundColor: theme.colors.primary + '20',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
  },
  characterTagText: {
    color: theme.colors.primaryLight,
    fontSize: 14,
    fontFamily: 'Truculenta-Bold',
  },
  waitingStatus: {
    marginTop: 24,
    alignItems: 'center',
  },
  waitingStatusText: {
    color: theme.colors.textMuted,
    fontSize: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.1,
  },
  waitingCharactersCount: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginBottom: 16,
  },
  startButton: {
    marginTop: 24,
    width: '100%',
  },
  playingContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  playingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  playingHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mvpBadge: {
    fontSize: 16,
  },
  playingTurnText: {
    color: theme.colors.text,
    fontSize: 18,
    fontFamily: 'Truculenta-Bold',
  },
  playingStats: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  timerCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    color: theme.colors.text,
    fontSize: 18,
    fontFamily: 'Truculenta-Bold',
  },
  roundInfoBar: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  roundInfoText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  scoresRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 16,
  },
  scoreCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 0,
  },
  scoreCardActive: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  scoreLabel: {
    color: theme.colors.primary,
    fontSize: 12,
    fontFamily: 'Truculenta-Bold',
    marginBottom: 4,
  },
  scoreValue: {
    color: theme.colors.text,
    fontSize: 24,
    fontFamily: 'Truculenta-Bold',
  },
  cardWrapper: {
    width: '100%',
    marginBottom: 16,
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
  cardBack: {
    zIndex: 1,
  },
  cardFront: {
    zIndex: 0,
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
  hiddenCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.primary,
    marginBottom: 16,
  },
  hiddenCardText: {
    color: theme.colors.text,
    fontSize: 32,
    fontFamily: 'Truculenta-Bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
  charactersRemaining: {
    color: theme.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
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
    minHeight: 70,
  },
  actionIcon: {
    fontSize: 32,
    fontFamily: 'Truculenta-Bold',
    color: '#ffffff',
    textShadowColor: '#000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 14,
    fontFamily: 'Truculenta-Bold',
    color: '#ffffff',
    letterSpacing: 0.08,
    textTransform: 'uppercase',
    textShadowColor: '#000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
  },
  waitTurnCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  waitTurnTitle: {
    color: theme.colors.textMuted,
    fontSize: 18,
    fontFamily: 'Truculenta-Bold',
    marginBottom: 4,
  },
  waitTurnText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  playingActions: {
    flexDirection: 'column',
    gap: 8,
  },
  actionLink: {
    padding: 8,
    alignItems: 'center',
  },
  actionLinkText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  finishedContainer: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  finishedTrophy: {
    fontSize: 56,
    marginBottom: 8,
  },
  finishedTitle: {
    color: theme.colors.text,
    fontSize: 26,
    fontFamily: 'Truculenta-Bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  finishedScores: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 16,
    width: '100%',
  },
  finishedScoreCard: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 0,
  },
  finishedScoreCardWinner: {
    borderWidth: 2,
    borderColor: theme.colors.warning,
  },
  finishedScoreLabel: {
    color: theme.colors.primary,
    fontSize: 14,
    marginBottom: 4,
  },
  finishedScoreValue: {
    color: theme.colors.text,
    fontSize: 40,
    fontFamily: 'Truculenta-Bold',
  },
  finishedScoresVS: {
    color: theme.colors.textMuted,
    fontSize: 16,
  },
  finishedWinner: {
    color: theme.colors.text,
    fontSize: 22,
    fontFamily: 'Truculenta-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  statsCard: {
    marginBottom: 16,
    width: '100%',
  },
  statsTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: 'Truculenta-Bold',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statsRowFirst: {
    backgroundColor: theme.colors.surfaceLight,
    paddingLeft: 16,
    paddingRight: 16,
    marginLeft: -16,
    marginRight: -16,
    borderRadius: 8,
  },
  statsRank: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontFamily: 'Truculenta-Bold',
    width: 30,
  },
  statsPlayerInfo: {
    flex: 1,
  },
  statsPlayerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statsPlayerName: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: 'Truculenta-Bold',
  },
  statsMVP: {
    fontSize: 14,
  },
  statsPlayerTeam: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  statsNumbers: {
    flexDirection: 'row',
    gap: 12,
  },
  statsHits: {
    color: theme.colors.success,
    fontSize: 14,
    fontFamily: 'Truculenta-Bold',
  },
  statsFails: {
    color: theme.colors.danger,
    fontSize: 14,
    fontFamily: 'Truculenta-Bold',
  },
  backButton: {
    width: '100%',
    marginTop: 16,
  },
});

