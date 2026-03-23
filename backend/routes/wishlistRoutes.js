const express = require('express');
const router = express.Router();
const WishlistController = require('../controllers/WishlistController');
const { authMiddleware } = require('../middleware/auth');

// All wishlist routes require authentication
router.use(authMiddleware);

router.get('/', WishlistController.getWishlist);
router.post('/items', WishlistController.addItem);
router.put('/items/:itemId', WishlistController.updateItem);
router.delete('/items/:productId', WishlistController.removeItem);
router.get('/check/:productId', WishlistController.isInWishlist);
router.delete('/', WishlistController.clearWishlist);

module.exports = router;
