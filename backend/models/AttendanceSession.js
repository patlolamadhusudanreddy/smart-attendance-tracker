const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Session must belong to a teacher'],
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Session must belong to a subject'],
    },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
    },
    roomName: {
      type: String,
      default: 'Main Classroom',
    },
    roomCoordinates: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
      radiusMeters: {
        type: Number,
        default: 30,
      },
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    durationMinutes: {
      type: Number,
      default: 10,
    },
    endTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'closed'],
      default: 'active',
      index: true,
    },
    currentQrToken: {
      type: String,
    },
    currentQrNonce: {
      type: String,
    },
    qrExpiresAt: {
      type: Date,
    },
    totalAttendees: {
      type: Number,
      default: 0,
    },
    closedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding active sessions quickly
attendanceSessionSchema.index({ teacher: 1, subject: 1, status: 1 });

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
