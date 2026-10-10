const crypto = require('crypto');

/**
 * Generates a secure 6-digit numeric OTP
 * @returns {string} 6-digit OTP string
 */
const generateOtp = () => {
  const otpNumber = crypto.randomInt(100000, 999999);
  return otpNumber.toString();
};

module.exports = { generateOtp };
