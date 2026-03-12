import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ExpiryStatus } from '../types';
import { getExpiryColor, getExpiryBackgroundColor } from '../utils/expiryColors';

interface ExpiryBadgeProps {
  status: ExpiryStatus;
  daysLeft: number;
}

const STATUS_LABELS: Record<ExpiryStatus, string> = {
  fresh: 'Fresh',
  expiring_soon: 'Expiring Soon',
  expired: 'Expired',
};

export default function ExpiryBadge({ status }: ExpiryBadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: getExpiryBackgroundColor(status) },
      ]}
    >
      <Text style={[styles.text, { color: getExpiryColor(status) }]}>
        {STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
