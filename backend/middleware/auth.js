'use strict';

const { auth } = require('../services/firebaseAdmin');

/**
 * Express middleware that verifies a Firebase ID token from the
 * Authorization header and attaches the decoded claims to req.user.
 */
async function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = header.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,
    };
    return next();
  } catch (err) {
    console.error('Auth token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authenticate;
