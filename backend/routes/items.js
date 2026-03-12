'use strict';

const express = require('express');
const { db } = require('../services/firebaseAdmin');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const COLLECTION = 'items';

/**
 * GET /api/items
 * Fetch all items belonging to the authenticated user, ordered by expiryDate.
 */
router.get('/', async (req, res, next) => {
  try {
    const snapshot = await db
      .collection(COLLECTION)
      .where('userId', '==', req.user.uid)
      .orderBy('expiryDate', 'asc')
      .get();

    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.json({ items });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/items
 * Create a new item in Firestore for the authenticated user.
 */
router.post('/', async (req, res, next) => {
  try {
    const { itemName, expiryDate, category, quantity, notes } = req.body;

    if (!itemName) {
      return res.status(400).json({ error: 'itemName is required' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const item = {
      itemName,
      expiryDate: expiryDate || null,
      category: category || 'Other',
      quantity: quantity != null ? quantity : 1,
      notes: notes || '',
      userId: req.user.uid,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection(COLLECTION).doc(id).set(item);

    return res.status(201).json({ id, ...item });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/items/:id
 * Update an existing item. Verifies ownership before modifying.
 */
router.put('/:id', async (req, res, next) => {
  try {
    const docRef = db.collection(COLLECTION).doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (doc.data().userId !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const allowedFields = ['itemName', 'expiryDate', 'status', 'imageUrl', 'category', 'quantity', 'notes'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
    updates.updatedAt = new Date().toISOString();

    await docRef.update(updates);

    const updated = await docRef.get();
    return res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/items/:id
 * Delete an item. Verifies ownership before removing.
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const docRef = db.collection(COLLECTION).doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (doc.data().userId !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await docRef.delete();
    return res.json({ message: 'Item deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
