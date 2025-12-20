import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

export function Card({ children, style = {}, onPress }) {
  const Container = onPress ? TouchableOpacity : View;
  
  return (
    <Container 
      style={[styles.card, style]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      {children}
    </Container>
  );
}

export function ActionCard({ icon, title, description, onPress, badge }) {
  return (
    <TouchableOpacity 
      style={styles.actionCard} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.actionCardIcon}>{icon}</Text>
      <View style={styles.actionCardContent}>
        <Text style={styles.actionCardTitle}>{title}</Text>
        <Text style={styles.actionCardDescription}>{description}</Text>
        {badge && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.actionCardArrow}>→</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(30, 37, 74, 0.8)',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  actionCard: {
    backgroundColor: 'rgba(30, 37, 74, 0.8)',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 32,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  actionCardIcon: {
    fontSize: 36,
    marginRight: 16,
  },
  actionCardContent: {
    flex: 1,
  },
  actionCardTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
    fontFamily: 'Truculenta-Bold',
  },
  actionCardDescription: {
    color: '#B0B0B0',
    fontSize: 14,
    fontFamily: 'Truculenta',
  },
  badgeContainer: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#38bdf8',
    fontSize: 12,
    fontFamily: 'Truculenta-Bold',
  },
  actionCardArrow: {
    color: '#B0B0B0',
    fontSize: 20,
    marginLeft: 16,
  },
});

