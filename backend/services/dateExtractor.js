'use strict';

const { parse, format, isValid, lastDayOfMonth, isFuture, isAfter } = require('date-fns');

// Keywords that typically precede an expiry date on packaging.
const EXPIRY_KEYWORDS = [
  'BEST BEFORE',
  'BEST BY',
  'USE BY',
  'USE BEFORE',
  'SELL BY',
  'EXPIRY DATE',
  'EXPIRY',
  'EXP DATE',
  'EXP',
  'BB',
];

// Month name lookup for textual date parsing.
const MONTH_MAP = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
  JANUARY: 0, FEBRUARY: 1, MARCH: 2, APRIL: 3, MAY: 4, JUNE: 5,
  JULY: 6, AUGUST: 7, SEPTEMBER: 8, OCTOBER: 9, NOVEMBER: 10, DECEMBER: 11,
};

/**
 * Build a regex that matches a variety of printed date formats.
 * Returns an array of { match, index } objects.
 */
function findCandidateDates(text) {
  const patterns = [
    // YYYY-MM-DD or YYYY/MM/DD
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/g,
    // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, MM/DD/YYYY, MM-DD-YYYY
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/g,
    // DD MMM YYYY or DD MMM YY  (e.g. 15 Jan 2025, 15 JAN 25)
    /(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC|JANUARY|FEBRUARY|MARCH|APRIL|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+(\d{2,4})/gi,
    // MMM YYYY or MMM YY  (e.g. Jan 2025, JAN 25) — only when NOT preceded by a digit+space (to avoid matching "15 JAN 27" as "JAN 27")
    /(?<!\d\s)(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC|JANUARY|FEBRUARY|MARCH|APRIL|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+(\d{2,4})/gi,
    // MM/YYYY or MM-YYYY (e.g. 03/2026) — assume last day of month. Only when year is 4 digits.
    /(?<!\d[\/\-\.])(\d{1,2})[\/\-](\d{4})(?![\/\-\.]\d)/g,
  ];

  const candidates = [];

  for (const pattern of patterns) {
    let m;
    while ((m = pattern.exec(text)) !== null) {
      candidates.push({ match: m[0], index: m.index, groups: m.slice(1) });
    }
  }

  return candidates;
}

/**
 * Attempt to parse a candidate match string into a Date.
 * Returns a Date or null.
 */
function parseCandidate(matchStr) {
  const trimmed = matchStr.trim();

  // YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (isoMatch) {
    const d = new Date(+isoMatch[1], +isoMatch[2] - 1, +isoMatch[3]);
    return isValid(d) ? d : null;
  }

  // DD MMM YYYY / DD MMM YY
  const dMyMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{2,4})$/);
  if (dMyMatch) {
    const day = +dMyMatch[1];
    const monthKey = dMyMatch[2].toUpperCase();
    let year = +dMyMatch[3];
    if (year < 100) year += 2000;
    const month = MONTH_MAP[monthKey];
    if (month === undefined) return null;
    const d = new Date(year, month, day);
    return isValid(d) ? d : null;
  }

  // MMM YYYY / MMM YY  (assume last day of month)
  const mYMatch = trimmed.match(/^([A-Za-z]+)\s+(\d{2,4})$/);
  if (mYMatch) {
    const monthKey = mYMatch[1].toUpperCase();
    let year = +mYMatch[2];
    if (year < 100) year += 2000;
    const month = MONTH_MAP[monthKey];
    if (month === undefined) return null;
    const d = lastDayOfMonth(new Date(year, month, 1));
    return isValid(d) ? d : null;
  }

  // MM/YYYY or MM-YYYY (e.g. 03/2026) — assume last day of month
  const monthYearMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{4})$/);
  if (monthYearMatch) {
    const month = +monthYearMatch[1];
    const year = +monthYearMatch[2];
    if (month >= 1 && month <= 12) {
      const d = lastDayOfMonth(new Date(year, month - 1, 1));
      return isValid(d) ? d : null;
    }
  }

  // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, or MM/DD/YYYY
  const numMatch = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (numMatch) {
    let a = +numMatch[1];
    let b = +numMatch[2];
    let year = +numMatch[3];
    if (year < 100) year += 2000;

    // Heuristic: if a > 12 it must be a day (DD/MM/YYYY).
    // If b > 12 it must be a day (MM/DD/YYYY).
    // Default to DD/MM/YYYY when ambiguous.
    let day, month;
    if (a > 12 && b <= 12) {
      day = a;
      month = b;
    } else if (b > 12 && a <= 12) {
      month = a;
      day = b;
    } else {
      // Ambiguous -- prefer DD/MM/YYYY (more common on food packaging worldwide).
      day = a;
      month = b;
    }

    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const d = new Date(year, month - 1, day);
    return isValid(d) ? d : null;
  }

  return null;
}

/**
 * Check whether a keyword appears near (within ~40 chars) a given index.
 */
function keywordNearIndex(text, index) {
  const windowStart = Math.max(0, index - 40);
  const window = text.substring(windowStart, index).toUpperCase();

  for (const kw of EXPIRY_KEYWORDS) {
    if (window.includes(kw)) return true;
  }
  return false;
}

/**
 * Extract the most likely expiry date from OCR text.
 *
 * Strategy:
 * 1. Find all candidate date strings in the text.
 * 2. If any candidate is preceded by an expiry keyword, return it immediately.
 * 3. Otherwise, return the furthest-future valid date.
 *
 * @param {string} text - Raw OCR text.
 * @returns {{ date: string|null, confidence: number }}
 */
function extractExpiryDate(text) {
  if (!text || typeof text !== 'string') return { date: null, confidence: 0 };

  const upperText = text.toUpperCase();
  const candidates = findCandidateDates(upperText);

  if (candidates.length === 0) return { date: null, confidence: 0 };

  // First pass: look for a keyword-adjacent date.
  for (const c of candidates) {
    const d = parseCandidate(c.match);
    if (d && keywordNearIndex(upperText, c.index)) {
      return {
        date: format(d, 'yyyy-MM-dd'),
        confidence: 1.0,
      };
    }
  }

  // Second pass: collect all parseable dates, pick the furthest future one.
  let best = null;
  for (const c of candidates) {
    const d = parseCandidate(c.match);
    if (!d) continue;
    if (!best || isAfter(d, best)) {
      best = d;
    }
  }

  if (best) {
    return {
      date: format(best, 'yyyy-MM-dd'),
      confidence: 0.7,
    };
  }

  return { date: null, confidence: 0 };
}

module.exports = { extractExpiryDate };
