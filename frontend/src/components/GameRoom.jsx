import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'
import './GameRoom.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

function GameRoom() {
  const { roomCode } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [game, setGame] = useState(null)
  const [timeLeft, setTimeLeft] = useState(60)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [playerCharacters, setPlayerCharacters] = useState(['', ''])
  const [submittingCharacters, setSubmittingCharacters] = useState(false)
  const socketRef = useRef(null)
  const timerIntervalRef = useRef(null)

  useEffect(() => {
    joinGame()
    connectSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [roomCode])

  // Inicializar array de personajes cuando se carga el juego
  useEffect(() => {
    if (game && game.charactersPerPlayer) {
      const charsPerPlayer = game.charactersPerPlayer || 2
      if (playerCharacters.length !== charsPerPlayer) {
        setPlayerCharacters(Array(charsPerPlayer).fill(''))
      }
    }
  }, [game?.charactersPerPlayer])

  useEffect(() => {
    if (game && game.status === 'playing' && !game.timer.isPaused) {
      startTimer()
    } else {
      stopTimer()
    }
    return () => stopTimer()
  }, [game?.status, game?.timer?.isPaused])

  const connectSocket = () => {
    socketRef.current = io(SOCKET_URL)
    socketRef.current.emit('join-game', roomCode)
    
    socketRef.current.on('game-updated', () => {
      fetchGame()
    })
  }

  const joinGame = async (characters = null) => {
    try {
      const response = await axios.post(`${API_URL}/games/join`, { 
        roomCode,
        characters 
      })
      setGame(response.data.game)
      setTimeLeft(response.data.game.timer?.timeLeft || response.data.game.timePerRound)
      setLoading(false)
      if (characters) {
        const charsPerPlayer = response.data.game.charactersPerPlayer || 2
        setPlayerCharacters(Array(charsPerPlayer).fill(''))
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error al unirse a la partida')
      setLoading(false)
    }
  }

  const handleCharacterChange = (index, value) => {
    const newChars = [...playerCharacters]
    newChars[index] = value
    setPlayerCharacters(newChars)
  }

  const handleSubmitCharacters = async (e) => {
    e.preventDefault()
    setError('')
    
    const charsPerPlayer = game?.charactersPerPlayer || 2
    const trimmedChars = playerCharacters.map(c => c.trim()).filter(c => c)
    
    if (trimmedChars.length !== charsPerPlayer) {
      setError(`Debes ingresar ${charsPerPlayer} personajes`)
      return
    }

    // Verificar que no haya duplicados
    const uniqueChars = [...new Set(trimmedChars)]
    if (uniqueChars.length !== trimmedChars.length) {
      setError('Los personajes deben ser diferentes')
      return
    }

    setSubmittingCharacters(true)
    try {
      await joinGame(trimmedChars)
      if (socketRef.current) {
        socketRef.current.emit('game-update', roomCode)
      }
      setPlayerCharacters(Array(charsPerPlayer).fill(''))
    } catch (error) {
      setError(error.response?.data?.message || 'Error al agregar personajes')
    } finally {
      setSubmittingCharacters(false)
    }
  }

  const fetchGame = async () => {
    try {
      const response = await axios.get(`${API_URL}/games/${roomCode}`)
      const updatedGame = response.data.game
      setGame(updatedGame)
      if (updatedGame.timer) {
        setTimeLeft(updatedGame.timer.timeLeft)
      }
    } catch (error) {
      console.error('Error fetching game:', error)
    }
  }

  const startTimer = () => {
    stopTimer()
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          stopTimer()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
  }

  const handleHit = async () => {
    try {
      const response = await axios.post(`${API_URL}/games/${roomCode}/hit`)
      setGame(response.data.game)
      if (socketRef.current) {
        socketRef.current.emit('game-update', roomCode)
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error')
    }
  }

  const handlePass = async () => {
    try {
      const response = await axios.post(`${API_URL}/games/${roomCode}/pass`)
      setGame(response.data.game)
      if (socketRef.current) {
        socketRef.current.emit('game-update', roomCode)
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error')
    }
  }

  const handleStart = async () => {
    try {
      const response = await axios.post(`${API_URL}/games/${roomCode}/start`)
      setGame(response.data.game)
      setTimeLeft(response.data.game.timePerRound)
      if (socketRef.current) {
        socketRef.current.emit('game-update', roomCode)
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error al iniciar partida')
    }
  }

  const togglePause = async () => {
    try {
      const isPaused = !game.timer.isPaused
      await axios.post(`${API_URL}/games/${roomCode}/timer`, {
        isPaused
      })
      fetchGame()
    } catch (error) {
      console.error('Error pausing timer:', error)
    }
  }

  if (loading) {
    return <div className="loading">Cargando partida...</div>
  }

  if (error && !game) {
    return (
      <div className="game-room-container">
        <div className="game-card">
          <div className="error-message">{error}</div>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            Volver al Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!game) return null

  const currentCharacter = game.characters[game.currentCharacterIndex]
  const isHost = game.host._id === user?.id || game.host === user?.id
  const currentPlayer = game.players.find(p => 
    (p.user._id || p.user) === user?.id
  )
  const isCurrentTeam = currentPlayer && currentPlayer.team === game.currentTeam
  const team1Players = game.players.filter(p => p.team === 1)
  const team2Players = game.players.filter(p => p.team === 2)
  const team1Score = game.roundScores.round1.team1 + game.roundScores.round2.team1 + game.roundScores.round3.team1
  const team2Score = game.roundScores.round1.team2 + game.roundScores.round2.team2 + game.roundScores.round3.team2
  
  // Verificar si el jugador actual ya aportó sus personajes
  const playerCharactersData = game.playerCharacters || {}
  const currentPlayerId = currentPlayer?.user._id || currentPlayer?.user
  const hasSubmittedCharacters = currentPlayer && playerCharactersData[currentPlayerId]?.length > 0
  const needsToSubmitCharacters = currentPlayer && !hasSubmittedCharacters && game.status === 'waiting'
  const charsPerPlayer = game.charactersPerPlayer || 2
  const totalCharactersNeeded = (game.numPlayers || 4) * charsPerPlayer
  
  // Mostrar solo los personajes del jugador actual
  const myCharacters = currentPlayerId ? (playerCharactersData[currentPlayerId] || []) : []

  const roundRules = {
    1: 'Puedes decir todas las palabras que quieras, excepto las que aparecen en la tarjeta',
    2: 'Solo puedes decir UNA palabra (sin mencionar el nombre del personaje)',
    3: 'Solo mímica. No puedes decir ninguna palabra'
  }

  const wordsProhibited = currentCharacter 
    ? currentCharacter.toLowerCase().split(/[\s\-_]+/).filter(w => w.length > 2)
    : []

  return (
    <div className="game-room-container">
      <div className="game-card">
        {error && <div className="error-message">{error}</div>}

        {/* Información de Ronda */}
        <div className="round-info">
          <h2>Ronda {game.currentRound}</h2>
          <p>{roundRules[game.currentRound]}</p>
        </div>

        {/* Timer */}
        <div className="timer-section">
          <div className={`timer ${timeLeft <= 10 ? 'alert' : ''}`}>
            {timeLeft}
          </div>
          {game.status === 'playing' && (
            <button className="btn btn-small" onClick={togglePause}>
              {game.timer?.isPaused ? 'Reanudar' : 'Pausar'}
            </button>
          )}
        </div>

        {/* Puntuación */}
        <div className="score-section">
          <div className="team-score">
            <h3>Equipo 1</h3>
            <div className="score-value">{team1Score}</div>
            <div className="team-players">
              {team1Players.map((p, i) => (
                <span key={i} className="player-name">
                  {p.user.username || p.user}
                </span>
              ))}
            </div>
          </div>
          <div className="team-score">
            <h3>Equipo 2</h3>
            <div className="score-value">{team2Score}</div>
            <div className="team-players">
              {team2Players.map((p, i) => (
                <span key={i} className="player-name">
                  {p.user.username || p.user}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Estado de la partida */}
        {game.status === 'waiting' && (
          <div className="waiting-section">
            <h3>Código de Sala: <span className="room-code">{game.roomCode}</span></h3>
            <div className="game-info">
              <p>Jugadores: {game.players.length} / {game.numPlayers || 4}</p>
              <p>Personajes totales: {game.characters?.length || 0} / {totalCharactersNeeded}</p>
              <p>Modo: {game.gameMode === 'teams' ? 'Equipos' : 'Parejas'}</p>
              <p>Personajes por jugador: {charsPerPlayer}</p>
            </div>
            
            {/* Formulario para aportar personajes */}
            {needsToSubmitCharacters && (
              <div className="characters-form-section">
                <h4>Ingresa tus {charsPerPlayer} personaje{charsPerPlayer !== 1 ? 's' : ''}</h4>
                <form onSubmit={handleSubmitCharacters}>
                  <div className="characters-inputs">
                    {Array(charsPerPlayer).fill(0).map((_, index) => (
                      <input
                        key={index}
                        type="text"
                        value={playerCharacters[index] || ''}
                        onChange={(e) => handleCharacterChange(index, e.target.value)}
                        placeholder={`Personaje ${index + 1}`}
                        required
                        disabled={submittingCharacters}
                      />
                    ))}
                  </div>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={submittingCharacters}
                  >
                    {submittingCharacters ? 'Enviando...' : 'Agregar Personajes'}
                  </button>
                </form>
              </div>
            )}

            {/* Mostrar solo los personajes del jugador actual */}
            {!needsToSubmitCharacters && myCharacters.length > 0 && (
              <div className="my-characters-section">
                <h4>Tus Personajes:</h4>
                <div className="my-characters-list">
                  {myCharacters.map((char, i) => (
                    <span key={i} className="character-tag">{char}</span>
                  ))}
                </div>
              </div>
            )}

            {!needsToSubmitCharacters && (
              <div className="waiting-info">
                <p>Esperando que todos los jugadores aporten sus personajes...</p>
                {isHost && game.characters?.length >= totalCharactersNeeded && game.players.length >= game.numPlayers && (
                  <button className="btn btn-primary btn-large" onClick={handleStart}>
                    Iniciar Partida
                  </button>
                )}
                {isHost && (game.characters?.length < totalCharactersNeeded || game.players.length < game.numPlayers) && (
                  <p className="helper-text">
                    Se necesitan {totalCharactersNeeded} personajes y {game.numPlayers} jugadores para iniciar
                    <br />
                    ({game.characters?.length || 0} personajes, {game.players.length} jugadores)
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {game.status === 'playing' && (
          <>
            {/* Tarjeta de Personaje */}
            <div className="character-card">
              <h1>{currentCharacter || 'Cargando...'}</h1>
              {game.currentRound === 1 && wordsProhibited.length > 0 && (
                <p className="prohibited-words">
                  No puedes decir: {wordsProhibited.join(', ')}
                </p>
              )}
            </div>

            {/* Controles */}
            <div className="game-controls">
              {isCurrentTeam ? (
                <>
                  <button className="btn btn-success btn-large" onClick={handleHit}>
                    ✓ Acierto
                  </button>
                  <button className="btn btn-danger btn-large" onClick={handlePass}>
                    → Pasar
                  </button>
                </>
              ) : (
                <p className="wait-turn">Espera tu turno...</p>
              )}
            </div>

            {/* Progreso */}
            <div className="progress-section">
              <p>
                Personajes restantes: {game.characters.length - game.currentCharacterIndex} / {game.characters.length}
              </p>
              <p>
                Turno: Equipo {game.currentTeam}
              </p>
            </div>
          </>
        )}

        {game.status === 'finished' && (
          <div className="finished-section">
            <h2>¡Juego Terminado!</h2>
            <div className="final-scores">
              <div className="final-score">
                <h3>Equipo 1</h3>
                <div className="final-score-value">{team1Score}</div>
              </div>
              <div className="final-score">
                <h3>Equipo 2</h3>
                <div className="final-score-value">{team2Score}</div>
              </div>
            </div>
            <h3 className="winner">
              {team1Score > team2Score 
                ? '🏆 ¡Equipo 1 Gana!' 
                : team2Score > team1Score 
                ? '🏆 ¡Equipo 2 Gana!' 
                : '🤝 ¡Empate!'}
            </h3>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
              Volver al Dashboard
            </button>
          </div>
        )}

        <button className="btn btn-secondary btn-small" onClick={() => navigate('/dashboard')}>
          Salir
        </button>
      </div>
    </div>
  )
}

export default GameRoom

