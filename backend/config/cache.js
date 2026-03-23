const redis = require('redis');
const logger = require('./logger');

let redisClient = null;

const connectRedis = async () => {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500),
      },
      legacyMode: false,
    });

    redisClient.on('error', (err) => {
      // Suppress repetitive connection errors - Redis is optional for development
      // This will silently fail gracefully without blocking the app
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.warn(`Redis connection failed: ${error.message}. Caching disabled.`);
    return null;
  }
};

const getRedisClient = () => redisClient;

const setCache = async (key, value, expirySeconds = 3600) => {
  try {
    if (!redisClient) return;
    await redisClient.setEx(key, expirySeconds, JSON.stringify(value));
  } catch (error) {
    logger.warn(`Redis set error: ${error.message}`);
  }
};

const getCache = async (key) => {
  try {
    if (!redisClient) return null;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.warn(`Redis get error: ${error.message}`);
    return null;
  }
};

const delCache = async (key) => {
  try {
    if (!redisClient) return;
    await redisClient.del(key);
  } catch (error) {
    logger.warn(`Redis del error: ${error.message}`);
  }
};

const clearCache = async () => {
  try {
    if (!redisClient) return;
    await redisClient.flushDb();
  } catch (error) {
    logger.warn(`Redis clear error: ${error.message}`);
  }
};

const disconnectRedis = async () => {
  try {
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis disconnected');
    }
  } catch (error) {
    logger.warn(`Redis disconnection error: ${error.message}`);
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  setCache,
  getCache,
  delCache,
  clearCache,
  disconnectRedis,
};
