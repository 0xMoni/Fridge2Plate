import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useItemsStore } from '../../store/useItemsStore';
import {
  updateItem as firestoreUpdateItem,
  deleteItem as firestoreDeleteItem,
} from '../../services/firestore';
import ExpiryBadge from '../../components/ExpiryBadge';
import LoadingOverlay from '../../components/LoadingOverlay';
import {
  daysUntilExpiry,
  getExpiryStatus,
  formatDaysLeft,
} from '../../utils/dateHelpers';
import { getExpiryColor } from '../../utils/expiryColors';
import { COLORS } from '../../utils/constants';

export default function ItemDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const items = useItemsStore((s) => s.items);
  const storeUpdateItem = useItemsStore((s) => s.updateItem);
  const storeRemoveItem = useItemsStore((s) => s.removeItem);
  const item = items.find((i) => i.id === id);

  const [itemName, setItemName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setItemName(item.itemName);
      setExpiryDate(item.expiryDate);
    }
  }, [item]);

  if (!item) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Item not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const days = daysUntilExpiry(expiryDate || item.expiryDate);
  const status = getExpiryStatus(expiryDate || item.expiryDate);

  const handleSave = async () => {
    if (!itemName.trim()) {
      Alert.alert('Error', 'Item name is required.');
      return;
    }
    if (!expiryDate.trim()) {
      Alert.alert('Error', 'Expiry date is required.');
      return;
    }

    setSaving(true);
    try {
      const updates = {
        itemName: itemName.trim(),
        expiryDate: expiryDate.trim(),
        status: getExpiryStatus(expiryDate.trim()),
        updatedAt: new Date().toISOString(),
      };
      await firestoreUpdateItem(item.id, updates);
      storeUpdateItem(item.id, updates);
      Alert.alert('Saved', 'Item updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to update item.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.itemName}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await firestoreDeleteItem(item.id);
              storeRemoveItem(item.id);
              router.back();
            } catch {
              Alert.alert('Error', 'Failed to delete item.');
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderLetter}>
              {item.itemName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.statusRow}>
          <ExpiryBadge status={status} daysLeft={days} />
          <Text style={[styles.daysLeft, { color: getExpiryColor(status) }]}>
            {formatDaysLeft(days)}
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Item Name</Text>
          <TextInput
            style={styles.input}
            value={itemName}
            onChangeText={setItemName}
            placeholder="Item name"
            placeholderTextColor={COLORS.secondaryText}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Expiry Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={expiryDate}
            onChangeText={setExpiryDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.secondaryText}
            keyboardType="numbers-and-punctuation"
          />
        </View>

        <Text style={styles.metaText}>
          Added: {new Date(item.createdAt).toLocaleDateString()}
        </Text>

        <Pressable
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Text>
        </Pressable>

        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Item</Text>
        </Pressable>
      </ScrollView>

      {saving && <LoadingOverlay />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.secondaryText,
    marginBottom: 12,
  },
  backLink: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    marginBottom: 20,
    backgroundColor: COLORS.border,
  },
  imagePlaceholder: {
    width: '100%',
    height: 140,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  placeholderLetter: {
    fontSize: 48,
    color: COLORS.primary,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  daysLeft: {
    fontSize: 15,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.secondaryText,
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
  },
  deleteButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.expired,
  },
  deleteButtonText: {
    color: COLORS.expired,
    fontSize: 17,
    fontWeight: '700',
  },
});
