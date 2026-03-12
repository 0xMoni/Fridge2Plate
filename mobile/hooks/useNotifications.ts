import { useEffect } from 'react';
import {
  registerForPushNotifications,
  setupNotificationHandlers,
} from '../services/notifications';
import { updatePushToken } from '../services/firestore';
import { useAuthStore } from '../store/useAuthStore';

export function useNotifications() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    setupNotificationHandlers();
  }, []);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    (async () => {
      try {
        const token = await registerForPushNotifications();
        if (token && !cancelled) {
          await updatePushToken(user.uid, token);
        }
      } catch (err) {
        console.warn('Failed to register push notifications:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);
}
