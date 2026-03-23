const { setCache, getCache, delCache } = require('../config/cache');
const logger = require('../config/logger');

class CacheHelper {
  static generateKey(prefix, ...args) {
    return `${prefix}:${args.join(':')}`;
  }

  static async setWithPrefix(prefix, key, value, expiry = 3600) {
    const fullKey = this.generateKey(prefix, key);
    await setCache(fullKey, value, expiry);
  }

  static async getWithPrefix(prefix, key) {
    const fullKey = this.generateKey(prefix, key);
    return await getCache(fullKey);
  }

  static async delWithPrefix(prefix, key) {
    const fullKey = this.generateKey(prefix, key);
    await delCache(fullKey);
  }

  // Cache keys
  static PRODUCT = 'product';
  static PRODUCTS = 'products';
  static CART = 'cart';
  static USER = 'user';
  static ORDERS = 'orders';
  static REVIEWS = 'reviews';
  static CATEGORIES = 'categories';
}

module.exports = CacheHelper;
