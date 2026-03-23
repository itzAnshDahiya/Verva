const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/OrderController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// All order routes require authentication
router.use(authMiddleware);

// User routes
router.post('/', validate(schemas.createOrder), OrderController.createOrder);
router.get('/', OrderController.getOrders);
router.get('/:orderId', OrderController.getOrder);
router.post('/:orderId/cancel', OrderController.cancelOrder);
router.post('/:orderId/return', OrderController.requestReturn);

// Admin routes
router.get('/admin/all', adminMiddleware, OrderController.getAllOrders);

module.exports = router;
