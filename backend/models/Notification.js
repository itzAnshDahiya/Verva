const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'order_confirmed',
        'order_shipped',
        'order_delivered',
        'payment_received',
        'return_initiated',
        'refund_issued',
        'product_available',
        'price_drop',
        'review_request',
        'promotional',
        'system',
      ],
      required: true,
      index: true,
    },
    title: String,
    message: String,
    data: mongoose.Schema.Types.Mixed,
    channels: {
      email: { sent: Boolean, openedAt: Date },
      sms: { sent: Boolean, deliveredAt: Date },
      push: { sent: Boolean, clickedAt: Date },
      inApp: { seen: Boolean, seenAt: Date },
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    actionUrl: String,
    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

// TTL index for auto-deletion of old notifications
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
