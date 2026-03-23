const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        code: 'NO_TOKEN',
        message: 'No authentication token provided',
        data: null,
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired',
          data: null,
        });
      }

      return res.status(401).json({
        success: false,
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
        data: null,
      });
    }
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    return res.status(500).json({
      success: false,
      code: 'AUTH_ERROR',
      message: 'Authentication error',
      data: null,
    });
  }
};

// Check if user is admin
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      code: 'FORBIDDEN',
      message: 'Access denied. Admin privileges required.',
      data: null,
    });
  }
  next();
};

// Check if user is vendor or admin
const vendorMiddleware = (req, res, next) => {
  if (!req.user || (req.user.role !== 'vendor' && req.user.role !== 'admin')) {
    return res.status(403).json({
      success: false,
      code: 'FORBIDDEN',
      message: 'Access denied. Vendor or Admin privileges required.',
      data: null,
    });
  }
  next();
};

// Optional auth - user may or may not be logged in
const optionalAuthMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
      } catch (error) {
        logger.warn(`Optional auth token error: ${error.message}`);
      }
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  vendorMiddleware,
  optionalAuthMiddleware,
};
