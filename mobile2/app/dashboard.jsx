import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { Button } from '../src/components/Button';
import { Card, ActionCard } from '../src/components/Card';
import { theme } from '../src/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Dashboard() {
  const { user, logout, fetchUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (fetchUser) {
      fetchUser();
    }
  }, [fetchUser]);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <LinearGradient
      colors={theme.gradients.background}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoTitle}>
              <Image
                source={require('../assets/img/logo-personajes.png')}
                style={styles.logo}
              />
              <Text style={styles.title}>Personajes</Text>
            </View>
            <Button title="Salir" onPress={handleLogout} variant="secondary" size="small" />
          </View>

          {/* Welcome Card */}
          <Card style={styles.welcomeCard}>
            <View style={styles.welcomeContent}>
              {user?.avatar ? (
                <Image
                  source={{ uri: user.avatar }}
                  style={styles.welcomeAvatar}
                />
              ) : (
                <View style={[styles.welcomeAvatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarPlaceholderText}>👤</Text>
                </View>
              )}
              <View style={styles.welcomeText}>
                <Text style={styles.welcomeLabel}>Bienvenido</Text>
                <Text style={styles.welcomeTitle}>¡Hola, {user?.username}! 👋</Text>
                <Text style={styles.welcomeSubtitle}>Listo para jugar con tus amigos</Text>
              </View>
            </View>
          </Card>

          {/* Actions */}
          <Text style={styles.sectionTitle}>¿Qué quieres hacer?</Text>

          <ActionCard
            icon="🌐"
            title="Partida Online"
            description="Crea una partida y comparte el código con tus amigos"
            onPress={() => router.push('/create-game')}
          />

          <ActionCard
            icon="📱"
            title="Juego Local"
            description="Juega en un solo dispositivo pasándolo por turnos"
            onPress={() => router.push('/local-game')}
          />

          <ActionCard
            icon="📖"
            title="¿Cómo Jugar?"
            description="Aprende las reglas y consejos para ganar"
            onPress={() => router.push('/how-to-play')}
          />

          {/* Stats */}
          <Text style={styles.sectionTitle}>Tus estadísticas</Text>

          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{user?.gamesPlayed || 0}</Text>
              <Text style={styles.statLabel}>Partidas Jugadas</Text>
            </Card>

            <Card style={styles.statCard}>
              <Text style={[styles.statValue, styles.successText]}>{user?.gamesWon || 0}</Text>
              <Text style={styles.statLabel}>Partidas Ganadas</Text>
            </Card>
          </View>

          {/* Join Game */}
          <Card style={styles.joinGameCard}>
            <Text style={styles.joinGameTitle}>¿Tienes un código de sala?</Text>
            <Text style={styles.joinGameDescription}>
              Si alguien te compartió un código, únete a su partida
            </Text>
            <View style={styles.joinButtonContainer}>
              <Button
                title="Unirse a Partida"
                onPress={() => router.push('/create-game?mode=join')}
                style={{ width: '100%' }}
              />
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontFamily: 'Truculenta-Bold',
    textTransform: 'uppercase',
  },
  welcomeCard: {
    marginBottom: 24,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 30,
  },
  welcomeText: {
    flex: 1,
  },
  welcomeLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    fontFamily: 'Truculenta-Bold',
  },
  welcomeTitle: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Truculenta-Bold',
    textShadowColor: '#111',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },
  welcomeSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontFamily: 'Truculenta',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 16,
    marginTop: 8,
    textTransform: 'uppercase',
    fontFamily: 'Truculenta-Bold',
    textShadowColor: '#111',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  statValue: {
    fontSize: 28,
    color: '#fff',
    fontFamily: 'Truculenta-Bold',
    textShadowColor: '#111',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },
  successText: {
    color: theme.colors.success,
  },
  statLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    fontFamily: 'Truculenta',
  },
  joinGameCard: {
    marginTop: 8,
  },
  joinGameTitle: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    fontFamily: 'Truculenta-Bold',
    textShadowColor: '#111',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },
  joinGameDescription: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Truculenta',
  },
  joinButtonContainer: {
    marginTop: 16,
  },
});

