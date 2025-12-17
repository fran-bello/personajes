import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { User, AuthResponse } from '../types';

interface GoogleUserData {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  rememberMe: boolean;
  savedEmail: string;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<AuthResponse>;
  loginWithGoogle: (googleData: GoogleUserData, rememberMe?: boolean) => Promise<AuthResponse>;
  register: (username: string, email: string, password: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setRememberMePreference: (value: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);
  const [savedEmail, setSavedEmail] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Cargar preferencias guardadas
      const [savedRememberMe, savedEmailValue, token] = await Promise.all([
        AsyncStorage.getItem('rememberMe'),
        AsyncStorage.getItem('savedEmail'),
        SecureStore.getItemAsync('token'),
      ]);

      // Establecer preferencia de "recuérdame" (default: true)
      const rememberMeValue = savedRememberMe !== 'false';
      setRememberMe(rememberMeValue);
      
      // Establecer email guardado
      if (savedEmailValue) {
        setSavedEmail(savedEmailValue);
      }

      // Si hay token y "recuérdame" estaba activo, intentar restaurar sesión
      if (token && rememberMeValue) {
        await fetchUser();
      } else if (token && !rememberMeValue) {
        // Si hay token pero "recuérdame" no estaba activo, limpiarlo
        await SecureStore.deleteItemAsync('token');
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const setRememberMePreference = async (value: boolean) => {
    setRememberMe(value);
    await AsyncStorage.setItem('rememberMe', value.toString());
  };

  const fetchUser = async () => {
    try {
      const response = await api.getMe();
      setUser(response.user);
    } catch (error) {
      await SecureStore.deleteItemAsync('token');
      setUser(null);
    }
  };

  const login = async (email: string, password: string, shouldRemember: boolean = true): Promise<AuthResponse> => {
    try {
      const response = await api.login(email, password);
      const { token, user } = response;
      
      // Guardar preferencia de "recuérdame"
      await setRememberMePreference(shouldRemember);
      
      if (shouldRemember) {
        // Guardar token y email para la próxima vez
        await SecureStore.setItemAsync('token', token);
        await AsyncStorage.setItem('savedEmail', email);
        setSavedEmail(email);
      } else {
        // No guardar nada permanentemente, solo mantener en memoria
        // El token se usará solo durante esta sesión
        await SecureStore.setItemAsync('token', token);
        await AsyncStorage.removeItem('savedEmail');
        setSavedEmail('');
      }
      
      setUser(user);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al iniciar sesión',
      };
    }
  };

  const loginWithGoogle = async (googleData: GoogleUserData, shouldRemember: boolean = true): Promise<AuthResponse> => {
    try {
      const response = await api.loginWithGoogle(googleData);
      const { token, user } = response;
      
      // Guardar preferencia de "recuérdame"
      await setRememberMePreference(shouldRemember);
      
      if (shouldRemember) {
        await SecureStore.setItemAsync('token', token);
        await AsyncStorage.setItem('savedEmail', googleData.email);
        setSavedEmail(googleData.email);
      } else {
        await SecureStore.setItemAsync('token', token);
        await AsyncStorage.removeItem('savedEmail');
        setSavedEmail('');
      }
      
      setUser(user);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al iniciar sesión con Google',
      };
    }
  };

  const register = async (username: string, email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await api.register(username, email, password);
      const { token, user } = response;
      await SecureStore.setItemAsync('token', token);
      setUser(user);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al registrarse',
      };
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    rememberMe,
    savedEmail,
    login,
    loginWithGoogle,
    register,
    logout,
    fetchUser,
    setRememberMePreference,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

