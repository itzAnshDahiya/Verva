const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { authMiddleware } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

// Public routes
router.post('/signup', authLimiter, validate(schemas.signup), AuthController.signup);
router.post('/login', authLimiter, validate(schemas.login), AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

// Protected routes
router.get('/profile', authMiddleware, AuthController.getProfile);
router.put('/profile', authMiddleware, AuthController.updateProfile);
router.post('/addresses', authMiddleware, AuthController.addAddress);
router.put('/addresses/:addressId', authMiddleware, AuthController.updateAddress);
router.delete('/addresses/:addressId', authMiddleware, AuthController.deleteAddress);
router.post('/logout', authMiddleware, AuthController.logout);

module.exports = router;
