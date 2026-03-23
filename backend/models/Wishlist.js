const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
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
        addedAt: {
          type: Date,
          default: Date.now,
        },
        note: String,
        priority: {
          type: String,
          enum: ['low', 'medium', 'high'],
          default: 'medium',
        },
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      default: 'My Wishlist',
    },
    description: String,
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate items
wishlistSchema.index({ user: 1, 'items.product': 1 }, { unique: true, sparse: true });
wishlistSchema.index({ user: 1, createdAt: -1 });
wishlistSchema.index({ isPublic: 1 });

module.exports = mongoose.model('Wishlist', wishlistSchema);
