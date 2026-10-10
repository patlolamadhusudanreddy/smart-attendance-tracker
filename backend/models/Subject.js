const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide subject name'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Please provide subject course code (e.g. CS501)'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Please provide department'],
      trim: true,
    },
    semester: {
      type: Number,
      required: [true, 'Please provide semester'],
      min: 1,
      max: 8,
    },
    credits: {
      type: Number,
      default: 3,
      min: 1,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Subject', subjectSchema);
