const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    rollNumber: {
      type: String,
      required: [true, 'Please provide roll number'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    admissionNumber: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      required: [true, 'Please specify department (e.g. Computer Science)'],
      trim: true,
    },
    semester: {
      type: Number,
      required: [true, 'Please specify semester (1-8)'],
      min: 1,
      max: 8,
    },
    section: {
      type: String,
      default: 'A',
      uppercase: true,
      trim: true,
    },
    batch: {
      type: String,
      default: '2023-2027',
      trim: true,
    },
    guardianContact: {
      type: String,
      default: '',
      trim: true,
    },
    qrCodeKey: {
      type: String,
      unique: true,
      sparse: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Student', studentSchema);
