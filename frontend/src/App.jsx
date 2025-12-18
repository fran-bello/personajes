import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import CreateGame from './components/CreateGame'
import GameRoom from './components/GameRoom'
import LocalGame from './components/LocalGame'
import HowToPlay from './components/HowToPlay'
import { AuthProvider, useAuth } from './context/AuthContext'
import { colors } from './theme'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="loading">Cargando...</div>
  }
  
  return user ? children : <Navigate to="/login" />
}

function AppRoutes() {
  const { user } = useAuth()

  return (
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

