const AuthService = require('../services/AuthService');
const EmailService = require('../services/EmailService');
const { ApiError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

class AuthController {
  static async signup(req, res, next) {
    try {
      const { name, email, password, phone } = req.body;

      const result = await AuthService.register(name, email, password, phone);

      // Send welcome email
      if (process.env.NODE_ENV !== 'development') {
        await EmailService.sendWelcomeEmail({ name, email });
      }

      res.status(201).json({
        success: true,
        code: 'SIGNUP_SUCCESS',
        message: 'Account created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const result = await AuthService.login(email, password);

      // Set refresh token in httpOnly cookie (optional)
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.status(200).json({
        success: true,
        code: 'LOGIN_SUCCESS',
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new ApiError(400, 'REFRESH_TOKEN_REQUIRED', 'Refresh token is required');
      }

      const result = await AuthService.refreshAccessToken(refreshToken);

      res.status(200).json({
        success: true,
        code: 'TOKEN_REFRESHED',
        message: 'Access token refreshed',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      await AuthService.logout(req.user.id);

      res.clearCookie('refreshToken');

      res.status(200).json({
        success: true,
        code: 'LOGOUT_SUCCESS',
        message: 'Logged out successfully',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const result = await AuthService.requestPasswordReset(email);

      if (result.success && result.resetLink) {
        // Send email (only in production or if configured)
        if (process.env.NODE_ENV !== 'development') {
          const User = require('../models/User');
          const user = await User.findOne({ email });
          if (user) {
            await EmailService.sendPasswordResetEmail(user, result.resetLink);
          }
        }
      }

      res.status(200).json({
        success: true,
        code: 'RESET_EMAIL_SENT',
        message: 'If email exists, password reset link has been sent',
        data: { resetLink: result.resetLink },
      });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const { resetToken, newPassword } = req.body;

      const result = await AuthService.resetPassword(resetToken, newPassword);

      res.status(200).json({
        success: true,
        code: 'PASSWORD_RESET_SUCCESS',
        message: 'Password reset successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get current user profile
  static async getProfile(req, res, next) {
    try {
      const User = require('../models/User');
      const user = await User.findById(req.user.id).select('-password');

      if (!user) {
        throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
      }

      res.status(200).json({
        success: true,
        code: 'USER_FOUND',
        message: 'User profile retrieved',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user profile
  static async updateProfile(req, res, next) {
    try {
      const User = require('../models/User');
      const { name, phone, avatar } = req.body;

      const user = await User.findByIdAndUpdate(
        req.user.id,
        { name, phone, avatar },
        { new: true, runValidators: true }
      ).select('-password');

      res.status(200).json({
        success: true,
        code: 'PROFILE_UPDATED',
        message: 'Profile updated successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // Add address
  static async addAddress(req, res, next) {
    try {
      const User = require('../models/User');
      const { fullName, phoneNumber, addressLine1, addressLine2, city, state, postalCode, country, type } = req.body;

      const user = await User.findById(req.user.id);
      
      // Make first address default
      const isDefault = user.addresses.length === 0;

      user.addresses.push({
        fullName,
        phoneNumber,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
        type: type || 'home',
        isDefault,
      });

      await user.save();

      res.status(201).json({
        success: true,
        code: 'ADDRESS_ADDED',
        message: 'Address added successfully',
        data: user.addresses[user.addresses.length - 1],
      });
    } catch (error) {
      next(error);
    }
  }

  // Update address
  static async updateAddress(req, res, next) {
    try {
      const User = require('../models/User');
      const { addressId } = req.params;
      const updates = req.body;

      const user = await User.findById(req.user.id);
      const address = user.addresses.id(addressId);

      if (!address) {
        throw new ApiError(404, 'ADDRESS_NOT_FOUND', 'Address not found');
      }

      Object.assign(address, updates);
      await user.save();

      res.status(200).json({
        success: true,
        code: 'ADDRESS_UPDATED',
        message: 'Address updated successfully',
        data: address,
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete address
  static async deleteAddress(req, res, next) {
    try {
      const User = require('../models/User');
      const { addressId } = req.params;

      const user = await User.findById(req.user.id);
      user.addresses.id(addressId).remove();

      // Make first address default if current was deleted
      if (user.addresses.length > 0 && !user.addresses.some(a => a.isDefault)) {
        user.addresses[0].isDefault = true;
      }

      await user.save();

      res.status(200).json({
        success: true,
        code: 'ADDRESS_DELETED',
        message: 'Address deleted successfully',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
