const nodemailer = require('nodemailer');
const logger = require('../config/logger');

class EmailService {
  static async initializeTransporter() {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  static async sendEmail(to, subject, html, text = null) {
    try {
      const transporter = await this.initializeTransporter();

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`Email sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`Email send error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // Welcome email
  static async sendWelcomeEmail(user) {
    const html = `
      <h1>Welcome to VERVA, ${user.name}!</h1>
      <p>Thank you for creating an account with us.</p>
      <p>Get ready to experience the premium air purification.</p>
      <a href="${process.env.FRONTEND_URL}/shop" style="background:#007bff;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">Start Shopping</a>
      <hr>
      <p>Questions? Contact us at support@verva.com</p>
    `;

    return this.sendEmail(user.email, 'Welcome to VERVA!', html);
  }

  // Order confirmation
  static async sendOrderConfirmation(user, order) {
    const itemsHtml = order.items
      .map(
        (item) =>
          `<tr><td>${item.name}</td><td>${item.quantity}</td><td>₹${item.price}</td></tr>`
      )
      .join('');

    const html = `
      <h1>Order Confirmed!</h1>
      <p>Hi ${user.name},</p>
      <p>Your order <strong>#${order.orderNumber}</strong> has been received.</p>
      <table border="1" cellpadding="10">
        <tr><th>Product</th><th>Qty</th><th>Price</th></tr>
        ${itemsHtml}
      </table>
      <p><strong>Total: ₹${order.pricing.total}</strong></p>
      <p>Order will be processed and shipped soon.</p>
      <a href="${process.env.FRONTEND_URL}/order/${order._id}" style="background:#28a745;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">Track Order</a>
    `;

    return this.sendEmail(user.email, `Order Confirmation #${order.orderNumber}`, html);
  }

  // Shipment notification
  static async sendShipmentNotification(user, order, trackingUrl) {
    const html = `
      <h1>Your Order Has Been Shipped!</h1>
      <p>Hi ${user.name},</p>
      <p>Order #${order.orderNumber} has been shipped.</p>
      <p><strong>Tracking Number:</strong> ${order.shipping.trackingNumber}</p>
      <p><strong>Carrier:</strong> ${order.shipping.carrier}</p>
      <p><strong>Estimated Delivery:</strong> ${new Date(order.shipping.estimatedDelivery).toLocaleDateString()}</p>
      <a href="${trackingUrl}" style="background:#007bff;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">Track Package</a>
    `;

    return this.sendEmail(user.email, `Order Shipped #${order.orderNumber}`, html);
  }

  // Delivery notification
  static async sendDeliveryNotification(user, order) {
    const html = `
      <h1>Order Delivered!</h1>
      <p>Hi ${user.name},</p>
      <p>Your order #${order.orderNumber} has been delivered.</p>
      <p>We hope you love your VERVA purifier!</p>
      <a href="${process.env.FRONTEND_URL}/reviews/add/${order._id}" style="background:#ffc107;color:black;padding:10px 20px;border-radius:5px;text-decoration:none;">Leave a Review</a>
    `;

    return this.sendEmail(user.email, `Delivery Confirmation #${order.orderNumber}`, html);
  }

  // Abandoned cart reminder
  static async sendAbandonedCartEmail(user, cart) {
    const itemsHtml = cart.items
      .map((item) => `<li>${item.product.name} x${item.quantity}</li>`)
      .join('');

    const html = `
      <h1>You left items in your cart!</h1>
      <p>Hi ${user.name},</p>
      <p>Don't miss out on your items:</p>
      <ul>${itemsHtml}</ul>
      <p><strong>Cart Total: ₹${cart.totals.total}</strong></p>
      <a href="${process.env.FRONTEND_URL}/cart" style="background:#dc3545;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">Complete Your Purchase</a>
    `;

    return this.sendEmail(user.email, 'Complete Your Purchase - Items in Your Cart', html);
  }

  // Password reset
  static async sendPasswordResetEmail(user, resetLink) {
    const html = `
      <h1>Reset Your Password</h1>
      <p>Hi ${user.name},</p>
      <p>We received a request to reset your password. Click the link below to create a new password:</p>
      <a href="${resetLink}" style="background:#007bff;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">Reset Password</a>
      <p><strong>This link will expire in 1 hour.</strong></p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    return this.sendEmail(user.email, 'Reset Your Password', html);
  }

  // Review request
  static async sendReviewRequestEmail(user, product, order) {
    const html = `
      <h1>Share Your Experience</h1>
      <p>Hi ${user.name},</p>
      <p>We'd love to hear what you think about your ${product.name}!</p>
      <p>Your feedback helps us improve and helps other customers make informed decisions.</p>
      <a href="${process.env.FRONTEND_URL}/product/${product.slug}/review?order=${order._id}" style="background:#28a745;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">Write a Review</a>
      <p>Thank you for choosing VERVA!</p>
    `;

    return this.sendEmail(user.email, `Share Your Thoughts on ${product.name}`, html);
  }

  // Newsletter subscription
  static async sendNewsletterWelcome(email) {
    const html = `
      <h1>Welcome to VERVA Newsletter!</h1>
      <p>You're subscribed to our air quality tips, product launches, and exclusive offers.</p>
      <p>Thank you for staying connected with us!</p>
    `;

    return this.sendEmail(email, 'Welcome to VERVA Newsletter', html);
  }
}

module.exports = EmailService;
