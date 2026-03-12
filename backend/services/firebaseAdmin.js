'use strict';

const admin = require('firebase-admin');
const config = require('../config');
const path = require('path');
const fs = require('fs');

if (!admin.apps.length) {
  let credential;

  // Try service account JSON file first
  const serviceAccountPath = path.resolve(__dirname, '..', 'serviceAccountKey.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    credential = admin.credential.cert(serviceAccount);
  } else if (
    config.firebase.privateKey &&
    config.firebase.privateKey.includes('PRIVATE KEY')
  ) {
    // Use env var credentials
    credential = admin.credential.cert({
      projectId: config.firebase.projectId,
      clientEmail: config.firebase.clientEmail,
      privateKey: config.firebase.privateKey,
    });
  } else {
    // Fall back to application default credentials (e.g. on GCP)
    credential = admin.credential.applicationDefault();
  }

  admin.initializeApp({ credential });
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
