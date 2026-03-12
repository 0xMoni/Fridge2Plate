"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onItemCreate = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const app_1 = require("firebase-admin/app");
const firestore_2 = require("firebase-admin/firestore");
const date_fns_1 = require("date-fns");
if ((0, app_1.getApps)().length === 0) {
    (0, app_1.initializeApp)();
}
const db = (0, firestore_2.getFirestore)();
exports.onItemCreate = (0, firestore_1.onDocumentCreated)('items/{itemId}', async (event) => {
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
    let expiry;
    if (expiryDate.toDate && typeof expiryDate.toDate === 'function') {
        expiry = expiryDate.toDate();
    }
    else {
        expiry = new Date(expiryDate);
    }
    const expiryDay = (0, date_fns_1.startOfDay)(expiry);
    const now = new Date();
    // Define the three notification schedules
    const schedules = [
        { type: '3day', date: (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(expiryDay, 3)) },
        { type: '1day', date: (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(expiryDay, 1)) },
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
        const notificationData = {
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
    console.log(`Created ${futureSchedules.length} notification(s) for item "${itemName}" (${itemId}).`);
});
