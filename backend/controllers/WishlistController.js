const Wishlist = require('../models/Wishlist');
const { ApiError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

class WishlistController {
  // Get user wishlist
  static async getWishlist(req, res, next) {
    try {
      let wishlist = await Wishlist.findOne({ user: req.user.id }).populate(
        'items.product',
        'name slug price discountPrice mainImage category ratings.average'
      );

      if (!wishlist) {
        wishlist = new Wishlist({ user: req.user.id, items: [] });
        await wishlist.save();
      }

      res.status(200).json({
        success: true,
        code: 'WISHLIST_FOUND',
        message: 'Wishlist retrieved',
        data: wishlist,
      });
    } catch (error) {
      next(error);
    }
  }

  // Add item to wishlist
  static async addItem(req, res, next) {
    try {
      const { productId, note, priority } = req.body;

      let wishlist = await Wishlist.findOne({ user: req.user.id });
      if (!wishlist) {
        wishlist = new Wishlist({ user: req.user.id, items: [] });
      }

      // Check if item already exists
      const existing = wishlist.items.find((i) => i.product.toString() === productId);
      if (existing) {
        throw new ApiError(400, 'ITEM_EXISTS', 'Item already in wishlist');
      }

      wishlist.items.push({
        product: productId,
        note,
        priority: priority || 'medium',
      });

      await wishlist.save();

      res.status(200).json({
        success: true,
        code: 'ITEM_ADDED',
        message: 'Item added to wishlist',
        data: wishlist,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update wishlist item
  static async updateItem(req, res, next) {
    try {
      const { itemId } = req.params;
      const { note, priority } = req.body;

      const wishlist = await Wishlist.findOne({ user: req.user.id });
      if (!wishlist) {
        throw new ApiError(404, 'WISHLIST_NOT_FOUND', 'Wishlist not found');
      }

      const item = wishlist.items.id(itemId);
      if (!item) {
        throw new ApiError(404, 'ITEM_NOT_FOUND', 'Item not in wishlist');
      }

      if (note) item.note = note;
      if (priority) item.priority = priority;

      await wishlist.save();

      res.status(200).json({
        success: true,
        code: 'ITEM_UPDATED',
        message: 'Item updated',
        data: wishlist,
      });
    } catch (error) {
      next(error);
    }
  }

  // Remove item from wishlist
  static async removeItem(req, res, next) {
    try {
      const { productId } = req.params;

      const wishlist = await Wishlist.findOne({ user: req.user.id });
      if (!wishlist) {
        throw new ApiError(404, 'WISHLIST_NOT_FOUND', 'Wishlist not found');
      }

      wishlist.items = wishlist.items.filter((i) => i.product.toString() !== productId);
      await wishlist.save();

      res.status(200).json({
        success: true,
        code: 'ITEM_REMOVED',
        message: 'Item removed from wishlist',
        data: wishlist,
      });
    } catch (error) {
      next(error);
    }
  }

  // Clear wishlist
  static async clearWishlist(req, res, next) {
    try {
      const wishlist = await Wishlist.findOneAndUpdate(
        { user: req.user.id },
        { items: [] },
        { new: true }
      );

      if (!wishlist) {
        throw new ApiError(404, 'WISHLIST_NOT_FOUND', 'Wishlist not found');
      }

      res.status(200).json({
        success: true,
        code: 'WISHLIST_CLEARED',
        message: 'Wishlist cleared',
        data: wishlist,
      });
    } catch (error) {
      next(error);
    }
  }

  // Check if product in wishlist
  static async isInWishlist(req, res, next) {
    try {
      const { productId } = req.params;

      const wishlist = await Wishlist.findOne({
        user: req.user.id,
        'items.product': productId,
      });

      res.status(200).json({
        success: true,
        code: 'WISHLIST_CHECK_DONE',
        message: 'Wishlist checked',
        data: { inWishlist: !!wishlist },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = WishlistController;
