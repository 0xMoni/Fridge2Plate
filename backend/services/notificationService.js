'use strict';

const axios = require('axios');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Send a push notification via the Expo Push API.
 *
 * @param {string} expoPushToken - Expo push token (ExponentPushToken[...]).
 * @param {string} title - Notification title.
 * @param {string} body - Notification body text.
 * @param {Object} [data={}] - Arbitrary data payload.
 * @returns {Promise<Object>} Expo API response data.
 */
async function sendPushNotification(expoPushToken, title, body, data = {}) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  const response = await axios.post(EXPO_PUSH_URL, message, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  return response.data;
}

module.exports = { sendPushNotification };
