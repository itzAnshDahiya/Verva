const crypto = require('crypto');

class ValidationHelper {
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPhone(phone, country = 'IN') {
    // India: 10 digits, starts with 6-9
    if (country === 'IN') {
      return /^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''));
    }
    return false;
  }

  static isValidPincode(pincode, country = 'IN') {
    if (country === 'IN') {
      return /^\d{6}$/.test(pincode);
    }
    return false;
  }

  static isValidPassword(password) {
    // At least 6 chars
    return password && password.length >= 6;
  }

  static isValidCouponCode(code) {
    // Alphanumeric, 3-20 characters
    return /^[A-Z0-9]{3,20}$/.test(code);
  }

  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '').substring(0, 5000);
  }

  static generateRandomToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  static generateRandomCode(length = 8, uppercase = true) {
    const chars = uppercase
      ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      : 'abcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}

module.exports = ValidationHelper;
