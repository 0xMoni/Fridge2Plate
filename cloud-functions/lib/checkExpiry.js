"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkExpiry = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const axios_1 = __importDefault(require("axios"));
const date_fns_1 = require("date-fns");
if ((0, app_1.getApps)().length === 0) {
    (0, app_1.initializeApp)();
}
const db = (0, firestore_1.getFirestore)();
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const NOTIFICATION_MESSAGES = {
    '3day': (itemName) => `Heads up: ${itemName} expires in 3 days`,
    '1day': (itemName) => `${itemName} expires tomorrow!`,
    'today': (itemName) => `${itemName} expires today - use it or lose it!`,
};
exports.checkExpiry = (0, scheduler_1.onSchedule)('every 1 hours', async () => {
    const now = new Date();
    const today = (0, date_fns_1.startOfDay)(now);
    const threeDaysFromNow = (0, date_fns_1.addDays)(today, 4); // end of the 3-day window
    // Query items expiring within the next 3 days or already expiring today
    const itemsSnapshot = await db
        .collection('items')
        .where('expiryDate', '>=', firestore_1.Timestamp.fromDate(today))
        .where('expiryDate', '<=', firestore_1.Timestamp.fromDate(threeDaysFromNow))
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
                await axios_1.default.post(EXPO_PUSH_URL, {
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
                    sentAt: firestore_1.Timestamp.now(),
                });
                console.log(`Sent "${type}" notification for item "${itemName}" to user ${userId}.`);
            }
            catch (error) {
                console.error(`Failed to send notification ${notificationDoc.id}:`, error);
            }
        }
    }
});
