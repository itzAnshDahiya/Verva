const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const { ApiError } = require('../middleware/errorHandler');
const PaymentService = require('../services/PaymentService');
const EmailService = require('../services/EmailService');
const PaginationHelper = require('../utils/PaginationHelper');
const logger = require('../config/logger');

class OrderController {
  // Create order
  static async createOrder(req, res, next) {
    try {
      const { items,  shippingAddress, billingAddress, paymentMethod } = req.body;

      if (!items || items.length === 0) {
        throw new ApiError(400, 'EMPTY_ORDER', 'Order must contain items');
      }

      // Validate inventory
      let subtotal = 0;
      const processedItems = [];

      for (const item of items) {
        const product = await Product.findById(item.product);
        if (!product) {
          throw new ApiError(404, 'PRODUCT_NOT_FOUND', `Product ${item.product} not found`);
        }

        if (product.inventory.quantity < item.quantity) {
          throw new ApiError(400, 'INSUFFICIENT_INVENTORY', `${product.name} out of stock`);
        }

        const itemPrice = product.discountPrice || product.price;
        const itemTotal = itemPrice * item.quantity;
        subtotal += itemTotal;

        processedItems.push({
          product: product._id,
          name: product.name,
          sku: product.sku,
          price: itemPrice,
          quantity: item.quantity,
          variant: item.variant,
          image: product.mainImage,
        });
      }

      // Calculate tax and totals
      const tax = Math.round(subtotal * 0.05); // 5% GST
      const shipping = subtotal >= 1000 ? 0 : 99;
      const total = subtotal + tax + shipping;

      // Create order
      const order = new Order({
        user: req.user.id,
        items: processedItems,
        shippingAddress,
        billingAddress: billingAddress || shippingAddress,
        pricing: {
          subtotal,
          tax,
          shippingCost: shipping,
          total,
        },
        payment: {
          method: paymentMethod,
          status: 'pending',
        },
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          source: 'web',
        },
      });

      await order.save();

      // Reduce inventory
      for (const item of processedItems) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { 'inventory.quantity': -item.quantity, purchases: 1 } }
        );
      }

      // Clear user cart
      await Cart.findOneAndUpdate({ user: req.user.id }, { items: [], appliedCoupon: null });

      // Send order confirmation email
      const user = await User.findById(req.user.id);
      if (user) {
        await EmailService.sendOrderConfirmation(user, order);
      }

      res.status(201).json({
        success: true,
        code: 'ORDER_CREATED',
        message: 'Order created successfully',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user orders
  static async getOrders(req, res, next) {
    try {
      const { status, ...pagination } = req.query;
      const { page, limit, skip } = PaginationHelper.getPaginationParams(pagination);

      const filter = { user: req.user.id };
      if (status) {
        filter.status = status;
      }

      const [orders, totalCount] = await Promise.all([
        Order.find(filter)
          .populate('items.product', 'name sku mainImage')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Order.countDocuments(filter),
      ]);

      const response = PaginationHelper.buildPaginationResponse(orders, page, limit, totalCount);

      res.status(200).json({
        success: true,
        code: 'ORDERS_FOUND',
        message: 'Orders retrieved',
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get single order
  static async getOrder(req, res, next) {
    try {
      const { orderId } = req.params;

      const order = await Order.findOne({
        _id: orderId,
        user: req.user.id,
      }).populate('items.product', 'name sku mainImage price');

      if (!order) {
        throw new ApiError(404, 'ORDER_NOT_FOUND', 'Order not found');
      }

      res.status(200).json({
        success: true,
        code: 'ORDER_FOUND',
        message: 'Order retrieved',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  // Cancel order
  static async cancelOrder(req, res, next) {
    try {
      const { orderId } = req.params;

      const order = await Order.findOne({
        _id: orderId,
        user: req.user.id,
      });

      if (!order) {
        throw new ApiError(404, 'ORDER_NOT_FOUND', 'Order not found');
      }

      if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
        throw new ApiError(400, 'CANNOT_CANCEL', `Cannot cancel order with status ${order.status}`);
      }

      // Restore inventory
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { 'inventory.quantity': item.quantity } }
        );
      }

      order.status = 'cancelled';
      order.statusHistory.push({
        status: 'cancelled',
        timestamp: new Date(),
        notes: 'Cancelled by user',
      });

      await order.save();

      res.status(200).json({
        success: true,
        code: 'ORDER_CANCELLED',
        message: 'Order cancelled successfully',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  // Request return
  static async requestReturn(req, res, next) {
    try {
      const { orderId } = req.params;
      const { reason } = req.body;

      const order = await Order.findOne({
        _id: orderId,
        user: req.user.id,
      });

      if (!order) {
        throw new ApiError(404, 'ORDER_NOT_FOUND', 'Order not found');
      }

      if (order.status !== 'delivered') {
        throw new ApiError(400, 'INVALID_STATUS', 'Only delivered orders can be returned');
      }

      order.returns = {
        requestedAt: new Date(),
        reason,
        status: 'requested',
      };

      order.statusHistory.push({
        status: 'returned',
        timestamp: new Date(),
        notes: `Return requested - Reason: ${reason}`,
      });

      await order.save();

      res.status(200).json({
        success: true,
        code: 'RETURN_REQUESTED',
        message: 'Return request submitted',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  // Admin: Get all orders (no user filter)
  static async getAllOrders(req, res, next) {
    try {
      const { status, userId, ...pagination } = req.query;
      const { page, limit, skip } = PaginationHelper.getPaginationParams(pagination);

      const filter = {};
      if (status) filter.status = status;
      if (userId) filter.user = userId;

      const [orders, totalCount] = await Promise.all([
        Order.find(filter)
          .populate('user', 'name email phone')
          .populate('items.product', 'name sku')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Order.countDocuments(filter),
      ]);

      const response = PaginationHelper.buildPaginationResponse(orders, page, limit, totalCount);

      res.status(200).json({
        success: true,
        code: 'ORDERS_FOUND',
        message: 'Orders retrieved',
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OrderController;
