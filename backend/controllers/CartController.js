const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { ApiError } = require('../middleware/errorHandler');
const CacheHelper = require('../utils/CacheHelper');
const logger = require('../config/logger');

class CartController {
  // Get user cart
  static async getCart(req, res, next) {
    try {
      let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');

      if (!cart) {
        cart = new Cart({ user: req.user.id, items: [] });
        await cart.save();
      }

      res.status(200).json({
        success: true,
        code: 'CART_FOUND',
        message: 'Cart retrieved',
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  // Add item to cart
  static async addItem(req, res, next) {
    try {
      const { productId, quantity, variant } = req.body;

      // Validate product exists and has inventory
      const product = await Product.findById(productId);
      if (!product) {
        throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
      }

      if (product.inventory.quantity < quantity) {
        throw new ApiError(400, 'INSUFFICIENT_INVENTORY', 'Not enough inventory available');
      }

      let cart = await Cart.findOne({ user: req.user.id });
      if (!cart) {
        cart = new Cart({ user: req.user.id, items: [] });
      }

      // Check if item already in cart
      const existingItem = cart.items.find(
        (item) => item.product.toString() === productId && item.variant === variant
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({
          product: productId,
          quantity,
          variant,
        });
      }

      await cart.save();

      // Clear cart cache
      await CacheHelper.delWithPrefix(CacheHelper.CART, req.user.id);

      res.status(200).json({
        success: true,
        code: 'ITEM_ADDED',
        message: 'Item added to cart',
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update item quantity
  static async updateItem(req, res, next) {
    try {
      const { productId } = req.params;
      const { quantity, variant } = req.body;

      if (quantity < 1 || quantity > 10) {
        throw new ApiError(400, 'INVALID_QUANTITY', 'Quantity must be between 1 and 10');
      }

      const cart = await Cart.findOne({ user: req.user.id });
      if (!cart) {
        throw new ApiError(404, 'CART_NOT_FOUND', 'Cart not found');
      }

      const item = cart.items.find(
        (i) => i.product.toString() === productId && i.variant === variant
      );

      if (!item) {
        throw new ApiError(404, 'ITEM_NOT_FOUND', 'Item not in cart');
      }

      item.quantity = quantity;
      await cart.save();

      // Clear cache
      await CacheHelper.delWithPrefix(CacheHelper.CART, req.user.id);

      res.status(200).json({
        success: true,
        code: 'ITEM_UPDATED',
        message: 'Item updated',
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  // Remove item from cart
  static async removeItem(req, res, next) {
    try {
      const { productId } = req.params;
      const { variant } = req.query;

      const cart = await Cart.findOne({ user: req.user.id });
      if (!cart) {
        throw new ApiError(404, 'CART_NOT_FOUND', 'Cart not found');
      }

      cart.items = cart.items.filter(
        (i) => !(i.product.toString() === productId && i.variant === variant)
      );

      await cart.save();

      // Clear cache
      await CacheHelper.delWithPrefix(CacheHelper.CART, req.user.id);

      res.status(200).json({
        success: true,
        code: 'ITEM_REMOVED',
        message: 'Item removed from cart',
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  // Clear cart
  static async clearCart(req, res, next) {
    try {
      const cart = await Cart.findOneAndUpdate(
        { user: req.user.id },
        { items: [], appliedCoupon: null },
        { new: true }
      );

      if (!cart) {
        throw new ApiError(404, 'CART_NOT_FOUND', 'Cart not found');
      }

      // Clear cache
      await CacheHelper.delWithPrefix(CacheHelper.CART, req.user.id);

      res.status(200).json({
        success: true,
        code: 'CART_CLEARED',
        message: 'Cart cleared',
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  // Apply coupon
  static async applyCoupon(req, res, next) {
    try {
      const { couponCode } = req.body;
      const Coupon = require('../models/Coupon');

      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
      });

      if (!coupon) {
        throw new ApiError(404, 'COUPON_NOT_FOUND', 'Coupon not found or expired');
      }

      const now = new Date();
      if (now < coupon.startDate || now > coupon.endDate) {
        throw new ApiError(400, 'COUPON_EXPIRED', 'Coupon has expired');
      }

      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        throw new ApiError(400, 'COUPON_LIMIT_REACHED', 'Coupon usage limit reached');
      }

      const cart = await Cart.findOne({ user: req.user.id });
      if (!cart) {
        throw new ApiError(404, 'CART_NOT_FOUND', 'Cart not found');
      }

      cart.appliedCoupon = {
        code: coupon.code,
        discountPercent: coupon.discountValue,
        discountAmount: 0,
        appliedAt: new Date(),
      };

      await cart.save();

      // Clear cache
      await CacheHelper.delWithPrefix(CacheHelper.CART, req.user.id);

      res.status(200).json({
        success: true,
        code: 'COUPON_APPLIED',
        message: 'Coupon applied successfully',
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  // Remove coupon
  static async removeCoupon(req, res, next) {
    try {
      const cart = await Cart.findOneAndUpdate(
        { user: req.user.id },
        { appliedCoupon: null },
        { new: true }
      );

      if (!cart) {
        throw new ApiError(404, 'CART_NOT_FOUND', 'Cart not found');
      }

      // Clear cache
      await CacheHelper.delWithPrefix(CacheHelper.CART, req.user.id);

      res.status(200).json({
        success: true,
        code: 'COUPON_REMOVED',
        message: 'Coupon removed',
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CartController;
