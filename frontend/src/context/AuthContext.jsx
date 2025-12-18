import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rememberMe, setRememberMe] = useState(true)
  const [savedEmail, setSavedEmail] = useState('')

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // Cargar preferencias guardadas
      const savedRememberMe = localStorage.getItem('rememberMe')
      const savedEmailValue = localStorage.getItem('savedEmail')
      const token = localStorage.getItem('token')

      // Establecer preferencia de "recuérdame" (default: true)
      const rememberMeValue = savedRememberMe !== 'false'
      setRememberMe(rememberMeValue)
      
      // Establecer email guardado
      if (savedEmailValue) {
        setSavedEmail(savedEmailValue)
      }

      // Si hay token y "recuérdame" estaba activo, intentar restaurar sesión
      if (token && rememberMeValue) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        await fetchUser()
      } else if (token && !rememberMeValue) {
        // Si hay token pero "recuérdame" no estaba activo, limpiarlo
        localStorage.removeItem('token')
        delete axios.defaults.headers.common['Authorization']
      }
    } catch (error) {
      console.error('Error checking auth:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`)
      setUser(response.data.user)
    } catch (error) {
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password, shouldRemember = true) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password })
      const { token, user } = response.data
      
      // Guardar preferencia de "recuérdame"
      setRememberMe(shouldRemember)
      localStorage.setItem('rememberMe', shouldRemember.toString())
      
      if (shouldRemember) {
        // Guardar token y email para la próxima vez
        localStorage.setItem('token', token)
        localStorage.setItem('savedEmail', email)
        setSavedEmail(email)
      } else {
        // No guardar permanentemente, solo mantener en memoria
        localStorage.setItem('token', token)
        localStorage.removeItem('savedEmail')
        setSavedEmail('')
      }
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error al iniciar sesión' 
      }
    }
  }

  const register = async (username, email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, { username, email, password })
      const { token, user } = response.data
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error al registrarse' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
  }

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    fetchUser,
    rememberMe,
    savedEmail
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

