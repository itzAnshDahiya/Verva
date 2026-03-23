const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Razorpay = require('razorpay');
const logger = require('../config/logger');
const { ApiError } = require('../middleware/errorHandler');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

class PaymentService {
  // Stripe: Create charge
  static async createStripeCharge(amount, currency, token, description, metadata = {}) {
    try {
      const charge = await stripe.charges.create({
        amount: Math.round(amount * 100), // Convert to paise
        currency: currency || 'INR',
        source: token,
        description,
        metadata,
      });

      logger.info(`Stripe charge created: ${charge.id}`);
      return { success: true, data: charge };
    } catch (error) {
      logger.error(`Stripe charge error: ${error.message}`);
      throw new ApiError(400, 'PAYMENT_FAILED', error.message);
    }
  }

  // Stripe: Create payment intent (recommended)
  static async createStripePaymentIntent(amount, currency, metadata = {}) {
    try {
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: currency || 'INR',
        metadata,
      });

      logger.info(`Stripe intent created: ${intent.id}`);
      return { success: true, clientSecret: intent.client_secret, id: intent.id };
    } catch (error) {
      logger.error(`Stripe intent error: ${error.message}`);
      throw new ApiError(400, 'INTENT_CREATION_FAILED', error.message);
    }
  }

  // Stripe: Confirm payment
  static async confirmStripePayment(intentId) {
    try {
      const intent = await stripe.paymentIntents.retrieve(intentId);
      return {
        success: intent.status === 'succeeded',
        status: intent.status,
        transactionId: intent.id,
      };
    } catch (error) {
      logger.error(`Stripe confirm error: ${error.message}`);
      throw new ApiError(400, 'PAYMENT_CONFIRMATION_FAILED', error.message);
    }
  }

  // Stripe: Process refund
  static async refundStripePayment(chargeId, amount = null) {
    try {
      const refund = await stripe.refunds.create({
        charge: chargeId,
        ...(amount && { amount: Math.round(amount * 100) }),
      });

      logger.info(`Stripe refund created: ${refund.id}`);
      return { success: true, refundId: refund.id, amount: refund.amount / 100 };
    } catch (error) {
      logger.error(`Stripe refund error: ${error.message}`);
      throw new ApiError(400, 'REFUND_FAILED', error.message);
    }
  }

  // Razorpay: Create order
  static async createRazorpayOrder(amount, currency = 'INR', receipt = '', notes = {}) {
    try {
      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100), // Convert to paise
        currency,
        receipt,
        notes,
      });

      logger.info(`Razorpay order created: ${order.id}`);
      return {
        success: true,
        orderId: order.id,
        amount: order.amount / 100,
      };
    } catch (error) {
      logger.error(`Razorpay order creation error: ${error.message}`);
      throw new ApiError(400, 'RAZORPAY_ORDER_CREATION_FAILED', error.message);
    }
  }

  // Razorpay: Verify payment
  static async verifyRazorpayPayment(paymentId, orderId, signature) {
    try {
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
      hmac.update(orderId + '|' + paymentId);
      const computed_signature = hmac.digest('hex');

      if (computed_signature === signature) {
        const payment = await razorpay.payments.fetch(paymentId);
        logger.info(`Razorpay payment verified: ${paymentId}`);
        return { success: true, payment };
      } else {
        throw new ApiError(400, 'SIGNATURE_VERIFICATION_FAILED', 'Invalid signature');
      }
    } catch (error) {
      logger.error(`Razorpay verification error: ${error.message}`);
      if (error instanceof ApiError) throw error;
      throw new ApiError(400, 'PAYMENT_VERIFICATION_FAILED', error.message);
    }
  }

  // Razorpay: Refund payment
  static async refundRazorpayPayment(paymentId, amount = null) {
    try {
      const refund = await razorpay.payments.refund(paymentId, {
        amount: amount ? Math.round(amount * 100) : undefined,
      });

      logger.info(`Razorpay refund created: ${refund.id}`);
      return { success: true, refundId: refund.id, amount: refund.amount / 100 };
    } catch (error) {
      logger.error(`Razorpay refund error: ${error.message}`);
      throw new ApiError(400, 'REFUND_FAILED', error.message);
    }
  }

  // Validate card (optional validation before payment)
  static async validateCard(cardNumber, expiry, cvc) {
    try {
      // Basic validation
      if (!cardNumber || !expiry || !cvc) {
        throw new Error('Missing card details');
      }

      if (cardNumber.replace(/\s/g, '').length < 13) {
        throw new Error('Invalid card number');
      }

      return { valid: true };
    } catch (error) {
      logger.warn(`Card validation warning: ${error.message}`);
      return { valid: false, error: error.message };
    }
  }
}

module.exports = PaymentService;
