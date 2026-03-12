import { onSchedule } from 'firebase-functions/v2/scheduler';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import axios from 'axios';
import { addDays, startOfDay, format } from 'date-fns';

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const NOTIFICATION_MESSAGES: Record<string, (itemName: string) => string> = {
  '3day': (itemName) => `Heads up: ${itemName} expires in 3 days`,
  '1day': (itemName) => `${itemName} expires tomorrow!`,
  'today': (itemName) => `${itemName} expires today - use it or lose it!`,
};

export const checkExpiry = onSchedule('every 1 hours', async () => {
  const now = new Date();
  const today = startOfDay(now);
  const threeDaysFromNow = addDays(today, 4); // end of the 3-day window

  // expiryDate is stored as ISO string (YYYY-MM-DD), so query as string comparison
  const todayStr = format(today, 'yyyy-MM-dd');
  const futureStr = format(threeDaysFromNow, 'yyyy-MM-dd');

  const itemsSnapshot = await db
    .collection('items')
    .where('expiryDate', '>=', todayStr)
    .where('expiryDate', '<=', futureStr)
    .get();

  if (itemsSnapshot.empty) {
    console.log('No items expiring within the next 3 days.');
    return;
  }

  const itemIds = itemsSnapshot.docs.map((doc) => doc.id);

  // Process notifications in batches (Firestore 'in' queries support up to 30 values)
  const batchSize = 30;
  for (let i = 0; i < itemIds.length; i += batchSize) {
    const batchIds = itemIds.slice(i, i + batchSize);

    const notificationsSnapshot = await db
      .collection('notifications')
      .where('itemId', 'in', batchIds)
      .where('sent', '==', false)
      .where('scheduledDate', '<=', now.toISOString())
      .get();

    if (notificationsSnapshot.empty) {
      continue;
    }

    for (const notificationDoc of notificationsSnapshot.docs) {
      const notification = notificationDoc.data();
      const { userId, itemName, type } = notification;

      try {
        // Look up the user's push token
        const userDoc = await db.collection('users').doc(userId).get();

        if (!userDoc.exists) {
          console.warn(`User ${userId} not found, skipping notification.`);
          continue;
        }

        const userData = userDoc.data();
        const pushToken = userData?.pushToken;

        if (!pushToken) {
          console.warn(`No pushToken for user ${userId}, skipping notification.`);
          continue;
        }

        // Build the notification message
        const messageBuilder = NOTIFICATION_MESSAGES[type];
        if (!messageBuilder) {
          console.warn(`Unknown notification type: ${type}, skipping.`);
          continue;
        }

        const body = messageBuilder(itemName);

        // Send Expo push notification
        await axios.post(EXPO_PUSH_URL, {
          to: pushToken,
          title: 'Expiry Reminder',
          body,
          data: {
            type,
            itemId: notification.itemId,
          },
        });

        // Mark notification as sent
        await notificationDoc.ref.update({
          sent: true,
          sentAt: Timestamp.now(),
        });

        console.log(`Sent "${type}" notification for item "${itemName}" to user ${userId}.`);
      } catch (error) {
        console.error(
          `Failed to send notification ${notificationDoc.id}:`,
          error
        );
      }
    }
  }
});
