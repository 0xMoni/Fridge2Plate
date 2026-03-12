'use strict';

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },

  googleCloud: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
    credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
  },

  expo: {
    accessToken: process.env.EXPO_ACCESS_TOKEN || '',
  },
};

module.exports = config;
