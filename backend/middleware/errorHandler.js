const logger = require('../config/logger');

class ApiError extends Error {
  constructor(statusCode, code, message, data = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.data = data;
  }
}

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'Internal Server Error';

  // Log error
  logger.error({
    message,
    code,
    statusCode,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      data: errors,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      code: 'DUPLICATE_FIELD',
      message: `${field} already exists`,
      data: { field },
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Invalid token',
      data: null,
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      code: 'TOKEN_EXPIRED',
      message: 'Token expired',
      data: null,
    });
  }

  // Custom API error
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      data: err.data,
    });
  }

  // Default error
  res.status(statusCode).json({
    success: false,
    code,
    message,
    data: process.env.NODE_ENV === 'development' ? { stack: err.stack } : null,
  });
};

// 404 Not Found handler
const notFoundHandler = (req, res, next) => {
  const error = new ApiError(404, 'NOT_FOUND', `Route ${req.originalUrl} not found`);
  next(error);
};

module.exports = {
  ApiError,
  errorHandler,
  notFoundHandler,
};
