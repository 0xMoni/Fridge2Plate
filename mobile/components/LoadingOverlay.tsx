import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/constants';

interface LoadingOverlayProps {
  message?: string;
}

export default function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  content: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  message: {
    marginTop: 14,
    fontSize: 15,
    color: COLORS.secondaryText,
    fontWeight: '500',
  },
});
