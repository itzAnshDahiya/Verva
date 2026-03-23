const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { getRedisClient } = require('../config/cache');
const logger = require('../config/logger');

// General API limiter
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
  message: 'Too many requests, please try again later',
  standardHeaders: false, // Disable `RateLimit-*` headers
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

// Auth limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again after 15 minutes',
  standardHeaders: false,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      code: 'AUTH_RATE_LIMIT',
      message: 'Too many login attempts, please try again after 15 minutes',
    });
  },
});

// Payment limiter (very strict)
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // Limit each user to 3 payment attempts per minute
  message: 'Too many payment attempts, please try again later',
  standardHeaders: false,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Payment rate limit exceeded for user: ${req.user?.id}`);
    res.status(429).json({
      success: false,
      code: 'PAYMENT_RATE_LIMIT',
      message: 'Too many payment attempts, please try again later',
    });
  },
});

// Search limiter
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  standardHeaders: false,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by user if logged in, otherwise by IP
    return req.user?.id || req.ip;
  },
});

module.exports = {
  generalLimiter,
  authLimiter,
  paymentLimiter,
  searchLimiter,
};
