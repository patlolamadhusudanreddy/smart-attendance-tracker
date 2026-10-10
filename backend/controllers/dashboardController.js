const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const ActivityLog = require('../models/ActivityLog');
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceAuditLog = require('../models/AttendanceAuditLog');
const { successResponse } = require('../utils/apiResponse');

/**
 * @desc    Get High-Level Analytics for Admin Dashboard including active sessions & security telemetry
 * @route   GET /api/dashboard/admin
 * @access  Private (Admin)
 */
const getAdminDashboardStats = async (req, res, next) => {
  try {
    const totalStudents = await Student.countDocuments({ isActive: true });
    const totalTeachers = await Teacher.countDocuments();
    const totalSubjects = await Subject.countDocuments();

    // Active attendance sessions
    const now = new Date();
    const activeSessionsCount = await AttendanceSession.countDocuments({
      status: 'active',
      endTime: { $gt: now },
    });

    // Failed security check-ins count
    const failedAttendanceAttempts = await AttendanceAuditLog.countDocuments({
      status: 'FAILED',
    });

    // Today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTotal = await Attendance.countDocuments({ date: { $gte: today, $lt: tomorrow } });
    const todayPresent = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: 'Present',
    });
    const todayRate = todayTotal > 0 ? ((todayPresent / todayTotal) * 100).toFixed(1) : 0;

    // Overall attendance rate
    const allTotal = await Attendance.countDocuments();
    const allPresent = await Attendance.countDocuments({ status: 'Present' });
    const overallRate = allTotal > 0 ? ((allPresent / allTotal) * 100).toFixed(1) : 0;

    // Department Distribution
    const departmentDistribution = await Student.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $project: { department: '$_id', count: 1, _id: 0 } },
    ]);

    // Attendance Status Breakdown
    const statusDistribution = await Attendance.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } },
    ]);

    // Recent 8 System Activity Logs
    const recentActivities = await ActivityLog.find()
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(8);

    // Recent Security Alerts (Failed check-ins: Outside Geofence, Expired QR, Replay Attack)
    const securityAlerts = await AttendanceAuditLog.find({ status: 'FAILED' })
      .populate('user', 'name email')
      .populate('subject', 'name code')
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email' },
      })
      .sort({ createdAt: -1 })
      .limit(6);

    return successResponse(res, 200, 'Admin analytics retrieved', {
      metrics: {
        totalStudents,
        totalTeachers,
        totalSubjects,
        activeSessionsCount,
        failedAttendanceAttempts,
        todayAttendanceRate: Number(todayRate),
        overallAttendanceRate: Number(overallRate),
        todayTotalLogs: todayTotal,
      },
      departmentDistribution,
      statusDistribution,
      recentActivities,
      securityAlerts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Teacher specific stats
 * @route   GET /api/dashboard/teacher
 * @access  Private (Teacher)
 */
const getTeacherDashboardStats = async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id }).populate('assignedSubjects');
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher profile not found' });
    }

    const assignedSubjectIds = teacher.assignedSubjects.map((s) => s._id);

    const totalClassesConducted = await Attendance.distinct('date', {
      subject: { $in: assignedSubjectIds },
    });

    const totalMarked = await Attendance.countDocuments({ subject: { $in: assignedSubjectIds } });
    const totalPresent = await Attendance.countDocuments({
      subject: { $in: assignedSubjectIds },
      status: 'Present',
    });
    const averageRate = totalMarked > 0 ? ((totalPresent / totalMarked) * 100).toFixed(1) : 0;

    // Check if teacher currently has an active QR session
    const activeSession = await AttendanceSession.findOne({
      teacher: req.user._id,
      status: 'active',
      endTime: { $gt: new Date() },
    }).populate('subject', 'name code');

    // Subject breakdown
    const subjectStats = await Promise.all(
      teacher.assignedSubjects.map(async (subj) => {
        const subTotal = await Attendance.countDocuments({ subject: subj._id });
        const subPres = await Attendance.countDocuments({ subject: subj._id, status: 'Present' });
        const subRate = subTotal > 0 ? ((subPres / subTotal) * 100).toFixed(1) : 0;
        return {
          id: subj._id,
          name: subj.name,
          code: subj.code,
          totalLectures: subTotal,
          presentCount: subPres,
          rate: Number(subRate),
        };
      })
    );

    return successResponse(res, 200, 'Teacher analytics retrieved', {
      totalSubjects: teacher.assignedSubjects.length,
      totalClassesConducted: totalClassesConducted.length,
      averageRate: Number(averageRate),
      activeSession,
      subjectStats,
      assignedSubjects: teacher.assignedSubjects,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboardStats,
  getTeacherDashboardStats,
};
