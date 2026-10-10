const mongoose = require('mongoose');

const qrTokenSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      required: true,
      index: true,
    },
    tokenId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    encryptedPayload: {
      type: String,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
      index: true,
    },
    usedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
    },
    usedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Automatic TTL cleanup 1 hour after expiration so replay history stays solid during class
qrTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

module.exports = mongoose.model('QrToken', qrTokenSchema);
