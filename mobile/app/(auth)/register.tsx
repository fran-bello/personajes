import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../../src/context/AuthContext';
import { Button, Input, Card } from '../../src/components';
import { colors } from '../../src/theme';

WebBrowser.maybeCompleteAuthSession();

// Configuración de Google OAuth - REEMPLAZA CON TUS CREDENCIALES
// Deja vacío para ocultar el botón de Google
const GOOGLE_CLIENT_ID_WEB = ''; // 'TU_CLIENT_ID_WEB.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID_ANDROID = ''; // 'TU_CLIENT_ID_ANDROID.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID_IOS = ''; // 'TU_CLIENT_ID_IOS.apps.googleusercontent.com';

const GOOGLE_ENABLED = GOOGLE_CLIENT_ID_WEB !== '' || GOOGLE_CLIENT_ID_ANDROID !== '' || GOOGLE_CLIENT_ID_IOS !== '';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_CLIENT_ID_WEB,
    androidClientId: GOOGLE_CLIENT_ID_ANDROID,
    iosClientId: GOOGLE_CLIENT_ID_IOS,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleResponse(response.authentication?.accessToken);
    }
  }, [response]);

  const handleGoogleResponse = async (accessToken: string | undefined) => {
    if (!accessToken) {
      setError('No se pudo obtener el token de Google');
      return;
    }

    setGoogleLoading(true);
    setError('');

    try {
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/userinfo/v2/me',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const userInfo = await userInfoResponse.json();

      const result = await loginWithGoogle({
        googleId: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      });

      if (result.success) {
        router.replace('/(app)/dashboard');
      } else {
        setError(result.message || 'Error al registrarse con Google');
      }
    } catch (err) {
      setError('Error al procesar la autenticación de Google');
      console.error('Google auth error:', err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setError('');
    setLoading(true);

    const result = await register(username.trim(), email.trim(), password);

    if (result.success) {
      router.replace('/(app)/dashboard');
    } else {
      setError(result.message || 'Error al registrarse');
    }

    setLoading(false);
  };

  const handleGoogleRegister = () => {
    setError('');
    promptAsync();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>🎭</Text>
              <Text style={styles.title}>Crear Cuenta</Text>
              <Text style={styles.subtitle}>Únete para jugar con tus amigos</Text>
            </View>

            {/* Form */}
            <Card style={styles.formCard}>
              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Botón de Google - solo si está configurado */}
              {GOOGLE_ENABLED && (
                <>
                  <TouchableOpacity
                    style={styles.googleButton}
                    onPress={handleGoogleRegister}
                    disabled={!request || googleLoading || loading}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }}
                      style={styles.googleIcon}
                    />
                    <Text style={styles.googleButtonText}>
                      {googleLoading ? 'Conectando...' : 'Registrarse con Google'}
                    </Text>
                  </TouchableOpacity>

                  {/* Separador */}
                  <View style={styles.separator}>
                    <View style={styles.separatorLine} />
                    <Text style={styles.separatorText}>o</Text>
                    <View style={styles.separatorLine} />
                  </View>
                </>
              )}

              <Input
                label="Nombre de usuario"
                placeholder="TuNombre"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="words"
              />

              <Input
                label="Email"
                placeholder="tu@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Input
                label="Contraseña"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <Input
                label="Confirmar contraseña"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />

              <Button
                title={loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                onPress={handleRegister}
                loading={loading}
                disabled={loading || googleLoading}
                size="large"
                style={styles.button}
              />
            </Card>

            {/* Login Link */}
            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>¿Ya tienes cuenta? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.link}>Inicia sesión</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 8,
  },
  formCard: {
    padding: 24,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    color: colors.danger,
    textAlign: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  googleButtonText: {
    color: '#1f1f1f',
    fontSize: 16,
    fontWeight: '600',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  separatorText: {
    color: colors.textMuted,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  button: {
    marginTop: 16,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  linkText: {
    color: colors.textMuted,
  },
  link: {
    color: colors.primary,
    fontWeight: '600',
  },
});
