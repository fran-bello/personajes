import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './LocalGame.css'

function LocalGame() {
  const navigate = useNavigate()
  const [gameState, setGameState] = useState('config') // config, setup, playing, finished
  const [numPlayers, setNumPlayers] = useState(4)
  const [gameMode, setGameMode] = useState('teams')
  const [charactersPerPlayer, setCharactersPerPlayer] = useState(2)
  const [timePerRound, setTimePerRound] = useState(60)
  
  const [players, setPlayers] = useState([])
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [roundPlayerIndex, setRoundPlayerIndex] = useState(0)
  const [characters, setCharacters] = useState([])
  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0)
  const [round, setRound] = useState(1)
  const [currentTeam, setCurrentTeam] = useState(1)
  const [timeLeft, setTimeLeft] = useState(60)
  const [isPaused, setIsPaused] = useState(false)
  const [scores, setScores] = useState({
    round1: { team1: 0, team2: 0 },
    round2: { team1: 0, team2: 0 },
    round3: { team1: 0, team2: 0 }
  })
  const [playerName, setPlayerName] = useState('')
  const [playerCharacters, setPlayerCharacters] = useState(['', ''])
  const [team1Players, setTeam1Players] = useState([])
  const [team2Players, setTeam2Players] = useState([])
  const [playerCharactersData, setPlayerCharactersData] = useState({}) // Almacenar personajes por jugador

  const roundRules = {
    1: 'Puedes decir todas las palabras que quieras, excepto las que aparecen en la tarjeta',
    2: 'Solo puedes decir UNA palabra (sin mencionar el nombre del personaje)',
    3: 'Solo mímica. No puedes decir ninguna palabra'
  }

  useEffect(() => {
    if (gameState === 'playing' && !isPaused && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeUp()
            return 0
          }
          return prev - 1
          })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [gameState, isPaused, timeLeft])

  // Inicializar array de personajes cuando cambia charactersPerPlayer
  useEffect(() => {
    setPlayerCharacters(Array(charactersPerPlayer).fill(''))
  }, [charactersPerPlayer])

  const handleCharacterChange = (index, value) => {
    const newChars = [...playerCharacters]
    newChars[index] = value
    setPlayerCharacters(newChars)
  }

  const handleConfigSubmit = (e) => {
    e.preventDefault()
    if (numPlayers < 2) {
      alert('Debe haber al menos 2 jugadores')
      return
    }
    setGameState('setup')
  }

  const handleAddPlayer = (e) => {
    e.preventDefault()
    const trimmedChars = playerCharacters.map(c => c.trim()).filter(c => c)
    
    if (!playerName.trim() || trimmedChars.length !== charactersPerPlayer) {
      alert(`Completa todos los campos. Necesitas ${charactersPerPlayer} personajes.`)
      return
    }

    // Verificar que no haya duplicados
    const uniqueChars = [...new Set(trimmedChars)]
    if (uniqueChars.length !== trimmedChars.length) {
      alert('Los personajes deben ser diferentes')
      return
    }

    // Asignar equipo según el modo
    let team = 1
    if (gameMode === 'teams') {
      // Equipos: dividir equitativamente
      team = team1Players.length <= team2Players.length ? 1 : 2
    } else {
      // Parejas: alternar
      team = players.length % 2 === 0 ? 1 : 2
    }

    const newPlayer = {
      id: Date.now(),
      name: playerName.trim(),
      team: team,
      characters: trimmedChars
    }

    // Guardar personajes del jugador
    setPlayerCharactersData({
      ...playerCharactersData,
      [newPlayer.id]: trimmedChars
    })

    if (team === 1) {
      setTeam1Players([...team1Players, newPlayer])
    } else {
      setTeam2Players([...team2Players, newPlayer])
    }

    setPlayers([...players, newPlayer])
    setCharacters([...characters, ...trimmedChars])
    setPlayerName('')
    setPlayerCharacters(Array(charactersPerPlayer).fill(''))
  }

  const handleStartGame = () => {
    if (players.length < numPlayers) {
      alert(`Se necesitan ${numPlayers} jugadores. Actualmente hay ${players.length}`)
      return
    }
    
    const totalCharactersNeeded = numPlayers * charactersPerPlayer
    if (characters.length < totalCharactersNeeded) {
      alert(`Se necesitan ${totalCharactersNeeded} personajes (${charactersPerPlayer} por jugador). Actualmente hay ${characters.length}`)
      return
    }

    // Mezclar personajes
    const shuffled = [...characters]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    setCharacters(shuffled)
    setGameState('playing')
    setCurrentPlayerIndex(0)
    setRoundPlayerIndex(0)
    setCurrentCharacterIndex(0)
    setTimeLeft(timePerRound)
  }

  const handleHit = () => {
    const currentPlayer = getCurrentPlayer()
    if (!currentPlayer) return
    
    const roundKey = `round${round}`
    const newScores = { ...scores }
    newScores[roundKey][`team${currentPlayer.team}`]++
    setScores(newScores)

    nextCharacter()
  }

  const handlePass = () => {
    nextCharacter()
  }

  const nextCharacter = () => {
    const newIndex = currentCharacterIndex + 1
    
    if (newIndex >= characters.length) {
      // Cambiar de equipo o ronda
      if (currentTeam === 2) {
        // Ambos equipos terminaron, siguiente ronda
        if (round < 3) {
          // Mezclar personajes para nueva ronda
          const shuffled = [...characters]
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
          }
          setCharacters(shuffled)
          setRound(round + 1)
          setCurrentTeam(1)
          setRoundPlayerIndex(0)
          setCurrentCharacterIndex(0)
          setTimeLeft(timePerRound)
        } else {
          // Juego terminado
          setGameState('finished')
        }
      } else {
        // Cambiar al equipo 2
        setCurrentTeam(2)
        setRoundPlayerIndex(0)
        setCurrentCharacterIndex(0)
        // Mezclar personajes
        const shuffled = [...characters]
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        setCharacters(shuffled)
        setTimeLeft(timePerRound)
      }
    } else {
      setCurrentCharacterIndex(newIndex)
    }
  }

  const handleTimeUp = () => {
    nextCharacter()
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
  }

  const getCurrentPlayer = () => {
    const teamPlayers = currentTeam === 1 ? team1Players : team2Players
    if (teamPlayers.length === 0) return null
    return teamPlayers[roundPlayerIndex % teamPlayers.length]
  }

  const getTotalScore = (team) => {
    return scores.round1[`team${team}`] + scores.round2[`team${team}`] + scores.round3[`team${team}`]
  }

  const currentCharacter = characters[currentCharacterIndex]
  const wordsProhibited = currentCharacter 
    ? currentCharacter.toLowerCase().split(/[\s\-_]+/).filter(w => w.length > 2)
    : []

  const totalCharactersNeeded = numPlayers * charactersPerPlayer

  // Pantalla de configuración inicial
  if (gameState === 'config') {
    return (
      <div className="local-game-container">
        <div className="local-game-card">
          <h1>🎮 Juego Local</h1>
          <p className="subtitle">Configura tu partida</p>

          <form onSubmit={handleConfigSubmit}>
            <div className="form-group">
              <label>Número de jugadores</label>
              <input
                type="number"
                min="2"
                max="20"
                value={numPlayers}
                onChange={(e) => setNumPlayers(parseInt(e.target.value) || 2)}
                required
              />
              <p className="helper-text">
                Total de personajes necesarios: {totalCharactersNeeded} ({charactersPerPlayer} por jugador)
              </p>
            </div>

            <div className="form-group">
              <label>Modo de juego</label>
              <select
                value={gameMode}
                onChange={(e) => setGameMode(e.target.value)}
                className="form-select"
              >
                <option value="teams">Equipos (2 equipos)</option>
                <option value="pairs">Parejas</option>
              </select>
              <p className="helper-text">
                {gameMode === 'teams' 
                  ? 'Los jugadores se dividirán en 2 equipos' 
                  : 'Los jugadores jugarán en parejas'}
              </p>
            </div>

            <div className="form-group">
              <label>Personajes por jugador</label>
              <input
                type="number"
                min="1"
                max="10"
                value={charactersPerPlayer}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value) || 1
                  setCharactersPerPlayer(newValue)
                  setPlayerCharacters(Array(newValue).fill(''))
                }}
                required
              />
              <p className="helper-text">
                Cada jugador aportará {charactersPerPlayer} personaje{charactersPerPlayer !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="form-group">
              <label>Tiempo por ronda (segundos)</label>
              <input
                type="number"
                min="30"
                max="300"
                value={timePerRound}
                onChange={(e) => setTimePerRound(parseInt(e.target.value))}
                required
              />
            </div>

            <div className="actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                Volver
              </button>
              <button type="submit" className="btn btn-primary">
                Continuar
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  if (gameState === 'setup') {
    return (
      <div className="local-game-container">
        <div className="local-game-card">
          <h1>🎮 Juego Local</h1>
          <p className="subtitle">Agrega los jugadores y sus personajes</p>

          <div className="game-config-info">
            <p><strong>Jugadores:</strong> {players.length} / {numPlayers}</p>
            <p><strong>Personajes:</strong> {characters.length} / {totalCharactersNeeded}</p>
            <p><strong>Modo:</strong> {gameMode === 'teams' ? 'Equipos' : 'Parejas'}</p>
            <p><strong>Personajes por jugador:</strong> {charactersPerPlayer}</p>
          </div>

          <div className="setup-section">
            <div className="add-player-section">
              <h3>Agregar Jugador</h3>
              <form onSubmit={handleAddPlayer}>
                <div className="form-group">
                  <label>Nombre del jugador</label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Ej: Juan"
                    required
                  />
                </div>
                <div className="characters-inputs">
                  {Array(charactersPerPlayer).fill(0).map((_, index) => (
                    <div key={index} className="form-group">
                      <label>Personaje {index + 1}</label>
                      <input
                        type="text"
                        value={playerCharacters[index] || ''}
                        onChange={(e) => handleCharacterChange(index, e.target.value)}
                        placeholder={`Ej: Personaje ${index + 1}`}
                        required
                      />
                    </div>
                  ))}
                </div>
                <button type="submit" className="btn btn-primary">
                  Agregar Jugador
                </button>
              </form>
            </div>

            {players.length > 0 && (
              <div className="players-list">
                <h3>Jugadores ({players.length})</h3>
                <div className="teams-display">
                  <div className="team-display">
                    <h4>Equipo 1</h4>
                    {team1Players.map((p) => (
                      <div key={p.id} className="player-item">
                        <span>{p.name}</span>
                        <span className="player-characters">
                          {playerCharactersData[p.id] ? playerCharactersData[p.id].join(', ') : 'Sin personajes'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="team-display">
                    <h4>Equipo 2</h4>
                    {team2Players.map((p) => (
                      <div key={p.id} className="player-item">
                        <span>{p.name}</span>
                        <span className="player-characters">
                          {playerCharactersData[p.id] ? playerCharactersData[p.id].join(', ') : 'Sin personajes'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="total-characters">Total personajes: {characters.length} / {totalCharactersNeeded}</p>
              </div>
            )}

            <div className="actions">
              <button className="btn btn-secondary" onClick={() => setGameState('config')}>
                Atrás
              </button>
              {players.length >= numPlayers && characters.length >= totalCharactersNeeded && (
                <button className="btn btn-primary btn-large" onClick={handleStartGame}>
                  Iniciar Juego
                </button>
              )}
              {(!(players.length >= numPlayers && characters.length >= totalCharactersNeeded)) && (
                <p className="helper-text">
                  {players.length < numPlayers && `Faltan ${numPlayers - players.length} jugador${numPlayers - players.length !== 1 ? 'es' : ''}. `}
                  {characters.length < totalCharactersNeeded && `Faltan ${totalCharactersNeeded - characters.length} personaje${totalCharactersNeeded - characters.length !== 1 ? 's' : ''}.`}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (gameState === 'playing') {
    const currentPlayer = getCurrentPlayer()
    const team1Score = getTotalScore(1)
    const team2Score = getTotalScore(2)

    return (
      <div className="local-game-container">
        <div className="local-game-card">
          <div className="round-info">
            <h2>Ronda {round}</h2>
            <p>{roundRules[round]}</p>
          </div>

          <div className="timer-section">
            <div className={`timer ${timeLeft <= 10 ? 'alert' : ''}`}>
              {timeLeft}
            </div>
            <button className="btn btn-small" onClick={togglePause}>
              {isPaused ? 'Reanudar' : 'Pausar'}
            </button>
          </div>

          <div className="score-section">
            <div className="team-score">
              <h3>Equipo 1</h3>
              <div className="score-value">{team1Score}</div>
            </div>
            <div className="team-score">
              <h3>Equipo 2</h3>
              <div className="score-value">{team2Score}</div>
            </div>
          </div>

          <div className="current-player-info">
            <p>Turno: <strong>{currentPlayer?.name}</strong> (Equipo {currentTeam})</p>
          </div>

          <div className="character-card">
            <h1>{currentCharacter || 'Cargando...'}</h1>
            {round === 1 && wordsProhibited.length > 0 && (
              <p className="prohibited-words">
                No puedes decir: {wordsProhibited.join(', ')}
              </p>
            )}
          </div>

          <div className="game-controls">
            <button className="btn btn-success btn-large" onClick={handleHit}>
              ✓ Acierto
            </button>
            <button className="btn btn-danger btn-large" onClick={handlePass}>
              → Pasar
            </button>
          </div>

          <div className="progress-section">
            <p>
              Personajes restantes: {characters.length - currentCharacterIndex} / {characters.length}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (gameState === 'finished') {
    const team1Score = getTotalScore(1)
    const team2Score = getTotalScore(2)

    return (
      <div className="local-game-container">
        <div className="local-game-card">
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
        </div>
      </div>
    )
  }

  return null
}

export default LocalGame
