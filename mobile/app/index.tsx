import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useItems } from '../hooks/useItems';
import { useAuthStore } from '../store/useAuthStore';
import { deleteItem } from '../services/firestore';
import { useItemsStore } from '../store/useItemsStore';
import ItemCard from '../components/ItemCard';
import EmptyState from '../components/EmptyState';
import type { FoodItem } from '../types';
import { COLORS } from '../utils/constants';

export default function DashboardScreen() {
  const { items, loading, refresh } = useItems();
  const user = useAuthStore((s) => s.user);
  const removeItem = useItemsStore((s) => s.removeItem);
  const router = useRouter();

  const handleItemPress = useCallback(
    (item: FoodItem) => {
      router.push(`/item/${item.id}`);
    },
    [router]
  );

  const handleItemLongPress = useCallback(
    (item: FoodItem) => {
      Alert.alert(
        'Delete Item',
        `Are you sure you want to delete "${item.itemName}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteItem(item.id);
                removeItem(item.id);
              } catch (err) {
                Alert.alert('Error', 'Failed to delete item.');
              }
            },
          },
        ]
      );
    },
    [removeItem]
  );

  const renderItem = useCallback(
    ({ item }: { item: FoodItem }) => (
      <ItemCard
        item={item}
        onPress={() => handleItemPress(item)}
        onLongPress={() => handleItemLongPress(item)}
      />
    ),
    [handleItemPress, handleItemLongPress]
  );

  const keyExtractor = useCallback((item: FoodItem) => item.id, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Fridge2Plate</Text>
          {user?.displayName && (
            <Text style={styles.greeting}>Hello, {user.displayName}</Text>
          )}
        </View>
        <Pressable
          style={styles.settingsButton}
          onPress={() => router.push('/settings')}
          hitSlop={8}
        >
          <Text style={styles.settingsIcon}>&#9881;</Text>
        </Pressable>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={items.length === 0 ? styles.emptyList : styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            message="No food items yet. Tap the + button to scan expiry dates or add items manually."
            icon="🍎"
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        style={styles.fab}
        onPress={() => router.push('/scan')}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingsIcon: {
    fontSize: 22,
    color: COLORS.secondaryText,
  },
  list: {
    paddingBottom: 100,
  },
  emptyList: {
    flexGrow: 1,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 32,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    fontSize: 30,
    color: COLORS.white,
    fontWeight: '300',
    lineHeight: 34,
  },
});
