import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import './CreateGame.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function CreateGame() {
  const [characters, setCharacters] = useState([])
  const [selectedCharacters, setSelectedCharacters] = useState([])
  const [timePerRound, setTimePerRound] = useState(60)
  const [numCharacters, setNumCharacters] = useState(30)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchCharacters()
  }, [])

  useEffect(() => {
    if (characters.length > 0) {
      const selected = characters.slice(0, Math.min(numCharacters, characters.length))
      setSelectedCharacters(selected)
    }
  }, [numCharacters, characters])

  const fetchCharacters = async () => {
    try {
      const response = await axios.get(`${API_URL}/characters`)
      const chars = response.data.characters
      setCharacters(chars)
      if (chars.length > 0) {
        setSelectedCharacters(chars.slice(0, Math.min(30, chars.length)))
      }
    } catch (error) {
      setError('Error al cargar personajes')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (selectedCharacters.length < 10) {
      setError('Se necesitan al menos 10 personajes para jugar')
      return
    }

    try {
      setError('')
      const response = await axios.post(`${API_URL}/games/create`, {
        characters: selectedCharacters,
        timePerRound
      })
      
      navigate(`/game/${response.data.game.roomCode}`)
    } catch (error) {
      setError(error.response?.data?.message || 'Error al crear partida')
    }
  }

  if (loading) {
    return <div className="loading">Cargando...</div>
  }

  if (characters.length < 10) {
    return (
      <div className="create-game-container">
        <div className="create-game-card">
          <h1>Crear Partida</h1>
          <div className="error-message">
            Necesitas al menos 10 personajes para crear una partida.
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/characters')}>
            Ir a Gestionar Personajes
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="create-game-container">
      <div className="create-game-card">
        <h1>🎮 Crear Nueva Partida</h1>

        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label>Tiempo por ronda (segundos)</label>
          <input
            type="number"
            min="30"
            max="300"
            value={timePerRound}
            onChange={(e) => setTimePerRound(parseInt(e.target.value))}
          />
        </div>

        <div className="form-group">
          <label>Número de personajes a usar</label>
          <input
            type="number"
            min="10"
            max={characters.length}
            value={numCharacters}
            onChange={(e) => setNumCharacters(parseInt(e.target.value))}
          />
          <p className="helper-text">
            Tienes {characters.length} personajes disponibles
          </p>
        </div>

        <div className="selected-characters">
          <h3>Personajes seleccionados ({selectedCharacters.length})</h3>
          <div className="characters-preview">
            {selectedCharacters.map((char, index) => (
              <span key={index} className="character-tag">
                {char}
              </span>
            ))}
          </div>
        </div>

        <div className="actions">
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleCreate}>
            Crear Partida
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateGame

