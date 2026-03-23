const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/ReviewController');
const { authMiddleware } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// Public routes
router.get('/:product', ReviewController.getProductReviews);

// Protected routes
router.post('/:product', authMiddleware, validate(schemas.createReview), ReviewController.createReview);
router.put('/:reviewId', authMiddleware, ReviewController.updateReview);
router.delete('/:reviewId', authMiddleware, ReviewController.deleteReview);
router.post('/:reviewId/helpful', authMiddleware, ReviewController.markHelpful);

module.exports = router;
