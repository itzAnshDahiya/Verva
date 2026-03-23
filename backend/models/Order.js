const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        name: String,
        sku: String,
        price: Number,
        quantity: Number,
        variant: String,
        image: String,
      },
    ],
    shippingAddress: {
      fullName: String,
      phoneNumber: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    billingAddress: {
      fullName: String,
      phoneNumber: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    pricing: {
      subtotal: {
        type: Number,
        required: true,
      },
      tax: {
        type: Number,
        default: 0,
      },
      shippingCost: {
        type: Number,
        default: 0,
      },
      discount: {
        type: Number,
        default: 0,
      },
      couponCode: String,
      total: {
        type: Number,
        required: true,
      },
    },
    payment: {
      method: {
        type: String,
        enum: ['stripe', 'razorpay', 'paypal', 'cod'],
        required: true,
      },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending',
      },
      transactionId: String,
      receiptUrl: String,
      paidAt: Date,
      refundedAt: Date,
      refundAmount: Number,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
        'returned',
      ],
      default: 'pending',
      index: true,
    },
    statusHistory: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        notes: String,
      },
    ],
    shipping: {
      carrier: String,
      trackingNumber: String,
      trackingUrl: String,
      estimatedDelivery: Date,
      deliveredAt: Date,
      signature: String,
    },
    returns: {
      requestedAt: Date,
      reason: String,
      status: {
        type: String,
        enum: ['none', 'requested', 'approved', 'shipped_back', 'completed'],
        default: 'none',
      },
      refundStatus: String,
      notes: String,
    },
    notes: String,
    internalNotes: String,
    notifications: {
      orderCreated: { type: Boolean, default: true },
      orderShipped: { type: Boolean, default: true },
      orderDelivered: { type: Boolean, default: true },
    },
    metadata: {
      ipAddress: String,
      userAgent: String,
      source: String, // 'web', 'mobile-app', etc.
    },
  },
  {
    timestamps: true,
  }
);

// Generate order number before saving
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    this.orderNumber = `ORD${date}${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Index for efficient queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
