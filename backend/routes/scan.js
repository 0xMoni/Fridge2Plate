'use strict';

const express = require('express');
const multer = require('multer');
const { extractText } = require('../services/ocr');
const { extractExpiryDate } = require('../services/dateExtractor');
const { extractProductName } = require('../services/productNameExtractor');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per file
    files: 5,
  },
  fileFilter(_req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

/**
 * POST /api/scan
 * Accepts up to 5 images (field name "images"), runs OCR + date/name
 * extraction on each, and returns an array of results.
 */
router.post('/', upload.array('images', 5), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    const results = await Promise.all(
      req.files.map(async (file) => {
        const rawText = await extractText(file.buffer);

        if (!rawText) {
          return {
            itemName: 'Unknown Product',
            expiryDate: null,
            confidence: 0,
            rawText: null,
          };
        }

        const { date, confidence } = extractExpiryDate(rawText);
        const itemName = extractProductName(rawText);

        return {
          itemName,
          expiryDate: date,
          confidence,
          rawText,
        };
      })
    );

    return res.json({ results });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
