const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    employeeId: {
      type: String,
      required: [true, 'Please provide employee ID'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Please provide teacher department'],
      trim: true,
    },
    designation: {
      type: String,
      default: 'Assistant Professor',
      trim: true,
    },
    qualification: {
      type: String,
      default: 'M.Tech / Ph.D',
      trim: true,
    },
    assignedSubjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Teacher', teacherSchema);
