const express = require('express');
const router = express.Router();
const CartController = require('../controllers/CartController');
const { authMiddleware } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// All cart routes require authentication
router.use(authMiddleware);

router.get('/', CartController.getCart);
router.post('/items', CartController.addItem);
router.put('/items/:productId', CartController.updateItem);
router.delete('/items/:productId', CartController.removeItem);
router.delete('/', CartController.clearCart);
router.post('/coupon', validate(schemas.applyCoupon), CartController.applyCoupon);
router.delete('/coupon', CartController.removeCoupon);

module.exports = router;
