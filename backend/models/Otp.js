const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required for OTP verification'],
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: [true, 'OTP code is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['registration', 'forgot_password'],
      default: 'registration',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Automatically remove expired OTP documents from MongoDB
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Otp', otpSchema);
