import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/context/AuthContext';
import { Button, ActionCard, Card } from '../../src/components';
import { colors } from '../../src/theme';

export default function DashboardScreen() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <LinearGradient
      colors={['#1E254A', '#28325C', '#2F90B1']}
      locations={[0, 0.5, 1]}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>🎭</Text>
            <Text style={styles.title}>Personajes</Text>
          </View>
          <Button title="Salir" onPress={handleLogout} variant="secondary" size="small" />
        </View>

        {/* Welcome Card */}
        <Card style={styles.welcomeCard}>
          <View style={styles.welcomeContent}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarEmoji}>👤</Text>
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
          icon="👤"
          title="Gestionar Personajes"
          description="Agrega, edita o elimina tus personajes personalizados"
          badge={`${user?.characters?.length || 0} personajes`}
          onPress={() => router.push('/(app)/characters')}
        />

        <ActionCard
          icon="🌐"
          title="Partida Online"
          description="Crea una partida y comparte el código con tus amigos"
          onPress={() => router.push('/(app)/create-game')}
        />

        <ActionCard
          icon="📱"
          title="Juego Local"
          description="Juega en un solo dispositivo pasándolo por turnos"
          onPress={() => router.push('/local-game')}
        />

        {/* Stats */}
        <Text style={styles.sectionTitle}>Tus estadísticas</Text>
        
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{user?.gamesPlayed || 0}</Text>
            <Text style={styles.statLabel}>Partidas Jugadas</Text>
          </Card>
          
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {user?.gamesWon || 0}
            </Text>
            <Text style={styles.statLabel}>Partidas Ganadas</Text>
          </Card>
        </View>

        {/* Join Game */}
        <Card style={styles.joinCard}>
          <Text style={styles.joinTitle}>¿Tienes un código de sala?</Text>
          <Text style={styles.joinSubtitle}>
            Si alguien te compartió un código, únete a su partida
          </Text>
          <Button
            title="Unirse a Partida"
            onPress={() => router.push('/(app)/create-game')}
            variant="outline"
            style={styles.joinButton}
          />
        </Card>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    fontSize: 40,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  welcomeCard: {
    marginBottom: 24,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarEmoji: {
    fontSize: 32,
  },
  welcomeText: {
    flex: 1,
  },
  welcomeLabel: {
    fontSize: 14,
    color: colors.primaryLight,
    fontWeight: '500',
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 2,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  joinCard: {
    marginTop: 24,
  },
  joinTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  joinSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 16,
  },
  joinButton: {
    marginTop: 8,
  },
});
