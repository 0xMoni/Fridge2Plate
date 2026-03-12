import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import type { FoodItem } from '../types';
import { daysUntilExpiry, formatExpiryDate, formatDaysLeft } from '../utils/dateHelpers';
import { getExpiryColor } from '../utils/expiryColors';
import { COLORS } from '../utils/constants';
import ExpiryBadge from './ExpiryBadge';

interface ItemCardProps {
  item: FoodItem;
  onPress: () => void;
  onLongPress?: () => void;
}

export default function ItemCard({ item, onPress, onLongPress }: ItemCardProps) {
  const days = daysUntilExpiry(item.expiryDate);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderText}>
            {item.itemName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.itemName}
        </Text>
        <Text style={styles.expiryDate}>{formatExpiryDate(item.expiryDate)}</Text>
        <Text
          style={[styles.daysLeft, { color: getExpiryColor(item.status) }]}
        >
          {formatDaysLeft(days)}
        </Text>
      </View>

      <View style={styles.badgeContainer}>
        <ExpiryBadge status={item.status} daysLeft={days} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardPressed: {
    opacity: 0.7,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: COLORS.border,
  },
  placeholderImage: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  expiryDate: {
    fontSize: 13,
    color: COLORS.secondaryText,
    marginBottom: 2,
  },
  daysLeft: {
    fontSize: 13,
    fontWeight: '500',
  },
  badgeContainer: {
    marginLeft: 8,
  },
});
