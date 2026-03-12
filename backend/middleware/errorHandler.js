'use strict';

/**
 * Global Express error-handling middleware.
 * Must have four parameters so Express recognises it as an error handler.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const message = status === 500 ? 'Internal server error' : err.message;

  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${status}`, {
    message: err.message,
    stack: err.stack,
  });

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
