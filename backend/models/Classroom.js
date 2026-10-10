const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide classroom name (e.g. Lecture Hall 101)'],
      trim: true,
    },
    roomNumber: {
      type: String,
      required: [true, 'Please provide room number (e.g. LH-101)'],
      trim: true,
      uppercase: true,
    },
    building: {
      type: String,
      default: 'Main Academic Block',
      trim: true,
    },
    latitude: {
      type: Number,
      required: [true, 'Please specify classroom latitude coordinate'],
    },
    longitude: {
      type: Number,
      required: [true, 'Please specify classroom longitude coordinate'],
    },
    radiusMeters: {
      type: Number,
      default: 30, // 30 meters default geofence radius
      min: [5, 'Radius must be at least 5 meters'],
      max: [500, 'Radius cannot exceed 500 meters'],
    },
    allowedWifiIps: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Classroom', classroomSchema);
