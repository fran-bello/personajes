import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import CreateGame from './components/CreateGame'
import GameRoom from './components/GameRoom'
import LocalGame from './components/LocalGame'
import HowToPlay from './components/HowToPlay'
import { AuthProvider, useAuth } from './context/AuthContext'
import { soundService } from './services/sound'
import { colors } from './theme'
import './App.css'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="loading">Cargando...</div>
  }
  
  return user ? children : <Navigate to="/login" />
}

function SoundToggleButton() {
  const location = useLocation()
  const [soundsEnabled, setSoundsEnabled] = useState(true)

  // Cargar preferencias al montar
  useEffect(() => {
    soundService.loadPreferences()
    setSoundsEnabled(soundService.isEnabled())
  }, [])

  // Ocultar en login y register
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null
  }

  const toggleSounds = () => {
    const newState = !soundsEnabled
    setSoundsEnabled(newState)
    soundService.setEnabled(newState)
  }

  return (
    <button
      onClick={toggleSounds}
      style={{
        position: 'fixed',
        top: '12px',
        right: 'max(12px, calc(50% - 300px + 12px))',
        zIndex: 1000,
        width: '32px',
        height: '32px',
        borderRadius: '16px',
        border: `1px solid ${colors.textMuted}60`,
        backgroundColor: `rgba(15, 23, 42, 0.9)`,
        backdropFilter: 'blur(8px)',
        cursor: 'pointer',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        transition: 'all 0.2s ease',
        opacity: 0.7,
        boxSizing: 'border-box',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '1'
        e.currentTarget.style.borderColor = colors.primary
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '0.7'
        e.currentTarget.style.borderColor = `${colors.textMuted}40`
      }}
      title={soundsEnabled ? 'Desactivar sonidos' : 'Activar sonidos'}
    >
      {soundsEnabled ? '🔊' : '🔇'}
    </button>
  )
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <div className="app-container">
      <SoundToggleButton />
      <div style={{ paddingTop: '10px' }}>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/create-game" element={<ProtectedRoute><CreateGame /></ProtectedRoute>} />
          <Route path="/game/:roomCode" element={<ProtectedRoute><GameRoom /></ProtectedRoute>} />
          <Route path="/local-game" element={<LocalGame />} />
          <Route path="/how-to-play" element={<HowToPlay />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

export default App

