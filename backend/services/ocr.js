'use strict';

const vision = require('@google-cloud/vision');

const client = new vision.ImageAnnotatorClient();

/**
 * Run Google Cloud Vision text detection on an image buffer.
 * @param {Buffer} imageBuffer - Raw image bytes.
 * @returns {Promise<string|null>} Full detected text or null.
 */
async function extractText(imageBuffer) {
  const [result] = await client.textDetection(imageBuffer);
  const detections = result.textAnnotations;

  if (!detections || detections.length === 0) {
    return null;
  }

  // The first annotation contains the full concatenated text.
  return detections[0].description;
}

module.exports = { extractText };
