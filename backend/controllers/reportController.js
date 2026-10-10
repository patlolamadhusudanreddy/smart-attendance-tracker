const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const { generateAttendancePdfBuffer } = require('../services/pdfService');
const { generateExcelBuffer } = require('../services/excelService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Helper to fetch flattened records for exports
 */
const fetchExportRecords = async (filterQuery) => {
  const records = await Attendance.find(filterQuery)
    .populate('subject', 'name code')
    .populate({
      path: 'student',
      populate: { path: 'user', select: 'name email' },
    })
    .populate('markedBy', 'name')
    .sort({ date: -1 });

  return records.map((r) => ({
    rollNumber: r.student ? r.student.rollNumber : 'N/A',
    studentName: r.student && r.student.user ? r.student.user.name : 'Unknown',
    studentEmail: r.student && r.student.user ? r.student.user.email : 'N/A',
    subjectCode: r.subject ? r.subject.code : 'N/A',
    subjectName: r.subject ? r.subject.name : 'N/A',
    date: new Date(r.date).toISOString().split('T')[0],
    status: r.status,
    method: r.method,
    markedBy: r.markedBy ? r.markedBy.name : 'System',
    remarks: r.remarks || '',
  }));
};

/**
 * @desc    Get Daily Attendance Report
 * @route   GET /api/reports/daily
 * @access  Private (Admin, Teacher)
 */
const getDailyReport = async (req, res, next) => {
  try {
    const targetDate = req.query.date ? new Date(req.query.date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const filter = { date: { $gte: targetDate, $lt: nextDay } };
    if (req.query.subjectId) filter.subject = req.query.subjectId;

    const totalMarked = await Attendance.countDocuments(filter);
    const presentCount = await Attendance.countDocuments({ ...filter, status: 'Present' });
    const absentCount = await Attendance.countDocuments({ ...filter, status: 'Absent' });
    const lateCount = await Attendance.countDocuments({ ...filter, status: 'Late' });

    const records = await Attendance.find(filter)
      .populate('subject', 'name code')
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email avatar' },
      })
      .sort({ createdAt: -1 });

    const rate = totalMarked > 0 ? ((presentCount / totalMarked) * 100).toFixed(1) : 0;

    return successResponse(res, 200, 'Daily attendance report generated', {
      date: targetDate.toISOString().split('T')[0],
      summary: {
        total: totalMarked,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        attendanceRate: Number(rate),
      },
      records,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Weekly Attendance Trend Report
 * @route   GET /api/reports/weekly
 * @access  Private (Admin, Teacher)
 */
const getWeeklyReport = async (req, res, next) => {
  try {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    const filter = { date: { $gte: start, $lte: end } };
    if (req.query.subjectId) filter.subject = req.query.subjectId;

    const records = await Attendance.find(filter).sort({ date: 1 });

    // Aggregate by day of week
    const daysMap = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      daysMap[key] = { date: key, day: dayName, present: 0, absent: 0, late: 0, total: 0 };
    }

    records.forEach((r) => {
      const key = new Date(r.date).toISOString().split('T')[0];
      if (daysMap[key]) {
        daysMap[key].total += 1;
        if (r.status === 'Present') daysMap[key].present += 1;
        else if (r.status === 'Absent') daysMap[key].absent += 1;
        else if (r.status === 'Late') daysMap[key].late += 1;
      }
    });

    return successResponse(res, 200, 'Weekly attendance trend retrieved', Object.values(daysMap));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Monthly Attendance Report
 * @route   GET /api/reports/monthly
 * @access  Private (Admin, Teacher)
 */
const getMonthlyReport = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const filter = { date: { $gte: startDate, $lte: endDate } };
    if (req.query.subjectId) filter.subject = req.query.subjectId;

    const total = await Attendance.countDocuments(filter);
    const present = await Attendance.countDocuments({ ...filter, status: 'Present' });
    const absent = await Attendance.countDocuments({ ...filter, status: 'Absent' });
    const late = await Attendance.countDocuments({ ...filter, status: 'Late' });

    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

    return successResponse(res, 200, 'Monthly report retrieved', {
      month,
      year,
      summary: {
        total,
        present,
        absent,
        late,
        percentage: Number(percentage),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export attendance as CSV
 * @route   GET /api/reports/export/csv
 * @access  Private (Admin, Teacher)
 */
const exportReportCsv = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.subjectId) query.subject = req.query.subjectId;
    if (req.query.startDate) query.date = { $gte: new Date(req.query.startDate) };
    if (req.query.endDate) {
      query.date = query.date || {};
      query.date.$lte = new Date(req.query.endDate);
    }

    const data = await fetchExportRecords(query);

    const headers = ['Roll Number', 'Student Name', 'Email', 'Subject Code', 'Subject Name', 'Date', 'Status', 'Method', 'Marked By', 'Remarks'];
    let csvContent = headers.join(',') + '\n';

    data.forEach((row) => {
      const line = [
        `"${row.rollNumber}"`,
        `"${row.studentName}"`,
        `"${row.studentEmail}"`,
        `"${row.subjectCode}"`,
        `"${row.subjectName}"`,
        `"${row.date}"`,
        `"${row.status}"`,
        `"${row.method}"`,
        `"${row.markedBy}"`,
        `"${row.remarks}"`,
      ].join(',');
      csvContent += line + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=Attendance_Report_${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export attendance as PDF
 * @route   GET /api/reports/export/pdf
 * @access  Private (Admin, Teacher, Student)
 */
const exportReportPdf = async (req, res, next) => {
  try {
    const query = {};
    let subjectName = 'All Subjects';
    let teacherName = 'All Faculty';

    if (req.query.subjectId) {
      query.subject = req.query.subjectId;
      const sub = await Subject.findById(req.query.subjectId).populate({
        path: 'teacher',
        populate: { path: 'user', select: 'name' },
      });
      if (sub) {
        subjectName = `${sub.name} (${sub.code})`;
        if (sub.teacher && sub.teacher.user) teacherName = sub.teacher.user.name;
      }
    }

    // If student requested, only export their own
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (student) query.student = student._id;
    } else if (req.query.studentId) {
      query.student = req.query.studentId;
    }

    if (req.query.startDate || req.query.endDate) {
      query.date = {};
      if (req.query.startDate) query.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) query.date.$lte = new Date(req.query.endDate);
    }

    const data = await fetchExportRecords(query);

    const pdfBuffer = await generateAttendancePdfBuffer(
      {
        subjectName,
        teacherName,
        period: req.query.startDate ? `${req.query.startDate} to ${req.query.endDate || 'Present'}` : 'Semester All-Time',
      },
      data
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Attendance_Audit_${Date.now()}.pdf`);
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export attendance as Excel (.xlsx)
 * @route   GET /api/reports/export/excel
 * @access  Private (Admin, Teacher)
 */
const exportReportExcel = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.subjectId) query.subject = req.query.subjectId;
    if (req.query.startDate || req.query.endDate) {
      query.date = {};
      if (req.query.startDate) query.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) query.date.$lte = new Date(req.query.endDate);
    }

    const data = await fetchExportRecords(query);
    const excelBuffer = generateExcelBuffer(data, 'Attendance Records');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Attendance_Export_${Date.now()}.xlsx`);
    return res.status(200).send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  exportReportCsv,
  exportReportPdf,
  exportReportExcel,
};
