const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      unique: true,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: String,
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      default: null,
    },
    minPurchaseAmount: {
      type: Number,
      default: 0,
    },
    maxPurchaseAmount: {
      type: Number,
      default: null,
    },
    usageLimit: {
      type: Number,
      default: null, // null = unlimited
    },
    usagePerUser: {
      type: Number,
      default: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    applicableCategories: [String],
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    excludedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isStackable: {
      type: Boolean,
      default: false,
    },
    usedBy: [
      {
        user: mongoose.Schema.Types.ObjectId,
        usedAt: Date,
        count: Number,
      },
    ],
    metadata: {
      createdBy: mongoose.Schema.Types.ObjectId,
      campaignName: String,
      notes: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
couponSchema.index({ code: 1, isActive: 1 });
couponSchema.index({ startDate: 1, endDate: 1, isActive: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
