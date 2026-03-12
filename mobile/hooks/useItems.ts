import { useEffect, useCallback } from 'react';
import { subscribeToItems, getUserItems } from '../services/firestore';
import { useItemsStore } from '../store/useItemsStore';
import { useAuthStore } from '../store/useAuthStore';
import { getExpiryStatus } from '../utils/dateHelpers';
import type { FoodItem } from '../types';

export function useItems() {
  const { items, loading, setItems, setLoading, setError } = useItemsStore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeToItems(user.uid, (rawItems) => {
      const enriched: FoodItem[] = rawItems.map((item) => ({
        ...item,
        status: getExpiryStatus(item.expiryDate),
      }));
      setItems(enriched);
    });

    return unsubscribe;
  }, [user, setItems, setLoading, setError]);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const rawItems = await getUserItems(user.uid);
      const enriched: FoodItem[] = rawItems.map((item) => ({
        ...item,
        status: getExpiryStatus(item.expiryDate),
      }));
      setItems(enriched);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load items';
      setError(message);
    }
  }, [user, setItems, setLoading, setError]);

  return { items, loading, refresh };
}
