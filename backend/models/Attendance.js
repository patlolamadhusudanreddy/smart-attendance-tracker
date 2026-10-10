const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Please provide attendance date'],
      index: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Attendance must belong to a subject'],
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Attendance must belong to a student'],
      index: true,
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      index: true,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User who marked the attendance is required'],
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late', 'Excused'],
      default: 'Present',
      required: true,
    },
    method: {
      type: String,
      enum: ['Manual', 'QR', 'Batch', 'Excel'],
      default: 'Manual',
    },
    location: {
      latitude: Number,
      longitude: Number,
      distanceMeters: Number,
    },
    deviceInfo: {
      ip: String,
      browser: String,
      os: String,
      userAgent: String,
      deviceId: String,
    },
    faceVerified: {
      type: Boolean,
      default: false,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast queries and preventing duplicate marking for the same student, subject, and date
attendanceSchema.index({ date: 1, subject: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
