const Student = require('../models/Student');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const ActivityLog = require('../models/ActivityLog');
const { parseStudentsExcel } = require('../services/excelService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Get all students with search & pagination & filters
 * @route   GET /api/students
 * @access  Private (Admin, Teacher)
 */
const getStudents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { search, department, semester, section } = req.query;

    const query = {};
    if (department) query.department = department;
    if (semester) query.semester = Number(semester);
    if (section) query.section = section.toUpperCase();

    // If search term provided, find matching users or roll numbers
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const matchingUsers = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
      }).select('_id');

      const userIds = matchingUsers.map((u) => u._id);

      query.$or = [{ rollNumber: searchRegex }, { user: { $in: userIds } }];
    }

    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .populate('user', 'name email avatar phone isVerified')
      .sort({ rollNumber: 1 })
      .skip(skip)
      .limit(limit);

    return successResponse(
      res,
      200,
      'Students retrieved successfully',
      students,
      {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single student details by ID
 * @route   GET /api/students/:id
 * @access  Private (Admin, Teacher, Student himself)
 */
const getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('user', 'name email avatar phone isVerified')
      .populate({
        path: 'user',
        select: '-password',
      });

    if (!student) {
      return errorResponse(res, 404, 'Student not found.');
    }

    // Calculate overall attendance stats
    const totalLectures = await Attendance.countDocuments({ student: student._id });
    const presentLectures = await Attendance.countDocuments({ student: student._id, status: 'Present' });
    const percentage = totalLectures > 0 ? ((presentLectures / totalLectures) * 100).toFixed(1) : 0;

    return successResponse(res, 200, 'Student details retrieved', {
      student,
      attendanceStats: {
        totalLectures,
        presentLectures,
        percentage: Number(percentage),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new student (Admin only)
 * @route   POST /api/students
 * @access  Private (Admin)
 */
const createStudent = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password = 'Password123!',
      rollNumber,
      department,
      semester,
      section = 'A',
      batch = '2023-2027',
      guardianContact = '',
      phone = '',
    } = req.body;

    if (!name || !email || !rollNumber || !department || !semester) {
      return errorResponse(res, 400, 'Name, email, roll number, department, and semester are required.');
    }

    // Check user & roll duplicate
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse(res, 400, 'User with this email already exists.');
    }

    const existingRoll = await Student.findOne({ rollNumber: rollNumber.toUpperCase() });
    if (existingRoll) {
      return errorResponse(res, 400, 'Student with this roll number already exists.');
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'student',
      isVerified: true,
      phone,
    });

    // Create student
    const student = await Student.create({
      user: user._id,
      rollNumber: rollNumber.toUpperCase(),
      department,
      semester: Number(semester),
      section: section.toUpperCase(),
      batch,
      guardianContact,
    });

    await ActivityLog.create({
      user: req.user._id,
      action: 'STUDENT_CREATED',
      details: `Created student ${name} (${rollNumber.toUpperCase()})`,
    });

    const populatedStudent = await Student.findById(student._id).populate('user', '-password');
    return successResponse(res, 201, 'Student created successfully', populatedStudent);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update student details
 * @route   PUT /api/students/:id
 * @access  Private (Admin)
 */
const updateStudent = async (req, res, next) => {
  try {
    const { name, phone, department, semester, section, batch, guardianContact, isActive } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) {
      return errorResponse(res, 404, 'Student not found.');
    }

    if (department) student.department = department;
    if (semester !== undefined) student.semester = Number(semester);
    if (section) student.section = section.toUpperCase();
    if (batch) student.batch = batch;
    if (guardianContact !== undefined) student.guardianContact = guardianContact;
    if (isActive !== undefined) student.isActive = isActive;

    await student.save();

    // Update user info
    if (name || phone !== undefined) {
      const user = await User.findById(student.user);
      if (user) {
        if (name) user.name = name;
        if (phone !== undefined) user.phone = phone;
        await user.save();
      }
    }

    const updated = await Student.findById(student._id).populate('user', '-password');
    return successResponse(res, 200, 'Student updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete student profile & associated records
 * @route   DELETE /api/students/:id
 * @access  Private (Admin)
 */
const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return errorResponse(res, 404, 'Student not found.');
    }

    // Delete attendance records for this student
    await Attendance.deleteMany({ student: student._id });

    // Delete user account
    await User.findByIdAndDelete(student.user);

    // Delete student
    await Student.findByIdAndDelete(student._id);

    await ActivityLog.create({
      user: req.user._id,
      action: 'STUDENT_DELETED',
      details: `Deleted student ID: ${req.params.id}`,
    });

    return successResponse(res, 200, 'Student and associated records removed successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk Upload Students via Excel
 * @route   POST /api/students/bulk-upload
 * @access  Private (Admin)
 */
const bulkUploadStudents = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 400, 'Please upload an Excel spreadsheet (.xlsx or .xls).');
    }

    const parsedData = parseStudentsExcel(req.file.buffer);
    if (!parsedData || parsedData.length === 0) {
      return errorResponse(res, 400, 'No student records found in the uploaded file.');
    }

    const inserted = [];
    const skipped = [];

    for (const row of parsedData) {
      if (!row.email || !row.rollNumber || !row.name) {
        skipped.push({ row, reason: 'Missing name, email, or roll number' });
        continue;
      }

      const existingUser = await User.findOne({ email: row.email.toLowerCase() });
      const existingRoll = await Student.findOne({ rollNumber: row.rollNumber.toUpperCase() });

      if (existingUser || existingRoll) {
        skipped.push({ row, reason: 'Duplicate email or roll number already exists' });
        continue;
      }

      const user = await User.create({
        name: row.name,
        email: row.email.toLowerCase(),
        password: 'Password123!',
        role: 'student',
        isVerified: true,
        phone: row.phone || '',
      });

      const student = await Student.create({
        user: user._id,
        rollNumber: row.rollNumber.toUpperCase(),
        department: row.department || 'Computer Science',
        semester: row.semester || 1,
        section: row.section || 'A',
        batch: row.batch || '2023-2027',
      });

      inserted.push({ name: user.name, rollNumber: student.rollNumber });
    }

    await ActivityLog.create({
      user: req.user._id,
      action: 'STUDENTS_BULK_UPLOADED',
      details: `Imported ${inserted.length} students via Excel (Skipped: ${skipped.length})`,
    });

    return successResponse(res, 200, `Bulk upload finished. Added: ${inserted.length}, Skipped: ${skipped.length}`, {
      insertedCount: inserted.length,
      skippedCount: skipped.length,
      inserted,
      skipped,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload Student Profile Photo
 * @route   POST /api/students/:id/photo
 * @access  Private (Admin, Student)
 */
const uploadStudentPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 400, 'Please upload an image file.');
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
      return errorResponse(res, 404, 'Student not found.');
    }

    // Set relative path or static URL
    const photoUrl = `/uploads/${req.file.filename}`;
    await User.findByIdAndUpdate(student.user, { avatar: photoUrl });

    return successResponse(res, 200, 'Profile photo uploaded successfully', { photoUrl });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkUploadStudents,
  uploadStudentPhoto,
};
