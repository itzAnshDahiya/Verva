const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['page_view', 'search', 'product_view', 'add_to_cart', 'purchase', 'checkout_abandoned'],
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // for guest users
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    page: String,
    searchQuery: String,
    referrer: String,
    source: {
      type: String,
      enum: ['organic', 'paid', 'direct', 'social', 'email', 'referral'],
      default: 'direct',
    },
    device: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet'],
    },
    browser: String,
    os: String,
    ipAddress: String,
    timeSpent: Number, // in seconds
    conversionValue: Number,
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient analytics queries
analyticsSchema.index({ createdAt: -1,  type: 1 });
analyticsSchema.index({ user: 1, createdAt: -1 });
analyticsSchema.index({ product: 1, type: 1 });
analyticsSchema.index({ source: 1, createdAt: -1 });

// TTL index - keep analytics for 90 days
analyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('Analytics', analyticsSchema);
