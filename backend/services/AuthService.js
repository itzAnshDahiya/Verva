const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ApiError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

class AuthService {
  // Generate JWT tokens
  static generateTokens(userId, role) {
    const accessToken = jwt.sign(
      { id: userId, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    const refreshToken = jwt.sign(
      { id: userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
    );

    return { accessToken, refreshToken };
  }

  // Register new user
  static async register(name, email, password, phone = null) {
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(400, 'EMAIL_EXISTS', 'Email already registered');
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      phone,
      isEmailVerified: false,
    });

    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(user._id, user.role);

    logger.info(`User registered: ${email}`);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  // Login user
  static async login(email, password) {
    // Find user with password field
    const user = await User.findOne({ email }).select('+password +lockUntil +loginAttempts');

    if (!user) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Check if account is locked
    if (user.isLocked()) {
      const minutesRemaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
      throw new ApiError(
        423,
        'ACCOUNT_LOCKED',
        `Account is temporarily locked. Try again in ${minutesRemaining} minutes`,
        { minutesRemaining }
      );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await user.incLoginAttempts();
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(user._id, user.role);

    logger.info(`User logged in: ${email}`);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  // Refresh access token
  static async refreshAccessToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        throw new ApiError(401, 'USER_NOT_FOUND', 'User not found');
      }

      const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(
        user._id,
        user.role
      );

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token');
    }
  }

  // Logout
  static async logout(userId) {
    logger.info(`User logged out: ${userId}`);
    return { success: true };
  }

  // Forgot password
  static async requestPasswordReset(email) {
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if email exists
      return { success: true };
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    logger.info(`Password reset requested for: ${email}`);

    return {
      success: true,
      resetLink: `${process.env.FRONTEND_URL}/reset-password/${resetToken}`,
    };
  }

  // Reset password with token
  static async resetPassword(resetToken, newPassword) {
    try {
      const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user || user.passwordResetToken !== resetToken) {
        throw new ApiError(400, 'INVALID_RESET_TOKEN', 'Invalid or expired reset token');
      }

      if (new Date() > user.passwordResetExpires) {
        throw new ApiError(400, 'RESET_TOKEN_EXPIRED', 'Reset token has expired');
      }

      user.password = newPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      logger.info(`Password reset for user: ${user.email}`);

      return { success: true, message: 'Password reset successful' };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(400, 'RESET_FAILED', 'Password reset failed');
    }
  }
}

module.exports = AuthService;
