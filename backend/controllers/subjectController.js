const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const ActivityLog = require('../models/ActivityLog');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Get all subjects with filters
 * @route   GET /api/subjects
 * @access  Private (Admin, Teacher, Student)
 */
const getSubjects = async (req, res, next) => {
  try {
    const { department, semester, search } = req.query;
    const query = {};

    if (department) query.department = department;
    if (semester) query.semester = Number(semester);
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ name: regex }, { code: regex }];
    }

    const subjects = await Subject.find(query)
      .populate({
        path: 'teacher',
        select: 'employeeId user designation',
        populate: {
          path: 'user',
          select: 'name email avatar',
        },
      })
      .sort({ code: 1 });

    return successResponse(res, 200, 'Subjects fetched successfully', subjects);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single subject by ID
 * @route   GET /api/subjects/:id
 * @access  Private
 */
const getSubjectById = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id).populate({
      path: 'teacher',
      select: 'employeeId user designation',
      populate: {
        path: 'user',
        select: 'name email',
      },
    });

    if (!subject) {
      return errorResponse(res, 404, 'Subject not found.');
    }

    return successResponse(res, 200, 'Subject retrieved successfully', subject);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new subject
 * @route   POST /api/subjects
 * @access  Private (Admin)
 */
const createSubject = async (req, res, next) => {
  try {
    const { name, code, department, semester, credits = 3, teacher = null } = req.body;

    if (!name || !code || !department || !semester) {
      return errorResponse(res, 400, 'Name, code, department, and semester are required.');
    }

    const existingCode = await Subject.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return errorResponse(res, 400, 'Subject with this course code already exists.');
    }

    const subject = await Subject.create({
      name,
      code: code.toUpperCase(),
      department,
      semester: Number(semester),
      credits: Number(credits),
      teacher: teacher || null,
    });

    // If teacher provided, add subject to teacher's assignedSubjects
    if (teacher) {
      await Teacher.findByIdAndUpdate(teacher, {
        $addToSet: { assignedSubjects: subject._id },
      });
    }

    await ActivityLog.create({
      user: req.user._id,
      action: 'SUBJECT_CREATED',
      details: `Created subject ${name} (${code.toUpperCase()})`,
    });

    const populated = await Subject.findById(subject._id).populate({
      path: 'teacher',
      populate: { path: 'user', select: 'name email' },
    });

    return successResponse(res, 201, 'Subject created successfully', populated);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update subject
 * @route   PUT /api/subjects/:id
 * @access  Private (Admin)
 */
const updateSubject = async (req, res, next) => {
  try {
    const { name, code, department, semester, credits, teacher } = req.body;

    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return errorResponse(res, 404, 'Subject not found.');
    }

    const oldTeacher = subject.teacher;

    if (name) subject.name = name;
    if (code) subject.code = code.toUpperCase();
    if (department) subject.department = department;
    if (semester !== undefined) subject.semester = Number(semester);
    if (credits !== undefined) subject.credits = Number(credits);
    if (teacher !== undefined) subject.teacher = teacher || null;

    await subject.save();

    // Sync teacher relationships if changed
    if (teacher !== undefined && String(oldTeacher) !== String(teacher)) {
      if (oldTeacher) {
        await Teacher.findByIdAndUpdate(oldTeacher, {
          $pull: { assignedSubjects: subject._id },
        });
      }
      if (teacher) {
        await Teacher.findByIdAndUpdate(teacher, {
          $addToSet: { assignedSubjects: subject._id },
        });
      }
    }

    const updated = await Subject.findById(subject._id).populate({
      path: 'teacher',
      populate: { path: 'user', select: 'name email' },
    });

    return successResponse(res, 200, 'Subject updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete subject
 * @route   DELETE /api/subjects/:id
 * @access  Private (Admin)
 */
const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return errorResponse(res, 404, 'Subject not found.');
    }

    if (subject.teacher) {
      await Teacher.findByIdAndUpdate(subject.teacher, {
        $pull: { assignedSubjects: subject._id },
      });
    }

    await Subject.findByIdAndDelete(subject._id);

    await ActivityLog.create({
      user: req.user._id,
      action: 'SUBJECT_DELETED',
      details: `Deleted subject: ${subject.name}`,
    });

    return successResponse(res, 200, 'Subject deleted successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign or unassign a teacher to subject
 * @route   PUT /api/subjects/:id/assign-teacher
 * @access  Private (Admin)
 */
const assignTeacher = async (req, res, next) => {
  try {
    const { teacherId } = req.body;
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return errorResponse(res, 404, 'Subject not found.');
    }

    if (subject.teacher) {
      await Teacher.findByIdAndUpdate(subject.teacher, {
        $pull: { assignedSubjects: subject._id },
      });
    }

    if (teacherId) {
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return errorResponse(res, 404, 'Teacher not found.');
      }
      subject.teacher = teacherId;
      await teacher.updateOne({ $addToSet: { assignedSubjects: subject._id } });
    } else {
      subject.teacher = null;
    }

    await subject.save();

    const updated = await Subject.findById(subject._id).populate({
      path: 'teacher',
      populate: { path: 'user', select: 'name email' },
    });

    return successResponse(res, 200, 'Teacher assigned to subject successfully', updated);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  assignTeacher,
};
