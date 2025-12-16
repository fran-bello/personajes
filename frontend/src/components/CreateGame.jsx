import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import './CreateGame.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function CreateGame() {
  const [numPlayers, setNumPlayers] = useState(4)
  const [gameMode, setGameMode] = useState('teams')
  const [charactersPerPlayer, setCharactersPerPlayer] = useState(2)
  const [characters, setCharacters] = useState(['', ''])
  const [timePerRound, setTimePerRound] = useState(60)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleCharacterChange = (index, value) => {
    const newCharacters = [...characters]
    newCharacters[index] = value
    setCharacters(newCharacters)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')

    // Validar que todos los personajes estén completos
    const trimmedChars = characters.map(c => c.trim()).filter(c => c)
    if (trimmedChars.length !== charactersPerPlayer) {
      setError(`Debes ingresar ${charactersPerPlayer} personajes`)
      return
    }

    // Verificar que no haya duplicados
    const uniqueChars = [...new Set(trimmedChars)]
    if (uniqueChars.length !== trimmedChars.length) {
      setError('Los personajes deben ser diferentes')
      return
    }

    try {
      const response = await axios.post(`${API_URL}/games/create`, {
        characters: trimmedChars,
        timePerRound,
        numPlayers,
        gameMode,
        charactersPerPlayer
      })
      
      navigate(`/game/${response.data.game.roomCode}`)
    } catch (error) {
      setError(error.response?.data?.message || 'Error al crear partida')
    }
  }

  // Calcular cuántos personajes necesita cada jugador
  const totalCharactersNeeded = numPlayers * charactersPerPlayer

  return (
    <div className="create-game-container">
      <div className="create-game-card">
        <h1>🎮 Crear Nueva Partida</h1>
        <p className="subtitle">Configura tu partida y aporta tus personajes</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleCreate}>
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
                // Ajustar array de personajes
                const newChars = Array(newValue).fill('').map((_, i) => characters[i] || '')
                setCharacters(newChars)
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

          <div className="characters-input-section">
            <h3>Tus Personajes ({charactersPerPlayer} personaje{charactersPerPlayer !== 1 ? 's' : ''})</h3>
            <div className="characters-inputs">
              {Array(charactersPerPlayer).fill(0).map((_, index) => (
                <div key={index} className="form-group">
                  <label>Personaje {index + 1}</label>
                  <input
                    type="text"
                    value={characters[index] || ''}
                    onChange={(e) => handleCharacterChange(index, e.target.value)}
                    placeholder={`Ej: Personaje ${index + 1}`}
                    required
                  />
                </div>
              ))}
            </div>
            <p className="helper-text">
              Los demás jugadores también aportarán {charactersPerPlayer} personaje{charactersPerPlayer !== 1 ? 's' : ''} cada uno.
              Se necesitan {totalCharactersNeeded} personajes en total para iniciar.
            </p>
          </div>

          <div className="actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Crear Partida
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateGame
