import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_URL } from '../services/api'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rememberMe, setRememberMe] = useState(true)
  const [savedEmail, setSavedEmail] = useState('')

  const fetchUser = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`)
      setUser(response.data.user)
    } catch (error) {
      await AsyncStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedRememberMe = await AsyncStorage.getItem('rememberMe')
        const savedEmailValue = await AsyncStorage.getItem('savedEmail')
        const token = await AsyncStorage.getItem('token')

        const rememberMeValue = savedRememberMe !== 'false'
        setRememberMe(rememberMeValue)
        
        if (savedEmailValue) {
          setSavedEmail(savedEmailValue)
        }

        if (token && rememberMeValue) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          await fetchUser()
        } else if (token && !rememberMeValue) {
          await AsyncStorage.removeItem('token')
          delete axios.defaults.headers.common['Authorization']
          setLoading(false)
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        setLoading(false)
      }
    }

    checkAuth()
  }, [fetchUser])

  const login = async (email, password, shouldRemember = true) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password })
      const { token, user } = response.data
      
      setRememberMe(shouldRemember)
      await AsyncStorage.setItem('rememberMe', shouldRemember.toString())
      
      if (shouldRemember) {
        await AsyncStorage.setItem('token', token)
        await AsyncStorage.setItem('savedEmail', email)
        setSavedEmail(email)
      } else {
        await AsyncStorage.setItem('token', token)
        await AsyncStorage.removeItem('savedEmail')
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
      await AsyncStorage.setItem('token', token)
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

  const logout = async () => {
    await AsyncStorage.removeItem('token')
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

