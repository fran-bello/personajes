import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card, Modal } from './index';
import { colors } from '../theme';

function GameRoom() {
  const { roomCode } = useParams();
  const { user } = useAuth();
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

  const joinGame = async (characters = null) => {
    try {
      const response = await api.joinGame(roomCode, characters || undefined);
      setGame(response.game);
      setTimeLeft(response.game.timer?.timeLeft || response.game.timePerRound);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al unirse');
      setLoading(false);
    }
  };

  const fetchGame = async () => {
    try {
      const response = await api.getGame(roomCode);
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
    animateCard();
    try {
      const response = await api.hitCharacter(roomCode);
      setGame(response.game);
      socketService.emitGameUpdate(roomCode);
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    }
  };

  const handleFail = async () => {
    animateCard();
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
      setTimeLeft(response.game.timePerRound);
      socketService.emitGameUpdate(roomCode);
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    }
  };

  const handleRoundIntroSeen = async () => {
    try {
      const response = await api.roundIntroSeen(roomCode);
      setGame(response.game);
      socketService.emitGameUpdate(roomCode);
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    }
  };

  const handleStart = async () => {
    try {
      const response = await api.startGame(roomCode);
      setGame(response.game);
      setTimeLeft(response.game.timePerRound);
      socketService.emitGameUpdate(roomCode);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar');
    }
  };

  const togglePause = async () => {
    try {
      await api.updateTimer(roomCode, !game?.timer?.isPaused);
      fetchGame();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const shareRoomCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Únete a mi partida',
          text: `¡Únete a mi partida de Personajes! Código: ${roomCode}`,
        });
      } catch (err) {}
    } else {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(roomCode);
      alert(`Código copiado: ${roomCode}`);
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
          <Button title="Volver" onClick={() => navigate('/dashboard')} />
        </Card>
      </div>
    );
  }

  if (!game) return null;

  const isHost = (typeof game.host === 'object' ? (game.host.id || game.host._id) : game.host) === user?.id;
  const currentPlayer = game.players.find((p) => (typeof p.user === 'object' ? p.user.id : p.user) === user?.id);
  const currentPlayerId = typeof currentPlayer?.user === 'object' ? currentPlayer?.user.id : currentPlayer?.user;
  const isCurrentTeam = currentPlayer && currentPlayer.team === game.currentTeam;
  const team1Score = game.roundScores.round1.team1 + game.roundScores.round2.team1 + game.roundScores.round3.team1;
  const team2Score = game.roundScores.round1.team2 + game.roundScores.round2.team2 + game.roundScores.round3.team2;
  const playerCharactersData = game.playerCharacters || {};
  const usesCategory = game.usesCategory || game.charactersPerPlayer === 0;
  const hasSubmittedCharacters = usesCategory || (currentPlayer && playerCharactersData[currentPlayerId]?.length > 0);
  const needsToSubmitCharacters = !usesCategory && currentPlayer && !hasSubmittedCharacters && game.status === 'waiting';
  const charsPerPlayer = game.charactersPerPlayer || 2;
  const totalCharactersNeeded = usesCategory ? 0 : (game.numPlayers || 4) * charsPerPlayer;
  const myCharacters = currentPlayerId ? playerCharactersData[currentPlayerId] || [] : [];
  const categoryInfo = game.category;

  // Personajes disponibles
  const roundCharacters = game.roundCharacters || [];
  const blockedCharacters = game.blockedCharacters || [];
  const availableCharacters = roundCharacters.filter(c => !blockedCharacters.includes(c));
  const currentCharacter = availableCharacters.length > 0
    ? availableCharacters[game.currentCharacterIndex % availableCharacters.length]
    : null;

  // ROUND INTRO SCREEN
  if (game.status === 'playing' && game.showingRoundIntro) {
    const roundInfo = roundDetails[game.currentRound];

    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'transparent', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '32px' }}>
        <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}>
          <Button
            title="Salir"
            onClick={() => {
              if (window.confirm('¿Estás seguro de que quieres salir del juego?')) {
                socketService.leaveGame(roomCode);
                socketService.disconnect();
                navigate('/dashboard');
              }
            }}
            variant="secondary"
            size="small"
          />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: colors.primary, padding: '8px 24px', borderRadius: '20px', marginBottom: '24px' }}>
            <span style={{ color: colors.text, fontSize: '16px', fontWeight: 'bold', letterSpacing: '2px' }}>
              RONDA {game.currentRound}
            </span>
          </div>

          <div style={{ fontSize: '80px', marginBottom: '16px' }}>{roundInfo.icon}</div>
          <h1 style={{ color: colors.text, fontSize: '42px', fontWeight: 'bold', marginBottom: '16px', letterSpacing: '2px' }}>
            {roundInfo.title}
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: '18px', textAlign: 'center', marginBottom: '32px', lineHeight: '26px', maxWidth: '600px' }}>
            {roundInfo.description}
          </p>

          <Card style={{ width: '100%', maxWidth: '600px', marginBottom: '24px' }}>
            {roundInfo.tips.map((tip, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{ color: colors.primary, fontSize: '18px', fontWeight: 'bold', marginRight: '12px' }}>•</span>
                <p style={{ color: colors.text, fontSize: '15px', flex: 1, lineHeight: '22px', margin: 0 }}>{tip}</p>
              </div>
            ))}
          </Card>

          {game.currentRound > 1 && (
            <div style={{ alignItems: 'center', marginTop: '8px' }}>
              <p style={{ color: colors.textMuted, fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Puntuación actual
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ alignItems: 'center' }}>
                  <p style={{ color: colors.primary, fontSize: '12px', fontWeight: '600' }}>Equipo 1</p>
                  <p style={{ color: colors.text, fontSize: '32px', fontWeight: 'bold' }}>{team1Score}</p>
                </div>
                <span style={{ color: colors.textMuted, fontSize: '14px' }}>vs</span>
                <div style={{ alignItems: 'center' }}>
                  <p style={{ color: colors.secondary, fontSize: '12px', fontWeight: '600' }}>Equipo 2</p>
                  <p style={{ color: colors.text, fontSize: '32px', fontWeight: 'bold' }}>{team2Score}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Button
            title="¡Continuar!"
            onClick={handleRoundIntroSeen}
            size="large"
            style={{ marginHorizontal: '24px', marginBottom: '8px' }}
          />
          <button
            onClick={() => setShowExitModal(true)}
            style={{
              width: 'calc(100% - 48px)',
              margin: '0 24px 32px 24px',
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
      </div>
    );
  }

  // WAITING FOR PLAYER SCREEN (tu turno)
  if (game.status === 'playing' && game.waitingForPlayer && isCurrentTeam) {
    const myStats = currentPlayerId ? getPlayerStats(currentPlayerId) : { hits: 0, fails: 0 };
    const amMVP = currentPlayerId ? isPlayerMVP(currentPlayerId) : false;

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

          <p style={{ color: colors.textMuted, fontSize: '14px', marginBottom: '8px' }}>¡Es tu turno!</p>
          {amMVP && <div style={{ fontSize: '32px', marginBottom: '4px' }}>👑</div>}
          <h2 style={{ color: colors.text, fontSize: '32px', fontWeight: 'bold', textAlign: 'center', marginBottom: '4px' }}>
            {typeof currentPlayer?.user === 'object' ? currentPlayer?.user.username : 'Jugador'}
          </h2>
          <p style={{ color: colors.textMuted, fontSize: '13px', marginBottom: '12px' }}>
            ✓ {myStats.hits} aciertos • ✗ {myStats.fails} fallos
          </p>
          <div style={{
            backgroundColor: game.currentTeam === 1 ? colors.primary : colors.secondary,
            padding: '8px 20px',
            borderRadius: '20px',
            display: 'inline-block',
            marginBottom: '24px',
          }}>
            <span style={{ color: colors.text, fontSize: '16px', fontWeight: '600' }}>
              Equipo {game.currentTeam}
            </span>
          </div>

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

          <Button
            title="¡Estoy Listo!"
            onClick={handlePlayerReady}
            size="large"
            style={{ marginTop: '24px', width: '100%' }}
          />
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
        </Card>
      </div>
    );
  }

  // WAITING FOR OTHER PLAYER (not your turn)
  if (game.status === 'playing' && game.waitingForPlayer && !isCurrentTeam) {
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

          <p style={{ color: colors.textMuted, fontSize: '14px', marginBottom: '24px' }}>
            Esperando al Equipo {game.currentTeam}...
          </p>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ color: colors.text, fontWeight: 'bold' }}>Código de Sala</span>
            <button
              onClick={shareRoomCode}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: colors.primary,
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                color: colors.text,
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              <span>{game.roomCode}</span>
              <span>📤</span>
            </button>
          </div>

          {/* Mostrar categoría si se usa */}
          {usesCategory && categoryInfo && (
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: `${colors.primary}15`, borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '32px', marginRight: '12px' }}>{categoryInfo.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ color: colors.primary, fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
                  Categoría: {categoryInfo.name}
                </p>
                <p style={{ color: colors.textMuted, fontSize: '12px', margin: 0 }}>
                  {game.characters?.length || 0} personajes
                </p>
              </div>
            </div>
          )}

          <div style={{ backgroundColor: colors.surfaceLight, borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
            <p style={{ color: colors.textMuted, fontSize: '14px', margin: '0 0 4px 0' }}>
              Jugadores: {game.players.length} / {game.numPlayers || 4}
            </p>
            {!usesCategory && (
              <p style={{ color: colors.textMuted, fontSize: '14px', margin: 0 }}>
                Personajes: {game.characters?.length || 0} / {totalCharactersNeeded}
              </p>
            )}
          </div>

          {needsToSubmitCharacters && (
            <div style={{ marginTop: '16px' }}>
              <h3 style={{ color: colors.text, fontWeight: 'bold', marginBottom: '12px' }}>
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
                style={{ marginTop: '12px' }}
              />
            </div>
          )}

          {!usesCategory && !needsToSubmitCharacters && myCharacters.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <p style={{ color: colors.textMuted, fontSize: '14px', marginBottom: '8px' }}>Tus personajes:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {myCharacters.map((char, i) => (
                  <span
                    key={i}
                    style={{
                      backgroundColor: `${colors.primary}20`,
                      padding: '4px 12px',
                      borderRadius: '20px',
                      color: colors.primaryLight,
                      fontSize: '14px',
                    }}
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!needsToSubmitCharacters && (
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <p style={{ color: colors.textMuted }}>Esperando jugadores...</p>
              {isHost && (usesCategory || game.characters?.length >= totalCharactersNeeded) && game.players.length >= 2 && (
                <Button title="Iniciar Partida" onClick={handleStart} size="large" style={{ marginTop: '16px' }} />
              )}
            </div>
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
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: colors.surface, borderRadius: '16px', padding: '12px', marginBottom: '8px' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {currentPlayerId && isPlayerMVP(currentPlayerId) && <span style={{ fontSize: '16px' }}>👑</span>}
              <span style={{ color: colors.text, fontSize: '18px', fontWeight: 'bold' }}>
                {isCurrentTeam ? 'Tu turno' : `Equipo ${game.currentTeam}`}
              </span>
              {currentPlayerId && (
                <span style={{ color: colors.textMuted, fontSize: '12px' }}>
                  ✓{getPlayerStats(currentPlayerId).hits} ✗{getPlayerStats(currentPlayerId).fails}
                </span>
              )}
            </div>
            <div style={{
              backgroundColor: timeLeft <= 10 ? colors.danger : colors.primary,
              width: '56px',
              height: '56px',
              borderRadius: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ color: colors.text, fontSize: '18px', fontWeight: 'bold' }}>{timeLeft}s</span>
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
          <div style={{
            backgroundColor: colors.surface,
            borderRadius: '24px',
            padding: '32px',
            alignItems: 'center',
            border: `3px solid ${colors.primary}`,
            marginBottom: '16px',
            transform: `scale(${cardScale})`,
            transition: 'transform 0.15s',
          }}>
            <h2 style={{ color: colors.text, fontSize: '32px', fontWeight: 'bold', textAlign: 'center', letterSpacing: '1px', margin: 0 }}>
              {isCurrentTeam ? (currentCharacter?.toUpperCase() || 'SIN TARJETAS') : '???'}
            </h2>
          </div>

          <p style={{ color: colors.textMuted, fontSize: '14px', textAlign: 'center', marginBottom: '16px' }}>
            {availableCharacters.length} personajes restantes
          </p>

          {isCurrentTeam ? (
            <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
              <button
                onClick={handleFail}
                style={{
                  flex: 1,
                  backgroundColor: colors.danger,
                  borderRadius: '16px',
                  padding: '20px',
                  border: 'none',
                  color: colors.text,
                  fontSize: '32px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span>✗</span>
                <span style={{ fontSize: '14px', fontWeight: '700', marginTop: '4px' }}>FALLO</span>
              </button>
              <button
                onClick={handleHit}
                style={{
                  flex: 1,
                  backgroundColor: colors.success,
                  borderRadius: '16px',
                  padding: '20px',
                  border: 'none',
                  color: colors.text,
                  fontSize: '32px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span>✓</span>
                <span style={{ fontSize: '14px', fontWeight: '700', marginTop: '4px' }}>ACIERTO</span>
              </button>
            </div>
          ) : (
            <Card style={{ textAlign: 'center', paddingVertical: '24px' }}>
              <p style={{ color: colors.textMuted, fontSize: '18px', fontWeight: '600', margin: '0 0 4px 0' }}>
                Espera tu turno...
              </p>
              <p style={{ color: colors.textMuted, fontSize: '14px', margin: 0 }}>
                El equipo {game.currentTeam} está jugando
              </p>
            </Card>
          )}

          {isCurrentTeam && (
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
          {!isCurrentTeam && (
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
        <>
          <div style={{ alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '56px', marginBottom: '8px' }}>🏆</div>
            <h1 style={{ color: colors.text, fontSize: '26px', fontWeight: 'bold', marginBottom: '20px' }}>
              ¡Juego Terminado!
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '16px' }}>
              <div style={{
                alignItems: 'center',
                padding: '16px',
                borderRadius: '16px',
                backgroundColor: colors.surface,
                border: team1Score > team2Score ? `2px solid ${colors.warning}` : 'none',
              }}>
                <p style={{ color: colors.primary, fontSize: '14px', marginBottom: '4px', margin: '0 0 4px 0' }}>Equipo 1</p>
                <p style={{ color: colors.text, fontSize: '40px', fontWeight: 'bold', margin: 0 }}>{team1Score}</p>
              </div>
              <span style={{ color: colors.textMuted, fontSize: '16px' }}>vs</span>
              <div style={{
                alignItems: 'center',
                padding: '16px',
                borderRadius: '16px',
                backgroundColor: colors.surface,
                border: team2Score > team1Score ? `2px solid ${colors.warning}` : 'none',
              }}>
                <p style={{ color: colors.secondary, fontSize: '14px', marginBottom: '4px', margin: '0 0 4px 0' }}>Equipo 2</p>
                <p style={{ color: colors.text, fontSize: '40px', fontWeight: 'bold', margin: 0 }}>{team2Score}</p>
              </div>
            </div>
            <h2 style={{ color: colors.text, fontSize: '22px', fontWeight: 'bold', marginBottom: '8px' }}>
              {team1Score > team2Score ? '🎉 ¡Equipo 1 Gana!' : team2Score > team1Score ? '🎉 ¡Equipo 2 Gana!' : '🤝 ¡Empate!'}
            </h2>
          </div>

          {/* Ranking de jugadores */}
          <Card style={{ marginBottom: '16px' }}>
            <h3 style={{ color: colors.text, fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
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
                    padding: '12px 0',
                    borderBottom: index < getPlayerRanking().length - 1 ? `1px solid ${colors.border}` : 'none',
                    backgroundColor: isFirst ? colors.surfaceLight : 'transparent',
                    paddingLeft: isFirst ? '16px' : '0',
                    paddingRight: isFirst ? '16px' : '0',
                    marginLeft: isFirst ? '-16px' : '0',
                    marginRight: isFirst ? '-16px' : '0',
                    borderRadius: isFirst ? '8px' : '0',
                  }}
                >
                  <span style={{ color: colors.textMuted, fontSize: '14px', fontWeight: 'bold', width: '30px' }}>
                    #{index + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: colors.text, fontSize: '16px', fontWeight: '600' }}>
                        {capitalize(playerName)}
                      </span>
                      {isFirst && <span style={{ fontSize: '14px' }}>👑</span>}
                    </div>
                    <p style={{ color: colors.textMuted, fontSize: '12px', margin: 0 }}>Equipo {player.team}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ color: colors.success, fontSize: '14px', fontWeight: 'bold' }}>✓ {stats.hits}</span>
                    <span style={{ color: colors.danger, fontSize: '14px', fontWeight: 'bold' }}>✗ {stats.fails}</span>
                  </div>
                </div>
              );
            })}
          </Card>

          <Button title="Volver al Dashboard" onClick={() => navigate('/dashboard')} size="large" style={{ marginTop: '16px' }} />
        </>
      )}

    </div>
  );
}

export default GameRoom;
