import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { COLORS } from '../utils/constants';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [prefs, setPrefs] = useState({
    threeDayBefore: true,
    oneDayBefore: true,
    onExpiry: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists() && snap.data().notificationPrefs) {
          setPrefs(snap.data().notificationPrefs);
        }
      } catch {
        // Use defaults
      }
    })();
  }, [user]);

  const togglePref = async (key: keyof typeof prefs) => {
    if (!user) return;
    const previous = { ...prefs };
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        [`notificationPrefs.${key}`]: updated[key],
      });
    } catch {
      setPrefs(previous);
      Alert.alert('Error', 'Failed to update preference.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Preferences</Text>
        <Text style={styles.sectionDescription}>
          Choose when to receive expiry reminders.
        </Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>3 days before expiry</Text>
            <Text style={styles.settingHint}>
              Get notified when items expire in 3 days
            </Text>
          </View>
          <Switch
            value={prefs.threeDayBefore}
            onValueChange={() => togglePref('threeDayBefore')}
            trackColor={{ false: COLORS.border, true: '#93C5FD' }}
            thumbColor={prefs.threeDayBefore ? COLORS.primary : '#F4F3F4'}
            disabled={saving}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>1 day before expiry</Text>
            <Text style={styles.settingHint}>
              Get notified when items expire tomorrow
            </Text>
          </View>
          <Switch
            value={prefs.oneDayBefore}
            onValueChange={() => togglePref('oneDayBefore')}
            trackColor={{ false: COLORS.border, true: '#93C5FD' }}
            thumbColor={prefs.oneDayBefore ? COLORS.primary : '#F4F3F4'}
            disabled={saving}
          />
        </View>

        <View style={[styles.settingRow, styles.settingRowLast]}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>On expiry day</Text>
            <Text style={styles.settingHint}>
              Get notified when items expire today
            </Text>
          </View>
          <Switch
            value={prefs.onExpiry}
            onValueChange={() => togglePref('onExpiry')}
            trackColor={{ false: COLORS.border, true: '#93C5FD' }}
            thumbColor={prefs.onExpiry ? COLORS.primary : '#F4F3F4'}
            disabled={saving}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        {user && (
          <View style={styles.accountInfo}>
            <Text style={styles.accountName}>
              {user.displayName || 'User'}
            </Text>
            <Text style={styles.accountEmail}>{user.email}</Text>
          </View>
        )}

        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.versionText}>Fridge2Plate Expiry v1.0.0</Text>
      </View>
    </ScrollView>
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
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.secondaryText,
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  settingHint: {
    fontSize: 13,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  accountInfo: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 16,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  accountEmail: {
    fontSize: 14,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  signOutButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.expired,
  },
  signOutText: {
    color: COLORS.expired,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 13,
    color: COLORS.secondaryText,
  },
});
