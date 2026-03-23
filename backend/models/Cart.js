const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        variant: String,
        addedAt: {
          type: Date,
          default: Date.now,
        },
        note: String,
      },
    ],
    appliedCoupon: {
      code: String,
      discountAmount: Number,
      discountPercent: Number,
      appliedAt: Date,
    },
    totals: {
      subtotal: {
        type: Number,
        default: 0,
      },
      discount: {
        type: Number,
        default: 0,
      },
      tax: {
        type: Number,
        default: 0,
      },
      shipping: {
        type: Number,
        default: 0,
      },
      total: {
        type: Number,
        default: 0,
      },
    },
    expiresAt: {
      type: Date,
      default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000), // 30 days
      index: {
        expireAfterSeconds: 30 * 24 * 60 * 60,
      },
    },
    abandoned: {
      type: Boolean,
      default: false,
      index: true,
    },
    abandonedReminderSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-calculate totals before saving
cartSchema.pre('save', async function (next) {
  try {
    const Product = mongoose.model('Product');
    let subtotal = 0;

    // Calculate subtotal
    for (let item of this.items) {
      const product = await Product.findById(item.product).select('price discountPrice');
      if (product) {
        const itemPrice = product.discountPrice || product.price;
        subtotal += itemPrice * item.quantity;
      }
    }

    this.totals.subtotal = subtotal;

    // Apply discount if coupon exists
    if (this.appliedCoupon) {
      this.totals.discount = Math.round(
        subtotal * (this.appliedCoupon.discountPercent / 100)
      );
    }

    // Calculate tax (assuming 5% GST for India)
    this.totals.tax = Math.round((subtotal - this.totals.discount) * 0.05);

    // Free shipping for orders above ₹1000
    this.totals.shipping = subtotal - this.totals.discount >= 1000 ? 0 : 99;

    // Calculate total
    this.totals.total =
      subtotal - this.totals.discount + this.totals.tax + this.totals.shipping;

    // Mark as not abandoned if it has items
    if (this.items.length > 0) {
      this.abandoned = false;
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Index for efficient queries
cartSchema.index({ user: 1, createdAt: -1 });
cartSchema.index({ abandoned: 1, updatedAt: 1 });

module.exports = mongoose.model('Cart', cartSchema);
