const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { ApiError } = require('../middleware/errorHandler');
const PaginationHelper = require('../utils/PaginationHelper');
const logger = require('../config/logger');

class ReviewController {
  // Create review
  static async createReview(req, res, next) {
    try {
      const { product: productId } = req.params;
      const { rating, title, comment, images } = req.body;

      // Verify product exists
      const product = await Product.findById(productId);
      if (!product) {
        throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
      }

      // Check if user purchased the product
      const order = await Order.findOne({
        user: req.user.id,
        'items.product': productId,
        status: 'delivered',
      });

      if (!order) {
        throw new ApiError(400, 'UNVERIFIED_PURCHASE', 'You must purchase this product to review');
      }

      // Check if already reviewed
      const existingReview = await Review.findOne({
        product: productId,
        user: req.user.id,
      });

      if (existingReview) {
        throw new ApiError(400, 'DUPLICATE_REVIEW', 'You have already reviewed this product');
      }

      // Create review
      const review = new Review({
        product: productId,
        user: req.user.id,
        order: order._id,
        rating,
        title,
        comment,
        images: images || [],
        verifiedPurchase: true,
      });

      await review.save();
      await review.populate('user', 'name avatar');

      // Update product ratings
      const allReviews = await Review.find({ product: productId, isApproved: true });
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      
      const distribution = {
        five: allReviews.filter(r => r.rating === 5).length,
        four: allReviews.filter(r => r.rating === 4).length,
        three: allReviews.filter(r => r.rating === 3).length,
        two: allReviews.filter(r => r.rating === 2).length,
        one: allReviews.filter(r => r.rating === 1).length,
      };

      await Product.findByIdAndUpdate(productId, {
        $push: { reviews: review._id },
        'ratings.average': avgRating,
        'ratings.count': allReviews.length,
        'ratings.distribution': distribution,
      });

      res.status(201).json({
        success: true,
        code: 'REVIEW_CREATED',
        message: 'Review created successfully',
        data: review,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get product reviews
  static async getProductReviews(req, res, next) {
    try {
      const { product: productId } = req.params;
      const { sort = '-createdAt', ...pagination } = req.query;

      const product = await Product.findById(productId);
      if (!product) {
        throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
      }

      const { page, limit, skip } = PaginationHelper.getPaginationParams(pagination);
      const sortObj = PaginationHelper.getSortObject(sort);

      const [reviews, totalCount] = await Promise.all([
        Review.find({ product: productId, isDeleted: false })
          .populate('user', 'name avatar')
          .sort(sortObj)
          .skip(skip)
          .limit(limit),
        Review.countDocuments({ product: productId, isDeleted: false }),
      ]);

      const response = PaginationHelper.buildPaginationResponse(reviews, page, limit, totalCount);

      res.status(200).json({
        success: true,
        code: 'REVIEWS_FOUND',
        message: 'Reviews retrieved',
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update review
  static async updateReview(req, res, next) {
    try {
      const { reviewId } = req.params;
      const { rating, title, comment } = req.body;

      const review = await Review.findOne({
        _id: reviewId,
        user: req.user.id,
      });

      if (!review) {
        throw new ApiError(404, 'REVIEW_NOT_FOUND', 'Review not found');
      }

      review.rating = rating;
      review.title = title;
      review.comment = comment;
      await review.save();

      // Recalculate product ratings
      const allReviews = await Review.find({ product: review.product });
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

      await Product.findByIdAndUpdate(review.product, {
        'ratings.average': avgRating,
      });

      res.status(200).json({
        success: true,
        code: 'REVIEW_UPDATED',
        message: 'Review updated successfully',
        data: review,
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete review
  static async deleteReview(req, res, next) {
    try {
      const { reviewId } = req.params;

      const review = await Review.findOne({
        _id: reviewId,
        user: req.user.id,
      });

      if (!review) {
        throw new ApiError(404, 'REVIEW_NOT_FOUND', 'Review not found');
      }

      review.isDeleted = true;
      await review.save();

      res.status(200).json({
        success: true,
        code: 'REVIEW_DELETED',
        message: 'Review deleted successfully',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }

  // Mark review as helpful
  static async markHelpful(req, res, next) {
    try {
      const { reviewId } = req.params;
      const { helpful } = req.body;

      const review = await Review.findByIdAndUpdate(
        reviewId,
        {
          $inc: {
            helpful: helpful ? 1 : 0,
            unhelpful: !helpful ? 1 : 0,
          },
        },
        { new: true }
      );

      if (!review) {
        throw new ApiError(404, 'REVIEW_NOT_FOUND', 'Review not found');
      }

      res.status(200).json({
        success: true,
        code: 'HELPFUL_UPDATED',
        message: 'Thank you for your feedback',
        data: { helpful: review.helpful, unhelpful: review.unhelpful },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ReviewController;
