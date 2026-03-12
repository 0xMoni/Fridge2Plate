import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { subDays, startOfDay } from 'date-fns';

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

interface NotificationData {
  userId: string;
  itemId: string;
  itemName: string;
  scheduledDate: string;
  type: string;
  sent: boolean;
  sentAt: null;
}

export const onItemCreate = onDocumentCreated('items/{itemId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.log('No data associated with the event.');
    return;
  }

  const data = snapshot.data();
  const itemId = event.params.itemId;
  const { userId, itemName, expiryDate } = data;

  if (!userId || !itemName || !expiryDate) {
    console.warn('Item missing required fields (userId, itemName, expiryDate). Skipping.');
    return;
  }

  // Convert expiryDate to a JS Date
  // Supports both Firestore Timestamp and ISO string
  let expiry: Date;
  if (expiryDate.toDate && typeof expiryDate.toDate === 'function') {
    expiry = expiryDate.toDate();
  } else {
    expiry = new Date(expiryDate);
  }

  const expiryDay = startOfDay(expiry);
  const now = new Date();

  // Define the three notification schedules
  const schedules: { type: string; date: Date }[] = [
    { type: '3day', date: startOfDay(subDays(expiryDay, 3)) },
    { type: '1day', date: startOfDay(subDays(expiryDay, 1)) },
    { type: 'today', date: expiryDay },
  ];

  // Only create notifications for dates in the future
  const futureSchedules = schedules.filter((s) => s.date > now);

  if (futureSchedules.length === 0) {
    console.log(`No future notification dates for item "${itemName}". Skipping.`);
    return;
  }

  const batch = db.batch();

  for (const schedule of futureSchedules) {
    const notificationRef = db.collection('notifications').doc();
    const notificationData: NotificationData = {
      userId,
      itemId,
      itemName,
      scheduledDate: schedule.date.toISOString(),
      type: schedule.type,
      sent: false,
      sentAt: null,
    };
    batch.set(notificationRef, notificationData);
  }

  await batch.commit();
  console.log(
    `Created ${futureSchedules.length} notification(s) for item "${itemName}" (${itemId}).`
  );
});
