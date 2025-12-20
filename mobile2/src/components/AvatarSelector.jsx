import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { theme } from '../theme';

const AVATARS = [
  '🦊', '🐼', '🦁', '🐯', '🐻',
  '🐨', '🐸', '🦉', '🦄', '🐲'
];

export default function AvatarSelector({ selectedAvatar, onSelect }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecciona tu avatar</Text>
      <View style={styles.grid}>
        {AVATARS.map((avatar, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.avatarOption,
              selectedAvatar === avatar && styles.selected
            ]}
            onPress={() => onSelect(avatar)}
          >
            <Text style={styles.avatarEmoji}>{avatar}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  title: {
    color: '#E0E0E0',
    fontSize: 14,
    marginBottom: 12,
    fontFamily: 'Truculenta-Bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  avatarOption: {
    width: 45,
    height: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
  },
  avatarEmoji: {
    fontSize: 24,
  },
});

export { AVATARS };

