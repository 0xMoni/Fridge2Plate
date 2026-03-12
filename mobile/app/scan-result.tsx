import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addItem } from '../services/firestore';
import { useAuthStore } from '../store/useAuthStore';
import { getExpiryStatus } from '../utils/dateHelpers';
import LoadingOverlay from '../components/LoadingOverlay';
import type { ScanResult } from '../types';
import { COLORS } from '../utils/constants';

interface EditableItem {
  key: string;
  itemName: string;
  expiryDate: string;
}

export default function ScanResultScreen() {
  const { results: resultsParam } = useLocalSearchParams<{ results: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [saving, setSaving] = useState(false);

  const initialResults: ScanResult[] = useMemo(() => {
    try {
      return JSON.parse(resultsParam || '[]');
    } catch {
      return [];
    }
  }, [resultsParam]);

  const [items, setItems] = useState<EditableItem[]>(() =>
    initialResults.length > 0
      ? initialResults.map((r, i) => ({
          key: `scan-${i}`,
          itemName: r.itemName,
          expiryDate: r.expiryDate,
        }))
      : [
          {
            key: 'manual-0',
            itemName: '',
            expiryDate: '',
          },
        ]
  );

  const updateField = (
    key: string,
    field: 'itemName' | 'expiryDate',
    value: string
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, [field]: value } : item
      )
    );
  };

  const removeRow = (key: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.key !== key));
  };

  const addManualRow = () => {
    setItems((prev) => [
      ...prev,
      {
        key: `manual-${Date.now()}`,
        itemName: '',
        expiryDate: '',
      },
    ]);
  };

  const handleSaveAll = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be signed in to save items.');
      return;
    }

    const validItems = items.filter(
      (item) => item.itemName.trim() && item.expiryDate.trim()
    );

    if (validItems.length === 0) {
      Alert.alert('Error', 'Please enter at least one item with a name and expiry date.');
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const promises = validItems.map((item) =>
        addItem({
          userId: user.uid,
          itemName: item.itemName.trim(),
          expiryDate: item.expiryDate.trim(),
          createdAt: now,
          updatedAt: now,
          status: getExpiryStatus(item.expiryDate.trim()),
        })
      );
      await Promise.all(promises);
      Alert.alert('Success', `${validItems.length} item(s) saved.`, [
        { text: 'OK', onPress: () => router.replace('/') },
      ]);
    } catch (err) {
      Alert.alert('Error', 'Failed to save items. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Review Items</Text>
        <Text style={styles.description}>
          Verify the detected items below. You can edit names and dates, or add
          items that were missed.
        </Text>

        {items.map((item, index) => (
          <View key={item.key} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemNumber}>Item {index + 1}</Text>
              {items.length > 1 && (
                <Pressable onPress={() => removeRow(item.key)} hitSlop={8}>
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Item Name</Text>
              <TextInput
                style={styles.input}
                value={item.itemName}
                onChangeText={(v) => updateField(item.key, 'itemName', v)}
                placeholder="e.g. Milk, Yogurt, Chicken"
                placeholderTextColor={COLORS.secondaryText}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Expiry Date</Text>
              <TextInput
                style={styles.input}
                value={item.expiryDate}
                onChangeText={(v) => updateField(item.key, 'expiryDate', v)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.secondaryText}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
        ))}

        <Pressable style={styles.addButton} onPress={addManualRow}>
          <Text style={styles.addButtonText}>+ Add Another Item</Text>
        </Pressable>

        <Pressable style={styles.saveButton} onPress={handleSaveAll}>
          <Text style={styles.saveButtonText}>Save All</Text>
        </Pressable>
      </ScrollView>

      {saving && <LoadingOverlay message="Saving items..." />}
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
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: COLORS.secondaryText,
    lineHeight: 22,
    marginBottom: 24,
  },
  itemCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  removeText: {
    fontSize: 14,
    color: COLORS.expired,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondaryText,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  addButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
  },
});
