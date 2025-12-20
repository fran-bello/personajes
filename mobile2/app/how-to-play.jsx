import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { theme } from '../src/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HowToPlay() {
  const router = useRouter();

  const rounds = [
    {
      number: 1,
      icon: '🗣️',
      title: 'DESCRIBE',
      description: 'Puedes usar todas las palabras que quieras para describir al personaje',
      rules: [
        'No digas el nombre del personaje',
        'No uses rimas ni deletrees',
        'Sé creativo con las descripciones'
      ]
    },
    {
      number: 2,
      icon: '☝️',
      title: 'UNA PALABRA',
      description: 'Solo puedes decir UNA palabra para que adivinen',
      rules: [
        'Elige la palabra más representativa',
        'Puedes repetir la misma palabra',
        'No puedes hacer gestos'
      ]
    },
    {
      number: 3,
      icon: '🎭',
      title: 'MÍMICA',
      description: 'Solo puedes usar gestos y movimientos. ¡Prohibido hablar!',
      rules: [
        'No puedes emitir sonidos',
        'Usa todo tu cuerpo',
        'Puedes señalar objetos del entorno'
      ]
    }
  ];

  return (
    <LinearGradient
      colors={theme.gradients.background}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <Image
                source={require('../assets/img/logo-personajes.png')}
                style={styles.logo}
              />
              <Text style={styles.headerTitle}>¿Cómo Jugar?</Text>
            </View>
            <Button 
              title="Volver" 
              onPress={() => router.back()} 
              variant="secondary" 
              size="small" 
            />
          </View>

          {/* Objetivo */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🎯 Objetivo del Juego</Text>
            <Text style={styles.introText}>
              <Text style={{fontWeight: 'bold'}}>Personajes</Text> es un juego de adivinanzas por equipos donde debes hacer que tu equipo 
              adivine el mayor número de personajes posibles en el tiempo límite. Cada ronda tiene reglas diferentes 
              que hacen el juego más desafiante.
            </Text>
          </Card>

          {/* Cómo Funciona */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>📋 Cómo Funciona</Text>
            <View style={styles.stepItem}>
              <View style={styles.stepNumberContainer}><Text style={styles.stepNumber}>1</Text></View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Forma tu equipo</Text>
                <Text style={styles.stepText}>Puedes jugar en equipos o parejas. Cada equipo competirá para adivinar más personajes.</Text>
              </View>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumberContainer}><Text style={styles.stepNumber}>2</Text></View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Selecciona personajes</Text>
                <Text style={styles.stepText}>Elige personajes de una categoría predefinida o crea tus propios personajes personalizados.</Text>
              </View>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumberContainer}><Text style={styles.stepNumber}>3</Text></View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Juega por turnos</Text>
                <Text style={styles.stepText}>Cada jugador tiene un tiempo límite para hacer adivinar personajes a su equipo. Los turnos alternan entre equipos.</Text>
              </View>
            </View>
          </Card>

          {/* Las 3 Rondas */}
          <Text style={styles.mainSectionTitle}>🎮 Las 3 Rondas</Text>
          {rounds.map((round) => (
            <Card key={round.number} style={styles.roundCard}>
              <View style={styles.roundHeader}>
                <Text style={styles.roundIcon}>{round.icon}</Text>
                <View>
                  <Text style={styles.roundLabel}>RONDA {round.number}</Text>
                  <Text style={styles.roundTitle}>{round.title}</Text>
                </View>
              </View>
              <Text style={styles.roundDescription}>{round.description}</Text>
              <View style={styles.rulesContainer}>
                <Text style={styles.rulesLabel}>Reglas:</Text>
                {round.rules.map((rule, index) => (
                  <Text key={index} style={styles.ruleItem}>• {rule}</Text>
                ))}
              </View>
            </Card>
          ))}

          {/* Consejos */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>💡 Consejos para Ganar</Text>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>🎯</Text>
              <Text style={styles.tipText}>
                <Text style={{fontWeight: 'bold'}}>Sé estratégico:</Text> En la ronda 1, usa descripciones claras. En la ronda 2, elige la palabra más representativa.
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>⏱️</Text>
              <Text style={styles.tipText}>
                <Text style={{fontWeight: 'bold'}}>Gestiona el tiempo:</Text> No te detengas mucho en un personaje difícil. Pásalo y continúa con otros.
              </Text>
            </View>
          </Card>

          <Button
            title="Volver al Dashboard"
            onPress={() => router.back()}
            style={styles.footerButton}
          />
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
    marginBottom: 20,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    color: '#fff',
    fontFamily: 'Truculenta-Bold',
    textTransform: 'uppercase',
    textShadowColor: '#111',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },
  sectionCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 12,
    fontFamily: 'Truculenta-Bold',
    textShadowColor: '#111',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },
  introText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Truculenta',
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumber: {
    color: '#fff',
    fontFamily: 'Truculenta-Bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 4,
    fontFamily: 'Truculenta-Bold',
  },
  stepText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontFamily: 'Truculenta',
  },
  mainSectionTitle: {
    fontSize: 22,
    color: '#fff',
    marginBottom: 16,
    marginTop: 8,
    textTransform: 'uppercase',
    fontFamily: 'Truculenta-Bold',
    textShadowColor: '#111',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },
  roundCard: {
    marginBottom: 16,
  },
  roundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  roundIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  roundLabel: {
    color: theme.colors.primary,
    fontSize: 12,
    fontFamily: 'Truculenta-Bold',
  },
  roundTitle: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Truculenta-Bold',
    textShadowColor: '#111',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },
  roundDescription: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginBottom: 12,
    fontFamily: 'Truculenta',
  },
  rulesContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 12,
    borderRadius: 8,
  },
  rulesLabel: {
    color: '#fff',
    marginBottom: 4,
    fontFamily: 'Truculenta-Bold',
  },
  ruleItem: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginBottom: 2,
    fontFamily: 'Truculenta',
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontFamily: 'Truculenta',
  },
  footerButton: {
    marginTop: 20,
  },
});

