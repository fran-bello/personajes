import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import Characters from './components/Characters'
import CreateGame from './components/CreateGame'
import GameRoom from './components/GameRoom'
import LocalGame from './components/LocalGame'
import { AuthProvider, useAuth } from './context/AuthContext'
import './App.css'

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
      <Route path="/characters" element={<ProtectedRoute><Characters /></ProtectedRoute>} />
      <Route path="/create-game" element={<ProtectedRoute><CreateGame /></ProtectedRoute>} />
      <Route path="/game/:roomCode" element={<ProtectedRoute><GameRoom /></ProtectedRoute>} />
      <Route path="/local-game" element={<LocalGame />} />
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

