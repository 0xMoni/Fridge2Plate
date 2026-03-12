import { create } from 'zustand';
import type { FoodItem } from '../types';

interface ItemsState {
  items: FoodItem[];
  loading: boolean;
  error: string | null;
  setItems: (items: FoodItem[]) => void;
  addItem: (item: FoodItem) => void;
  updateItem: (id: string, data: Partial<FoodItem>) => void;
  removeItem: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useItemsStore = create<ItemsState>((set) => ({
  items: [],
  loading: false,
  error: null,

  setItems: (items) => set({ items, loading: false }),

  addItem: (item) =>
    set((state) => ({ items: [...state.items, item] })),

  updateItem: (id, data) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...data } : item
      ),
    })),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),
}));
