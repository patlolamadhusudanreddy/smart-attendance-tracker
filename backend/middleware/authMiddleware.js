const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Protect routes by validating JWT Bearer token
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'super_secret_jwt_key_smart_attendance_system_2025_secure_key'
      );

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return errorResponse(res, 401, 'User associated with this token no longer exists.');
      }

      if (!user.isVerified) {
        return errorResponse(res, 403, 'Email address is not verified. Please verify your OTP first.');
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('[AuthMiddleware] Token error:', error.message);
      return errorResponse(res, 401, 'Not authorized, token validation failed or expired.');
    }
  }

  if (!token) {
    return errorResponse(res, 401, 'Not authorized, no bearer token provided in request header.');
  }
};

/**
 * Authorize specific roles (e.g. 'admin', 'teacher', 'student')
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return errorResponse(
        res,
        403,
        `Role (${req.user ? req.user.role : 'Guest'}) is not permitted to access this resource.`
      );
    }
    next();
  };
};

module.exports = {
  protect,
  authorizeRoles,
};
