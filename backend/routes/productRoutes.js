const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/ProductController');
const { optionalAuthMiddleware, adminMiddleware, authMiddleware } = require('../middleware/auth');
const { searchLimiter } = require('../middleware/rateLimiter');

// Public routes
router.get('/', ProductController.getProducts);
router.get('/featured', ProductController.getFeaturedProducts);
router.get('/categories', ProductController.getCategories);
router.get('/search', searchLimiter, ProductController.searchProducts);
router.get('/recommendations/:productId', ProductController.getRecommendations);
router.get('/:slug', ProductController.getProduct);

// Admin routes
router.get('/admin/low-stock', authMiddleware, adminMiddleware, ProductController.getLowStockProducts);

module.exports = router;
