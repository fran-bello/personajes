import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';
import { Button, Input, Card } from '../../src/components';
import { colors } from '../../src/theme';

export default function CharactersScreen() {
  const [characters, setCharacters] = useState<string[]>([]);
  const [newCharacter, setNewCharacter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const { fetchUser } = useAuth();

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    try {
      const response = await api.getCharacters();
      setCharacters(response.characters);
    } catch (err) {
      setError('Error al cargar personajes');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newCharacter.trim()) return;

    setAdding(true);
    setError('');

    try {
      const response = await api.addCharacter(newCharacter.trim());
      setCharacters(response.characters);
      setNewCharacter('');
      await fetchUser();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al agregar personaje');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (character: string) => {
    Alert.alert(
      'Eliminar personaje',
      `¿Estás seguro de eliminar "${character}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.deleteCharacter(character);
              setCharacters(response.characters);
              await fetchUser();
            } catch (err) {
              setError('Error al eliminar personaje');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando personajes...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <Text style={styles.headerIcon}>👤</Text>
            <Text style={styles.title}>Mis Personajes</Text>
          </View>
          <Button title="Volver" onPress={() => router.back()} variant="secondary" size="small" />
        </View>

        {/* Error */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Add Form */}
        <Card style={styles.addCard}>
          <Text style={styles.addTitle}>Agregar nuevo personaje</Text>
          <View style={styles.addRow}>
            <View style={styles.inputContainer}>
              <Input
                placeholder="Nombre del personaje"
                value={newCharacter}
                onChangeText={setNewCharacter}
                style={styles.input}
              />
            </View>
            <Button
              title="Agregar"
              onPress={handleAdd}
              loading={adding}
              disabled={adding || !newCharacter.trim()}
            />
          </View>
        </Card>

        {/* Count */}
        <View style={styles.countRow}>
          <Text style={styles.countText}>Total: {characters.length} personajes</Text>
          {characters.length < 10 && (
            <Text style={styles.warningText}>Necesitas al menos 10 para jugar online</Text>
          )}
        </View>

        {/* List */}
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {characters.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🎭</Text>
              <Text style={styles.emptyTitle}>Sin personajes</Text>
              <Text style={styles.emptyText}>
                Agrega algunos personajes para comenzar a jugar
              </Text>
            </Card>
          ) : (
            <View style={styles.characterGrid}>
              {characters.map((character, index) => (
                <TouchableOpacity
                  key={index}
                  onLongPress={() => handleDelete(character)}
                  style={styles.characterItem}
                >
                  <Text style={styles.characterName}>{character}</Text>
                  <TouchableOpacity onPress={() => handleDelete(character)}>
                    <Text style={styles.deleteButton}>✕</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={styles.bottomSpace} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    marginTop: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
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
  addCard: {
    marginBottom: 16,
  },
  addTitle: {
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  inputContainer: {
    flex: 1,
    marginRight: 12,
  },
  input: {
    marginBottom: 0,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  countText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  warningText: {
    color: colors.warning,
    fontSize: 12,
  },
  list: {
    flex: 1,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
  },
  characterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  characterItem: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  characterName: {
    color: colors.text,
    marginRight: 8,
  },
  deleteButton: {
    color: colors.danger,
    fontSize: 12,
  },
  bottomSpace: {
    height: 80,
  },
});
