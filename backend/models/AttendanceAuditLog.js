const mongoose = require('mongoose');

const attendanceAuditLogSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      index: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      index: true,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED'],
      required: true,
      index: true,
    },
    failureReason: {
      type: String,
      enum: [
        'Outside Geofence',
        'Expired QR',
        'Already Marked',
        'Face Verification Failed',
        'Session Closed',
        'Replay Attack',
        'Invalid QR Token',
        'GPS Coordinates Missing',
        'Student Profile Not Found',
        'WiFi Verification Failed',
        null,
      ],
      default: null,
      index: true,
    },
    message: {
      type: String,
      default: '',
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    distanceMeters: {
      type: Number,
    },
    allowedRadiusMeters: {
      type: Number,
    },
    ipAddress: {
      type: String,
      default: 'Unknown',
    },
    browser: {
      type: String,
      default: 'Unknown',
    },
    os: {
      type: String,
      default: 'Unknown',
    },
    userAgent: {
      type: String,
      default: 'Unknown',
    },
    deviceId: {
      type: String,
      default: 'Unknown',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

attendanceAuditLogSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('AttendanceAuditLog', attendanceAuditLogSchema);
