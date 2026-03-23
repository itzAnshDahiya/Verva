require('dotenv').config();
console.log('✓ [STARTUP] Environment loaded');
console.log('[CONFIG] Node ENV:', process.env.NODE_ENV);
console.log('[CONFIG] PORT:', process.env.PORT);
console.log('[CONFIG] MONGODB_URI:', process.env.MONGODB_URI ? '✓ Configured' : '✗ Missing');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const { connectDB, disconnectDB } = require('./config/database');
const { connectRedis, disconnectRedis } = require('./config/cache');
const logger = require('./config/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');

const app = express();

// ============================================
// SECURITY & MIDDLEWARE
// ============================================

// Trust proxy
app.set('trust proxy', 1);

// Helmet for security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5500',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
}));

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Compression
app.use(compression());

// Rate limiting (apply to all routes)
app.use(generalLimiter);

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// ============================================
// API ROUTES
// ============================================

const apiPrefix = process.env.API_PREFIX || '/api/v1';

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/products`, productRoutes);
app.use(`${apiPrefix}/cart`, cartRoutes);
app.use(`${apiPrefix}/orders`, orderRoutes);
app.use(`${apiPrefix}/reviews`, reviewRoutes);
app.use(`${apiPrefix}/wishlist`, wishlistRoutes);

// API Documentation placeholder
app.get(`${apiPrefix}`, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'VERVA E-Commerce API v1',
    endpoints: {
      auth: `${apiPrefix}/auth`,
      products: `${apiPrefix}/products`,
      cart: `${apiPrefix}/cart`,
    },
  });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 5000;
let server;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    logger.info('Database connected');

    // Connect to Redis (optional)
    await connectRedis();
    logger.info('Cache layer initialized');

    // Start server
    server = app.listen(PORT, () => {
      logger.info(`✓ Server running on http://localhost:${PORT}`);
      logger.info(`✓ API Prefix: ${apiPrefix}`);
      logger.info(`✓ Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

const gracefulShutdown = async (signal) => {
  logger.info(`${signal} signal received: closing HTTP server`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        await disconnectDB();
        await disconnectRedis();
        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error(`Shutdown error: ${error.message}`);
        process.exit(1);
      }
    });
  }

  // Force shutdown if not closed within 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
