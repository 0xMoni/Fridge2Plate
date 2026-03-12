'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config');
const authenticate = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const scanRoutes = require('./routes/scan');
const itemsRoutes = require('./routes/items');

const app = express();

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// Public health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Protected routes
app.use('/api/scan', authenticate, scanRoutes);
app.use('/api/items', authenticate, itemsRoutes);

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port} [${config.nodeEnv}]`);
});

module.exports = app;
