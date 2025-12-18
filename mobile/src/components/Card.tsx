import React, { ReactNode } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { Surface } from 'react-native-paper';
import { colors } from '../theme';

interface CardProps {
  children: ReactNode;
  style?: any;
  onPress?: () => void;
}

export function Card({ children, style, onPress }: CardProps) {
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Surface style={[styles.card, style]} elevation={8}>
          {children}
        </Surface>
      </TouchableOpacity>
    );
  }

  return (
    <Surface style={[styles.card, style]} elevation={8}>
      {children}
    </Surface>
  );
}

interface ActionCardProps {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
  badge?: string;
}

export function ActionCard({ icon, title, description, onPress, badge }: ActionCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Surface style={styles.actionCard} elevation={8}>
        <View style={styles.actionCardContent}>
          <Text style={styles.actionIcon}>{icon}</Text>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>{title}</Text>
            <Text style={styles.actionDescription}>{description}</Text>
            {badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            )}
          </View>
          <Text style={styles.arrow}>→</Text>
        </View>
      </Surface>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceDark || 'rgba(30, 37, 74, 0.9)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  actionCard: {
    backgroundColor: colors.surfaceDark || 'rgba(30, 37, 74, 0.9)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  actionIcon: {
    fontSize: 36,
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  actionDescription: {
    color: colors.textMuted,
    fontSize: 14,
  },
  badge: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  badgeText: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: '500',
  },
  arrow: {
    color: colors.textMuted,
    fontSize: 20,
  },
});
