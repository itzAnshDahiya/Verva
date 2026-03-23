// =========================================================
// VERVA – api.js  | Backend API Service Layer (Production-Grade)
// =========================================================
'use strict';

// Determine API URL based on environment
const getApiUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api/v1';
  }
  // For production, construct from current domain
  return `${window.location.protocol}//${hostname}/api/v1`;
};

const API_URL = getApiUrl();

/* ---- Utility Functions ---- */
const getAuthToken = () => localStorage.getItem('VERVA-token');
const setAuthToken = (token) => localStorage.setItem('VERVA-token', token);
const clearAuthToken = () => localStorage.removeItem('VERVA-token');
const getRefreshToken = () => localStorage.getItem('VERVA-refresh-token');
const setRefreshToken = (token) => localStorage.setItem('VERVA-refresh-token', token);

const apiCall = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle 401 Unauthorized
      if (response.status === 401 && data.code === 'TOKEN_EXPIRED') {
        await refreshAccessToken();
        return apiCall(endpoint, options); // Retry
      }

      throw new Error(data.message || 'API Error');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    showToast?.(error.message || 'Network error', 'error');
    throw error;
  }
};

/* ---- Authentication API ---- */
class AuthAPI {
  static async signup(name, email, password, phone) {
    const response = await apiCall('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone }),
    });

    if (response.success && response.data.accessToken) {
      setAuthToken(response.data.accessToken);
      setRefreshToken(response.data.refreshToken);
      localStorage.setItem('VERVA-user', JSON.stringify(response.data.user));
    }

    return response;
  }

  static async login(email, password) {
    const response = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data.accessToken) {
      setAuthToken(response.data.accessToken);
      setRefreshToken(response.data.refreshToken);
      localStorage.setItem('VERVA-user', JSON.stringify(response.data.user));
    }

    return response;
  }

  static async logout() {
    try {
      await apiCall('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.warn('Logout API error:', error);
    }

    clearAuthToken();
    localStorage.removeItem('VERVA-refresh-token');
    localStorage.removeItem('VERVA-user');
  }

  static async getProfile() {
    return await apiCall('/auth/profile', { method: 'GET' });
  }

  static async updateProfile(data) {
    return await apiCall('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async addAddress(addressData) {
    return await apiCall('/auth/addresses', {
      method: 'POST',
      body: JSON.stringify(addressData),
    });
  }

  static async updateAddress(addressId, addressData) {
    return await apiCall(`/auth/addresses/${addressId}`, {
      method: 'PUT',
      body: JSON.stringify(addressData),
    });
  }

  static async deleteAddress(addressId) {
    return await apiCall(`/auth/addresses/${addressId}`, { method: 'DELETE' });
  }

  static async forgotPassword(email) {
    return await apiCall('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  static async resetPassword(resetToken, newPassword) {
    return await apiCall('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ resetToken, newPassword }),
    });
  }
}

/* ---- Product API ---- */
class ProductAPI {
  static async getProducts(query = {}) {
    const params = new URLSearchParams(query).toString();
    return await apiCall(`/products${params ? '?' + params : ''}`, { method: 'GET' });
  }

  static async getProduct(slug) {
    return await apiCall(`/products/${slug}`, { method: 'GET' });
  }

  static async getFeatured(limit = 6) {
    return await apiCall(`/products/featured?limit=${limit}`, { method: 'GET' });
  }

  static async search(query, limit = 10) {
    return await apiCall(`/products/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
      method: 'GET',
    });
  }

  static async getRecommendations(productId, limit = 4) {
    return await apiCall(`/products/recommendations/${productId}?limit=${limit}`, {
      method: 'GET',
    });
  }

  static async getCategories() {
    return await apiCall('/products/categories', { method: 'GET' });
  }
}

/* ---- Cart API ---- */
class CartAPI {
  static async getCart() {
    return await apiCall('/cart', { method: 'GET' });
  }

  static async addItem(productId, quantity = 1, variant = 'Standard') {
    return await apiCall('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity, variant }),
    });
  }

  static async updateItem(productId, quantity, variant = 'Standard') {
    return await apiCall(`/cart/items/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity, variant }),
    });
  }

  static async removeItem(productId, variant = 'Standard') {
    return await apiCall(`/cart/items/${productId}?variant=${variant}`, {
      method: 'DELETE',
    });
  }

  static async clearCart() {
    return await apiCall('/cart', { method: 'DELETE' });
  }

  static async applyCoupon(code) {
    return await apiCall('/cart/coupon', {
      method: 'POST',
      body: JSON.stringify({ couponCode: code }),
    });
  }

  static async removeCoupon() {
    return await apiCall('/cart/coupon', { method: 'DELETE' });
  }
}

/* ---- Order API ---- */
class OrderAPI {
  static async createOrder(orderData) {
    return await apiCall('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  static async getOrders(query = {}) {
    const params = new URLSearchParams(query).toString();
    return await apiCall(`/orders${params ? '?' + params : ''}`, { method: 'GET' });
  }

  static async getOrder(orderId) {
    return await apiCall(`/orders/${orderId}`, { method: 'GET' });
  }

  static async cancelOrder(orderId) {
    return await apiCall(`/orders/${orderId}/cancel`, { method: 'POST' });
  }

  static async requestReturn(orderId, reason) {
    return await apiCall(`/orders/${orderId}/return`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }
}

/* ---- Review API ---- */
class ReviewAPI {
  static async createReview(productId, reviewData) {
    return await apiCall(`/reviews/${productId}`, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  static async getProductReviews(productId, query = {}) {
    const params = new URLSearchParams(query).toString();
    return await apiCall(`/reviews/${productId}${params ? '?' + params : ''}`, {
      method: 'GET',
    });
  }

  static async updateReview(reviewId, reviewData) {
    return await apiCall(`/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(reviewData),
    });
  }

  static async deleteReview(reviewId) {
    return await apiCall(`/reviews/${reviewId}`, { method: 'DELETE' });
  }

  static async markHelpful(reviewId, helpful = true) {
    return await apiCall(`/reviews/${reviewId}/helpful`, {
      method: 'POST',
      body: JSON.stringify({ helpful }),
    });
  }
}

/* ---- Wishlist API ---- */
class WishlistAPI {
  static async getWishlist() {
    return await apiCall('/wishlist', { method: 'GET' });
  }

  static async addItem(productId, note = '', priority = 'medium') {
    return await apiCall('/wishlist/items', {
      method: 'POST',
      body: JSON.stringify({ productId, note, priority }),
    });
  }

  static async updateItem(itemId, note, priority) {
    return await apiCall(`/wishlist/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ note, priority }),
    });
  }

  static async removeItem(productId) {
    return await apiCall(`/wishlist/items/${productId}`, { method: 'DELETE' });
  }

  static async isInWishlist(productId) {
    return await apiCall(`/wishlist/check/${productId}`, { method: 'GET' });
  }

  static async clearWishlist() {
    return await apiCall('/wishlist', { method: 'DELETE' });
  }
}

/* ---- Token Refresh ---- */
async function refreshAccessToken() {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearAuthToken();
      location.href = '/login.html';
      return null;
    }

    const response = await fetch(`${API_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (data.success && data.data.accessToken) {
      setAuthToken(data.data.accessToken);
      setRefreshToken(data.data.refreshToken);
      return data.data.accessToken;
    } else {
      clearAuthToken();
      location.href = '/login.html';
      return null;
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    clearAuthToken();
    location.href = '/login.html';
    return null;
  }
}

/* ---- User Helper ---- */
const getUserFromToken = () => {
  try {
    return JSON.parse(localStorage.getItem('VERVA-user')) || null;
  } catch {
    return null;
  }
};

const isLoggedIn = () => !!getAuthToken();

// Export APIs
window.API = {
  Auth: AuthAPI,
  Product: ProductAPI,
  Cart: CartAPI,
  Order: OrderAPI,
  Review: ReviewAPI,
  Wishlist: WishlistAPI,
  isLoggedIn,
  getUserFromToken,
};
