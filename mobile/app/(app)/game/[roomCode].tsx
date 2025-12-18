import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  StyleSheet,
  Animated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../../../src/context/AuthContext';
import { api } from '../../../src/services/api';
import { socketService } from '../../../src/services/socket';
import { Button, Input, Card, Modal } from '../../../src/components';
import { Game, PlayerStats } from '../../../src/types';
import { colors } from '../../../src/theme';

export default function GameRoomScreen() {
  const { roomCode } = useLocalSearchParams<{ roomCode: string }>();
  const { user } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playerCharacters, setPlayerCharacters] = useState<string[]>(['', '']);
  const [submittingCharacters, setSubmittingCharacters] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cardScale = useRef(new Animated.Value(1)).current;
  const [showExitModal, setShowExitModal] = useState(false);

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

  useEffect(() => {
    if (roomCode) {
      joinGame();
      connectSocket();
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

  useEffect(() => {
    if (game && game.status === 'playing' && !game.timer?.isPaused && !game.waitingForPlayer && !game.showingRoundIntro) {
      startTimer();
    } else {
      stopTimer();
    }
    return () => stopTimer();
  }, [game?.status, game?.timer?.isPaused, game?.waitingForPlayer, game?.showingRoundIntro]);

  const connectSocket = () => {
    socketService.connect();
    if (roomCode) socketService.joinGame(roomCode);
    socketService.onGameUpdated(() => fetchGame());
  };

  const joinGame = async (characters: string[] | null = null) => {
    try {
      const response = await api.joinGame(roomCode!, characters || undefined);
      setGame(response.game);
      setTimeLeft(response.game.timer?.timeLeft || response.game.timePerRound);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al unirse');
      setLoading(false);
    }
  };

  const fetchGame = async () => {
    try {
      const response = await api.getGame(roomCode!);
      setGame(response.game);
      if (response.game.timer) setTimeLeft(response.game.timer.timeLeft);
    } catch (err) {
      console.error('Error fetching game:', err);
    }
  };

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { stopTimer(); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const handleCharacterChange = (index: number, value: string) => {
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
      socketService.emitGameUpdate(roomCode!);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error');
    } finally {
      setSubmittingCharacters(false);
    }
  };

  const animateCard = () => {
    Animated.sequence([
      Animated.spring(cardScale, { toValue: 0.95, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  const handleHit = async () => {
    animateCard();
    try {
      const response = await api.hitCharacter(roomCode!);
      setGame(response.game);
      socketService.emitGameUpdate(roomCode!);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error');
    }
  };

  const handleFail = async () => {
    animateCard();
    try {
      const response = await api.failCharacter(roomCode!);
      setGame(response.game);
      socketService.emitGameUpdate(roomCode!);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error');
    }
  };

  const handlePlayerReady = async () => {
    try {
      const response = await api.playerReady(roomCode!);
      setGame(response.game);
      setTimeLeft(response.game.timePerRound);
      socketService.emitGameUpdate(roomCode!);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error');
    }
  };

  const handleRoundIntroSeen = async () => {
    try {
      const response = await api.roundIntroSeen(roomCode!);
      setGame(response.game);
      socketService.emitGameUpdate(roomCode!);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error');
    }
  };

  const handleStart = async () => {
    try {
      const response = await api.startGame(roomCode!);
      setGame(response.game);
      setTimeLeft(response.game.timePerRound);
      socketService.emitGameUpdate(roomCode!);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar');
    }
  };

  const togglePause = async () => {
    try {
      await api.updateTimer(roomCode!, !game?.timer?.isPaused);
      fetchGame();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const shareRoomCode = async () => {
    try {
      await Share.share({ message: `¡Únete a mi partida de Personajes! Código: ${roomCode}` });
    } catch (err) {}
  };

  // Helpers para estadísticas y MVP
  const getPlayerStats = (playerId: string): PlayerStats => {
    return game?.playerStats?.[playerId] || { hits: 0, fails: 0 };
  };

  const getMVP = () => {
    if (!game?.playerStats) return null;
    let maxHits = 0;
    let mvpId: string | null = null;
    
    Object.entries(game.playerStats).forEach(([id, stats]) => {
      if (stats.hits > maxHits) {
        maxHits = stats.hits;
        mvpId = id;
      }
    });
    
    return mvpId;
  };

  const isPlayerMVP = (playerId: string) => {
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

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando partida...</Text>
      </SafeAreaView>
    );
  }

  if (error && !game) {
    return (
      <SafeAreaView style={styles.errorScreen}>
        <Card style={styles.errorCard}>
          <Text style={styles.errorTitle}>{error}</Text>
          <Button title="Volver" onPress={() => router.replace('/(app)/dashboard')} />
        </Card>
      </SafeAreaView>
    );
  }

  if (!game) return null;

  const isHost = (typeof game.host === 'object' ? (game.host as any)._id || game.host.id : game.host) === user?.id;
  const currentPlayer = game.players.find((p) => (typeof p.user === 'object' ? p.user.id : p.user) === user?.id);
  const currentPlayerId = typeof currentPlayer?.user === 'object' ? currentPlayer?.user.id : currentPlayer?.user;
  const isCurrentTeam = currentPlayer && currentPlayer.team === game.currentTeam;
  const team1Score = game.roundScores.round1.team1 + game.roundScores.round2.team1 + game.roundScores.round3.team1;
  const team2Score = game.roundScores.round1.team2 + game.roundScores.round2.team2 + game.roundScores.round3.team2;
  const playerCharactersData = game.playerCharacters || {};
  const usesCategory = (game as any).usesCategory || game.charactersPerPlayer === 0;
  const hasSubmittedCharacters = usesCategory || (currentPlayer && playerCharactersData[currentPlayerId as string]?.length > 0);
  const needsToSubmitCharacters = !usesCategory && currentPlayer && !hasSubmittedCharacters && game.status === 'waiting';
  const charsPerPlayer = game.charactersPerPlayer || 2;
  const totalCharactersNeeded = usesCategory ? 0 : (game.numPlayers || 4) * charsPerPlayer;
  const myCharacters = currentPlayerId ? playerCharactersData[currentPlayerId as string] || [] : [];
  const categoryInfo = (game as any).category;
  
  // Personajes disponibles (excluyendo bloqueados)
  const roundCharacters = game.roundCharacters || [];
  const blockedCharacters = game.blockedCharacters || [];
  const availableCharacters = roundCharacters.filter(c => !blockedCharacters.includes(c));
  const currentCharacter = availableCharacters.length > 0 
    ? availableCharacters[game.currentCharacterIndex % availableCharacters.length]
    : null;

  const handleExit = () => {
    socketService.leaveGame(roomCode!);
    socketService.disconnect();
    router.replace('/(app)/dashboard');
  };

  // ROUND INTRO SCREEN
  if (game.status === 'playing' && game.showingRoundIntro) {
    const roundInfo = roundDetails[game.currentRound];
    
    return (
      <SafeAreaView style={styles.roundIntroContainer}>
        <View style={styles.roundIntroContent}>
          <View style={styles.roundNumberBadge}>
            <Text style={styles.roundNumberText}>RONDA {game.currentRound}</Text>
          </View>

          <Text style={styles.roundIntroIcon}>{roundInfo.icon}</Text>
          <Text style={styles.roundIntroTitle}>{roundInfo.title}</Text>
          <Text style={styles.roundIntroDescription}>{roundInfo.description}</Text>

          <View style={styles.roundIntroTips}>
            {roundInfo.tips.map((tip, index) => (
              <View key={index} style={styles.tipRow}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          {game.currentRound > 1 && (
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
            title="¡Continuar!" 
            onPress={handleRoundIntroSeen} 
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

  // WAITING FOR PLAYER SCREEN
  if (game.status === 'playing' && game.waitingForPlayer && isCurrentTeam) {
    const myStats = currentPlayerId ? getPlayerStats(currentPlayerId) : { hits: 0, fails: 0 };
    const amMVP = currentPlayerId ? isPlayerMVP(currentPlayerId) : false;

    return (
      <SafeAreaView style={styles.waitingContainer}>
        <View style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
          <Button
            title="Salir"
            onPress={() => {
              Alert.alert(
                'Salir del Juego',
                '¿Estás seguro de que quieres salir del juego?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Salir',
                    style: 'destructive',
                    onPress: () => {
                      socketService.leaveGame(roomCode!);
                      socketService.disconnect();
                      router.replace('/(app)/dashboard');
                    },
                  },
                ]
              );
            }}
            variant="secondary"
            size="small"
          />
        </View>
        <Card style={styles.waitingCard}>
          <Text style={styles.waitingRound}>Ronda {game.currentRound}</Text>
          <Text style={styles.waitingRule}>{roundRules[game.currentRound]}</Text>
          
          <View style={styles.waitingDivider} />
          
          <Text style={styles.waitingLabel}>¡Es tu turno!</Text>
          {amMVP && <Text style={styles.waitingCrown}>👑</Text>}
          <Text style={styles.waitingPlayerName}>
            {typeof currentPlayer?.user === 'object' ? currentPlayer?.user.username : 'Jugador'}
          </Text>
          <Text style={styles.waitingPlayerStats}>
            ✓ {myStats.hits} aciertos • ✗ {myStats.fails} fallos
          </Text>
          <View style={[styles.waitingTeamBadge, game.currentTeam === 2 && styles.waitingTeamBadge2]}>
            <Text style={styles.waitingTeamText}>Equipo {game.currentTeam}</Text>
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

  // WAITING FOR OTHER PLAYER (not your turn)
  if (game.status === 'playing' && game.waitingForPlayer && !isCurrentTeam) {
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
          <Text style={styles.waitingRound}>Ronda {game.currentRound}</Text>
          <Text style={styles.waitingRule}>{roundRules[game.currentRound]}</Text>
          
          <View style={styles.waitingDivider} />
          
          <Text style={styles.waitingLabel}>Esperando al Equipo {game.currentTeam}...</Text>
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 24 }} />
          
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

        {/* Waiting for players */}
        {game.status === 'waiting' && (
          <Card>
            <View style={styles.codeRow}>
              <Text style={styles.codeLabel}>Código de Sala</Text>
              <TouchableOpacity onPress={shareRoomCode} style={styles.codeButton}>
                <Text style={styles.codeText}>{game.roomCode}</Text>
                <Text>📤</Text>
              </TouchableOpacity>
            </View>

            {/* Mostrar categoría si se usa */}
            {usesCategory && categoryInfo && (
              <View style={styles.categoryBanner}>
                <Text style={styles.categoryBannerIcon}>{categoryInfo.icon}</Text>
                <View style={styles.categoryBannerInfo}>
                  <Text style={styles.categoryBannerTitle}>Categoría: {categoryInfo.name}</Text>
                  <Text style={styles.categoryBannerChars}>{game.characters?.length || 0} personajes</Text>
                </View>
              </View>
            )}

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>Jugadores: {game.players.length} / {game.numPlayers || 4}</Text>
              {!usesCategory && (
                <Text style={styles.infoText}>Personajes: {game.characters?.length || 0} / {totalCharactersNeeded}</Text>
              )}
            </View>

            {needsToSubmitCharacters && (
              <View style={styles.charactersForm}>
                <Text style={styles.formTitle}>Ingresa tus {charsPerPlayer} personajes</Text>
                {Array(charsPerPlayer).fill(0).map((_, index) => (
                  <Input
                    key={index}
                    placeholder={`Personaje ${index + 1}`}
                    value={playerCharacters[index] || ''}
                    onChangeText={(value) => handleCharacterChange(index, value)}
                    editable={!submittingCharacters}
                  />
                ))}
                <Button title={submittingCharacters ? 'Enviando...' : 'Agregar'} onPress={handleSubmitCharacters} loading={submittingCharacters} />
              </View>
            )}

            {!usesCategory && !needsToSubmitCharacters && myCharacters.length > 0 && (
              <View style={styles.myCharsSection}>
                <Text style={styles.myCharsLabel}>Tus personajes:</Text>
                <View style={styles.myCharsRow}>
                  {myCharacters.map((char, i) => (
                    <View key={i} style={styles.charBadge}>
                      <Text style={styles.charBadgeText}>{char}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {!needsToSubmitCharacters && (
              <View style={styles.waitingSection}>
                <Text style={styles.waitingText}>Esperando jugadores...</Text>
                {isHost && (usesCategory || game.characters?.length >= totalCharactersNeeded) && game.players.length >= 2 && (
                  <Button title="Iniciar Partida" onPress={handleStart} size="large" style={{ marginTop: 16 }} />
                )}
              </View>
            )}
          </Card>
        )}

        {/* Playing */}
        {game.status === 'playing' && !game.waitingForPlayer && !game.showingRoundIntro && (
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
            <View style={styles.playerInfoBar}>
              <View style={styles.playerInfoText}>
                {currentPlayerId && isPlayerMVP(currentPlayerId) && <Text style={styles.crownSmall}>👑</Text>}
                <Text style={styles.playingPlayerName}>
                  {isCurrentTeam ? 'Tu turno' : `Equipo ${game.currentTeam}`}
                </Text>
                {currentPlayerId && (
                  <Text style={styles.playerMiniStats}>
                    ✓{getPlayerStats(currentPlayerId).hits} ✗{getPlayerStats(currentPlayerId).fails}
                  </Text>
                )}
              </View>
              <View style={[styles.timerBadge, timeLeft <= 10 && styles.timerBadgeDanger]}>
                <Text style={styles.timerBadgeText}>{timeLeft}s</Text>
              </View>
            </View>

            <View style={styles.roundInfoBar}>
              <Text style={styles.roundInfoText}>Ronda {game.currentRound} • {roundRules[game.currentRound]}</Text>
            </View>

            {/* Puntuaciones */}
            <View style={styles.scoresCompact}>
              <View style={[styles.scoreCompactItem, game.currentTeam === 1 && styles.scoreCompactActive]}>
                <Text style={styles.scoreCompactLabel}>E1</Text>
                <Text style={styles.scoreCompactValue}>{team1Score}</Text>
              </View>
              <View style={[styles.scoreCompactItem, game.currentTeam === 2 && styles.scoreCompactActive]}>
                <Text style={[styles.scoreCompactLabel, { color: colors.secondary }]}>E2</Text>
                <Text style={styles.scoreCompactValue}>{team2Score}</Text>
              </View>
            </View>

            {/* Tarjeta del personaje */}
            <Animated.View style={[styles.characterMainCard, { transform: [{ scale: cardScale }] }]}>
              <Text style={styles.characterMainName}>
                {isCurrentTeam ? (currentCharacter?.toUpperCase() || 'SIN TARJETAS') : '???'}
              </Text>
            </Animated.View>

            <Text style={styles.remainingText}>
              {availableCharacters.length} personajes restantes
            </Text>

            {isCurrentTeam ? (
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.failButton} onPress={handleFail} activeOpacity={0.8}>
                  <Text style={styles.actionIcon}>✗</Text>
                  <Text style={styles.actionLabel}>FALLO</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.hitButton} onPress={handleHit} activeOpacity={0.8}>
                  <Text style={styles.actionIcon}>✓</Text>
                  <Text style={styles.actionLabel}>ACIERTO</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Card style={styles.waitTurnCard}>
                <Text style={styles.waitTurnText}>Espera tu turno...</Text>
                <Text style={styles.waitTurnSubtext}>El equipo {game.currentTeam} está jugando</Text>
              </Card>
            )}

            {isCurrentTeam && (
              <View style={{ gap: 8 }}>
                <TouchableOpacity style={styles.pauseButton} onPress={togglePause}>
                  <Text style={styles.pauseText}>{game.timer?.isPaused ? '▶ Reanudar' : '⏸ Pausar'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pauseButton} onPress={() => setShowExitModal(true)}>
                  <Text style={styles.pauseText}>🚪 Salir del Juego</Text>
                </TouchableOpacity>
              </View>
            )}
            {!isCurrentTeam && (
              <TouchableOpacity style={styles.pauseButton} onPress={() => setShowExitModal(true)}>
                <Text style={styles.pauseText}>🚪 Salir del Juego</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Finished */}
        {game.status === 'finished' && (
          <>
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

            {/* Ranking de jugadores */}
            <Card style={styles.rankingCard}>
              <Text style={styles.rankingTitle}>📊 Estadísticas de Jugadores</Text>
              {getPlayerRanking().map((player, index) => {
                const playerId = typeof player.user === 'object' ? player.user.id : player.user;
                const playerName = typeof player.user === 'object' ? player.user.username : 'Jugador';
                const stats = getPlayerStats(playerId);
                const isFirst = index === 0 && stats.hits > 0;
                return (
                  <View key={playerId} style={[styles.rankingRow, isFirst && styles.rankingRowFirst]}>
                    <Text style={styles.rankingPosition}>#{index + 1}</Text>
                    <View style={styles.rankingInfo}>
                      <View style={styles.rankingNameRow}>
                        <Text style={styles.rankingName}>{playerName}</Text>
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

            <Button title="Volver al Dashboard" onPress={() => router.replace('/(app)/dashboard')} size="large" style={{ marginTop: 16 }} />
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.textMuted, marginTop: 16 },
  errorScreen: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorCard: { width: '100%', alignItems: 'center' },
  errorTitle: { color: colors.danger, fontSize: 18, marginBottom: 16 },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  errorBox: { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderRadius: 12, padding: 16, marginBottom: 16 },
  errorText: { color: colors.danger, textAlign: 'center' },
  
  // Waiting for players
  codeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  codeLabel: { color: colors.text, fontWeight: 'bold' },
  codeButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  codeText: { color: colors.text, fontWeight: 'bold', marginRight: 8 },
  categoryBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(14, 165, 233, 0.15)', borderRadius: 12, padding: 12, marginBottom: 16 },
  categoryBannerIcon: { fontSize: 32, marginRight: 12 },
  categoryBannerInfo: { flex: 1 },
  categoryBannerTitle: { color: colors.primary, fontSize: 16, fontWeight: 'bold' },
  categoryBannerChars: { color: colors.textMuted, fontSize: 12 },
  infoBox: { backgroundColor: colors.surfaceLight, borderRadius: 8, padding: 12, marginBottom: 16 },
  infoText: { color: colors.textMuted, fontSize: 14 },
  charactersForm: { marginTop: 16 },
  formTitle: { color: colors.text, fontWeight: 'bold', marginBottom: 12 },
  myCharsSection: { marginTop: 16 },
  myCharsLabel: { color: colors.textMuted, fontSize: 14, marginBottom: 8 },
  myCharsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  charBadge: { backgroundColor: 'rgba(14, 165, 233, 0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  charBadgeText: { color: colors.primaryLight, fontSize: 14 },
  waitingSection: { marginTop: 16 },
  waitingText: { color: colors.textMuted, textAlign: 'center' },

  // Player info bar
  playerInfoBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, padding: 12, marginBottom: 8 },
  playerInfoText: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  crownSmall: { fontSize: 16 },
  playingPlayerName: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  playerMiniStats: { color: colors.textMuted, fontSize: 12 },
  timerBadge: { backgroundColor: colors.primary, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  timerBadgeDanger: { backgroundColor: colors.danger },
  timerBadgeText: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  roundInfoBar: { backgroundColor: colors.surfaceLight, borderRadius: 8, padding: 8, alignItems: 'center', marginBottom: 16 },
  roundInfoText: { color: colors.textSecondary, fontSize: 13 },

  // Scores compact
  scoresCompact: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 16 },
  scoreCompactItem: { alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 12 },
  scoreCompactActive: { borderWidth: 2, borderColor: colors.primary },
  scoreCompactLabel: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  scoreCompactValue: { color: colors.text, fontSize: 24, fontWeight: 'bold' },

  // Character card
  characterMainCard: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 3, borderColor: colors.primary, marginBottom: 16 },
  characterMainName: { color: colors.text, fontSize: 32, fontWeight: 'bold', textAlign: 'center', letterSpacing: 1 },
  remainingText: { color: colors.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 16 },

  // Action buttons
  actionButtons: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  hitButton: { flex: 1, backgroundColor: colors.success, borderRadius: 16, paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
  failButton: { flex: 1, backgroundColor: colors.danger, borderRadius: 16, paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
  actionIcon: { color: colors.text, fontSize: 32, fontWeight: 'bold' },
  actionLabel: { color: colors.text, fontSize: 14, fontWeight: '700', marginTop: 4 },
  pauseButton: { alignItems: 'center', padding: 8 },
  pauseText: { color: colors.textMuted, fontSize: 14 },

  // Wait turn card
  waitTurnCard: { alignItems: 'center', paddingVertical: 24 },
  waitTurnText: { color: colors.textMuted, fontSize: 18, fontWeight: '600' },
  waitTurnSubtext: { color: colors.textMuted, fontSize: 14, marginTop: 4 },

  // Round intro
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

  // Waiting screen
  waitingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', paddingHorizontal: 24 },
  waitingCard: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 },
  waitingRound: { color: colors.primary, fontSize: 18, fontWeight: '600', marginBottom: 4 },
  waitingRule: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 16 },
  waitingDivider: { width: '100%', height: 1, backgroundColor: colors.border, marginVertical: 16 },
  waitingLabel: { color: colors.textMuted, fontSize: 14, marginBottom: 8 },
  waitingCrown: { fontSize: 32, marginBottom: 4 },
  waitingPlayerName: { color: colors.text, fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  waitingPlayerStats: { color: colors.textMuted, fontSize: 13, marginBottom: 12 },
  waitingTeamBadge: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  waitingTeamBadge2: { backgroundColor: colors.secondary },
  waitingTeamText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  waitingScores: { flexDirection: 'row', gap: 48, marginTop: 24 },
  waitingScoreItem: { alignItems: 'center' },
  waitingScoreLabel: { color: colors.primary, fontSize: 12 },
  waitingScoreValue: { color: colors.text, fontSize: 28, fontWeight: 'bold' },

  // Finished screen
  winnerSection: { alignItems: 'center', marginBottom: 24 },
  trophyIcon: { fontSize: 56, marginBottom: 8 },
  finishedTitle: { color: colors.text, fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
  finalScoresRow: { flexDirection: 'row', alignItems: 'center', gap: 24, marginBottom: 16 },
  finalScore: { alignItems: 'center', padding: 16, borderRadius: 16, backgroundColor: colors.surface },
  winnerTeamHighlight: { borderWidth: 2, borderColor: colors.warning },
  finalTeamLabel: { color: colors.primary, fontSize: 14, marginBottom: 4 },
  finalScoreValue: { color: colors.text, fontSize: 40, fontWeight: 'bold' },
  vsText: { color: colors.textMuted, fontSize: 16 },
  winnerText: { fontSize: 22, marginBottom: 8 },

  // Ranking
  rankingCard: { marginBottom: 16 },
  rankingTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  rankingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  rankingRowFirst: { backgroundColor: colors.surfaceLight, marginHorizontal: -16, paddingHorizontal: 16, borderRadius: 8, borderBottomWidth: 0 },
  rankingPosition: { color: colors.textMuted, fontSize: 14, fontWeight: 'bold', width: 30 },
  rankingInfo: { flex: 1 },
  rankingNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rankingName: { color: colors.text, fontSize: 16, fontWeight: '600' },
  rankingCrown: { fontSize: 14 },
  rankingTeam: { color: colors.textMuted, fontSize: 12 },
  rankingStats: { flexDirection: 'row', gap: 12 },
  rankingHits: { color: colors.success, fontSize: 14, fontWeight: 'bold' },
  rankingFails: { color: colors.danger, fontSize: 14, fontWeight: 'bold' },

  exitButton: { marginTop: 16 },
});
