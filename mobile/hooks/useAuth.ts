import { useEffect } from 'react';
import { onAuthChange } from '../services/auth';
import { useAuthStore } from '../store/useAuthStore';
import type { User } from '../types';

export function useAuth() {
  const { user, loading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      if (firebaseUser) {
        const appUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || undefined,
          createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
          notificationPrefs: {
            threeDayBefore: true,
            oneDayBefore: true,
            onExpiry: true,
          },
        };
        setUser(appUser);
      } else {
        setUser(null);
      }
    });

    return unsubscribe;
  }, [setUser, setLoading]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
  };
}
