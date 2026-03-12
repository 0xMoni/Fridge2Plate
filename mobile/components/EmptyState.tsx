import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/constants';

interface EmptyStateProps {
  message: string;
  icon?: string;
}

export default function EmptyState({ message, icon }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon || '📦'}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  icon: {
    fontSize: 56,
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: COLORS.secondaryText,
    textAlign: 'center',
    lineHeight: 24,
  },
});
