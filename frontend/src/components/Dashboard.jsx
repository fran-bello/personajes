import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import './Dashboard.css'

function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <h1>🎭 Personajes</h1>
          <button className="btn btn-secondary btn-small" onClick={logout}>
            Cerrar Sesión
          </button>
        </div>

        <div className="welcome-section">
          <h2>¡Hola, {user?.username}!</h2>
          <p>Bienvenido al juego Personajes</p>
        </div>

        <div className="dashboard-actions">
          <div className="action-card" onClick={() => navigate('/characters')}>
            <div className="action-icon">👤</div>
            <h3>Gestionar Personajes</h3>
            <p>Agrega, edita o elimina tus personajes personalizados</p>
            <p className="character-count">{user?.characters?.length || 0} personajes</p>
          </div>

          <div className="action-card" onClick={() => navigate('/create-game')}>
            <div className="action-icon">🌐</div>
            <h3>Partida Online</h3>
            <p>Crea una partida online y comparte el código con tus amigos</p>
          </div>

          <div className="action-card" onClick={() => navigate('/local-game')}>
            <div className="action-icon">📱</div>
            <h3>Juego Local</h3>
            <p>Juega en un solo dispositivo pasándolo por turnos</p>
          </div>
        </div>

        <div className="stats-section">
          <div className="stat">
            <div className="stat-value">{user?.gamesPlayed || 0}</div>
            <div className="stat-label">Partidas Jugadas</div>
          </div>
          <div className="stat">
            <div className="stat-value">{user?.gamesWon || 0}</div>
            <div className="stat-label">Partidas Ganadas</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

