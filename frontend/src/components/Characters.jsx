import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import './Characters.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function Characters() {
  const [characters, setCharacters] = useState([])
  const [newCharacter, setNewCharacter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user, fetchUser } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchCharacters()
  }, [])

  const fetchCharacters = async () => {
    try {
      const response = await axios.get(`${API_URL}/characters`)
      setCharacters(response.data.characters)
    } catch (error) {
      setError('Error al cargar personajes')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newCharacter.trim()) return

    try {
      const response = await axios.post(`${API_URL}/characters`, {
        character: newCharacter.trim()
      })
      setCharacters(response.data.characters)
      setNewCharacter('')
      setError('')
      await fetchUser()
    } catch (error) {
      setError(error.response?.data?.message || 'Error al agregar personaje')
    }
  }

  const handleDelete = async (character) => {
    try {
      const response = await axios.delete(`${API_URL}/characters/${character}`)
      setCharacters(response.data.characters)
      await fetchUser()
    } catch (error) {
      setError('Error al eliminar personaje')
    }
  }

  if (loading) {
    return <div className="loading">Cargando personajes...</div>
  }

  return (
    <div className="characters-container">
      <div className="characters-card">
        <div className="characters-header">
          <h1>👤 Gestionar Personajes</h1>
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            Volver
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleAdd} className="add-character-form">
          <input
            type="text"
            value={newCharacter}
            onChange={(e) => setNewCharacter(e.target.value)}
            placeholder="Nombre del personaje"
            className="character-input"
          />
          <button type="submit" className="btn btn-primary">
            Agregar
          </button>
        </form>

        <div className="characters-list">
          {characters.length === 0 ? (
            <p className="empty-message">No hay personajes. Agrega algunos para comenzar.</p>
          ) : (
            <>
              <p className="character-count">Total: {characters.length} personajes</p>
              <div className="characters-grid">
                {characters.map((character, index) => (
                  <div key={index} className="character-item">
                    <span>{character}</span>
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => handleDelete(character)}
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Characters

