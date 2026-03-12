'use strict';

// Lines containing any of these keywords are likely nutritional or regulatory info.
const NOISE_KEYWORDS = [
  'NUTRITION', 'INGREDIENTS', 'CALORIES', 'FAT', 'PROTEIN', 'CARBOHYDRATE',
  'SUGAR', 'SODIUM', 'CHOLESTEROL', 'FIBRE', 'FIBER', 'VITAMIN',
  'SERVING SIZE', 'SERVINGS PER', 'DAILY VALUE', 'PERCENT',
  'CONTAINS', 'ALLERGEN', 'MAY CONTAIN', 'STORAGE', 'KEEP REFRIGERATED',
  'BEST BEFORE', 'USE BY', 'EXP', 'SELL BY', 'BEST BY', 'USE BEFORE',
  'NET WEIGHT', 'NET WT', 'MANUFACTURED', 'DISTRIBUTED', 'PRODUCED',
  'BATCH', 'LOT', 'BARCODE', 'SKU',
];

// Regex to detect weight/volume strings like "500g", "1.5L", "12 oz".
const WEIGHT_VOLUME_RE = /^\s*\d+\.?\d*\s*(g|kg|mg|ml|l|oz|fl\s*oz|lb|lbs|cl)\b/i;

// Regex to detect lines that are entirely digits (barcodes, batch numbers).
const ALL_DIGITS_RE = /^\d+$/;

// Regex to detect date-like strings.
const DATE_LIKE_RE = /\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,4}|\d{1,2}\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/i;

/**
 * Title-case a string: capitalise the first letter of each word.
 */
function toTitleCase(str) {
  return str
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (ch) => ch.toUpperCase());
}

/**
 * Extract a probable product name from raw OCR text.
 *
 * Heuristic: the product name is typically the most prominent (first)
 * non-noise line on the packaging.
 *
 * @param {string} text - Raw OCR text.
 * @returns {string} Best-guess product name, or 'Unknown Product'.
 */
function extractProductName(text) {
  if (!text || typeof text !== 'string') return 'Unknown Product';

  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Skip very short lines (single chars, stray punctuation).
    if (line.length < 3) continue;

    // Skip lines that are purely digits (barcodes).
    if (ALL_DIGITS_RE.test(line)) continue;

    // Skip lines that look like dates.
    if (DATE_LIKE_RE.test(line)) continue;

    // Skip weight/volume lines.
    if (WEIGHT_VOLUME_RE.test(line)) continue;

    // Skip lines that contain noise keywords.
    const upper = line.toUpperCase();
    const isNoise = NOISE_KEYWORDS.some((kw) => upper.includes(kw));
    if (isNoise) continue;

    return toTitleCase(line);
  }

  return 'Unknown Product';
}

module.exports = { extractProductName };
