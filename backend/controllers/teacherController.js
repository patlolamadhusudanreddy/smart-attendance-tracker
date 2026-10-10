const Teacher = require('../models/Teacher');
const User = require('../models/User');
const Subject = require('../models/Subject');
const ActivityLog = require('../models/ActivityLog');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Get all teachers with search and pagination
 * @route   GET /api/teachers
 * @access  Private (Admin, Teacher)
 */
const getTeachers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { search, department } = req.query;
    const query = {};

    if (department) {
      query.department = department;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const matchingUsers = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
      }).select('_id');

      const userIds = matchingUsers.map((u) => u._id);
      query.$or = [{ employeeId: searchRegex }, { user: { $in: userIds } }];
    }

    const total = await Teacher.countDocuments(query);
    const teachers = await Teacher.find(query)
      .populate('user', 'name email avatar phone isVerified')
      .populate('assignedSubjects', 'name code department semester')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return successResponse(res, 200, 'Teachers fetched successfully', teachers, {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single teacher details
 * @route   GET /api/teachers/:id
 * @access  Private
 */
const getTeacherById = async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .populate('user', 'name email avatar phone isVerified')
      .populate('assignedSubjects', 'name code department semester');

    if (!teacher) {
      return errorResponse(res, 404, 'Teacher not found.');
    }

    return successResponse(res, 200, 'Teacher retrieved successfully', teacher);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new teacher (Admin only)
 * @route   POST /api/teachers
 * @access  Private (Admin)
 */
const createTeacher = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password = 'Password123!',
      employeeId,
      department,
      designation = 'Assistant Professor',
      qualification = 'M.Tech / Ph.D',
      phone = '',
      assignedSubjects = [],
    } = req.body;

    if (!name || !email || !employeeId || !department) {
      return errorResponse(res, 400, 'Name, email, employee ID, and department are required.');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse(res, 400, 'User with this email already exists.');
    }

    const existingEmp = await Teacher.findOne({ employeeId: employeeId.toUpperCase() });
    if (existingEmp) {
      return errorResponse(res, 400, 'Teacher with this employee ID already exists.');
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'teacher',
      isVerified: true,
      phone,
    });

    const teacher = await Teacher.create({
      user: user._id,
      employeeId: employeeId.toUpperCase(),
      department,
      designation,
      qualification,
      assignedSubjects,
    });

    // If subjects were assigned, update Subject models
    if (assignedSubjects.length > 0) {
      await Subject.updateMany({ _id: { $in: assignedSubjects } }, { teacher: teacher._id });
    }

    await ActivityLog.create({
      user: req.user._id,
      action: 'TEACHER_CREATED',
      details: `Created teacher ${name} (${employeeId.toUpperCase()})`,
    });

    const created = await Teacher.findById(teacher._id)
      .populate('user', '-password')
      .populate('assignedSubjects');

    return successResponse(res, 201, 'Teacher created successfully', created);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update teacher profile & assigned subjects
 * @route   PUT /api/teachers/:id
 * @access  Private (Admin)
 */
const updateTeacher = async (req, res, next) => {
  try {
    const { name, phone, department, designation, qualification, assignedSubjects } = req.body;

    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return errorResponse(res, 404, 'Teacher not found.');
    }

    if (department) teacher.department = department;
    if (designation) teacher.designation = designation;
    if (qualification) teacher.qualification = qualification;

    if (assignedSubjects) {
      teacher.assignedSubjects = assignedSubjects;
      // Sync subjects
      await Subject.updateMany({ teacher: teacher._id }, { teacher: null });
      await Subject.updateMany({ _id: { $in: assignedSubjects } }, { teacher: teacher._id });
    }

    await teacher.save();

    if (name || phone !== undefined) {
      const user = await User.findById(teacher.user);
      if (user) {
        if (name) user.name = name;
        if (phone !== undefined) user.phone = phone;
        await user.save();
      }
    }

    const updated = await Teacher.findById(teacher._id)
      .populate('user', '-password')
      .populate('assignedSubjects');

    return successResponse(res, 200, 'Teacher updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete teacher profile
 * @route   DELETE /api/teachers/:id
 * @access  Private (Admin)
 */
const deleteTeacher = async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return errorResponse(res, 404, 'Teacher not found.');
    }

    // Unassign subjects
    await Subject.updateMany({ teacher: teacher._id }, { teacher: null });

    // Delete user
    await User.findByIdAndDelete(teacher.user);

    // Delete teacher
    await Teacher.findByIdAndDelete(teacher._id);

    await ActivityLog.create({
      user: req.user._id,
      action: 'TEACHER_DELETED',
      details: `Deleted teacher ID: ${req.params.id}`,
    });

    return successResponse(res, 200, 'Teacher profile removed successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get subjects assigned to the logged-in teacher
 * @route   GET /api/teachers/my-subjects
 * @access  Private (Teacher)
 */
const getMyAssignedSubjects = async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id }).populate({
      path: 'assignedSubjects',
      select: 'name code department semester credits',
    });

    if (!teacher) {
      return errorResponse(res, 404, 'Teacher profile not found for this account.');
    }

    return successResponse(res, 200, 'Assigned subjects retrieved', teacher.assignedSubjects || []);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getMyAssignedSubjects,
};
