const express = require('express');
const router = express.Router();
const {
  register,
  verifyOtp,
  resendOtp,
  login,
  forgotPassword,
  verifyForgotOtp,
  resetPassword,
  getMe,
  updateProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

// Public Authentication & OTP Endpoints
router.post('/register', authLimiter, register);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/resend-otp', authLimiter, resendOtp);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/verify-forgot-otp', authLimiter, verifyForgotOtp);
router.post('/reset-password', authLimiter, resetPassword);

// Private Authenticated User Endpoints
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;
