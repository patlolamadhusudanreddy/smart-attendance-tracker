const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const Classroom = require('../models/Classroom');
const AttendanceSession = require('../models/AttendanceSession');
const QrToken = require('../models/QrToken');
const AttendanceAuditLog = require('../models/AttendanceAuditLog');

const {
  generateDynamicQr,
  verifyDynamicQrToken,
} = require('../services/cryptoQrService');
const { verifyGeofence } = require('../utils/haversine');
const { extractDeviceInfo } = require('../utils/deviceInfo');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Start an active dynamic attendance session with GPS geofencing & 20s QR rotation
 * @route   POST /api/attendance/session/start
 * @access  Private (Teacher, Admin)
 */
const startAttendanceSession = async (req, res, next) => {
  try {
    const { subjectId, classroomId, durationMinutes = 10, customCoordinates } = req.body;

    if (!subjectId) {
      return errorResponse(res, 400, 'Subject ID is required to start an attendance session.');
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return errorResponse(res, 404, 'Subject not found.');
    }

    // Determine classroom and GPS coordinates
    let roomName = 'Standard Classroom';
    let roomCoordinates = {
      latitude: 17.385044,
      longitude: 78.486671,
      radiusMeters: 30,
    };
    let resolvedClassroomId = null;

    if (classroomId) {
      const room = await Classroom.findById(classroomId);
      if (room) {
        resolvedClassroomId = room._id;
        roomName = `${room.name} (${room.roomNumber})`;
        roomCoordinates = {
          latitude: room.latitude,
          longitude: room.longitude,
          radiusMeters: room.radiusMeters || 30,
        };
      }
    } else if (customCoordinates?.latitude && customCoordinates?.longitude) {
      roomName = customCoordinates.name || 'Custom Teacher Geofence';
      roomCoordinates = {
        latitude: Number(customCoordinates.latitude),
        longitude: Number(customCoordinates.longitude),
        radiusMeters: Number(customCoordinates.radiusMeters) || 30,
      };
    } else {
      // Find or create default classroom
      let defaultRoom = await Classroom.findOne({ isActive: true });
      if (!defaultRoom) {
        defaultRoom = await Classroom.create({
          name: 'Main Computer Science Lecture Hall',
          roomNumber: 'LH-101',
          building: 'Main Block',
          latitude: 17.385044,
          longitude: 78.486671,
          radiusMeters: 30,
        });
      }
      resolvedClassroomId = defaultRoom._id;
      roomName = `${defaultRoom.name} (${defaultRoom.roomNumber})`;
      roomCoordinates = {
        latitude: defaultRoom.latitude,
        longitude: defaultRoom.longitude,
        radiusMeters: defaultRoom.radiusMeters || 30,
      };
    }

    // Close any previous active sessions for this subject/teacher
    await AttendanceSession.updateMany(
      { teacher: req.user._id, subject: subjectId, status: 'active' },
      { $set: { status: 'closed', closedAt: new Date() } }
    );

    const startTime = new Date();
    const parsedDuration = Math.max(1, Math.min(180, Number(durationMinutes) || 10));
    const endTime = new Date(startTime.getTime() + parsedDuration * 60 * 1000);

    // Create session record
    const session = await AttendanceSession.create({
      teacher: req.user._id,
      subject: subjectId,
      classroom: resolvedClassroomId,
      roomName,
      roomCoordinates,
      startTime,
      durationMinutes: parsedDuration,
      endTime,
      status: 'active',
      totalAttendees: 0,
    });

    // Generate initial 20-second dynamic encrypted QR token
    const qrResult = await generateDynamicQr({
      sessionId: session._id,
      subjectId: subject._id,
      teacherId: req.user._id,
      validitySeconds: 20,
    });

    // Save token for anti-replay tracking
    await QrToken.create({
      sessionId: session._id,
      tokenId: qrResult.tokenId,
      encryptedPayload: qrResult.encryptedPayload,
      expiresAt: qrResult.expiresAt,
      isUsed: false,
    });

    // Update session with current QR
    session.currentQrToken = qrResult.encryptedPayload;
    session.currentQrNonce = qrResult.tokenId;
    session.qrExpiresAt = qrResult.expiresAt;
    await session.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'ATTENDANCE_SESSION_STARTED',
      details: `Started ${parsedDuration}-min dynamic QR attendance session for ${subject.name} in ${roomName} (Radius: ${roomCoordinates.radiusMeters}m)`,
    });

    return successResponse(res, 201, 'Dynamic attendance session started successfully', {
      session: {
        id: session._id,
        subject: { id: subject._id, name: subject.name, code: subject.code },
        roomName,
        roomCoordinates,
        startTime: session.startTime,
        endTime: session.endTime,
        durationMinutes: session.durationMinutes,
        status: session.status,
      },
      qrDataUrl: qrResult.qrDataUrl,
      qrToken: qrResult.encryptedPayload,
      validitySeconds: 20,
      expiresAt: qrResult.expiresAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Rotate dynamic QR code every 20 seconds for an active session
 * @route   POST /api/attendance/session/:id/rotate-qr
 * @access  Private (Teacher, Admin)
 */
const rotateQrSessionToken = async (req, res, next) => {
  try {
    const session = await AttendanceSession.findById(req.params.id).populate('subject', 'name code');
    if (!session) {
      return errorResponse(res, 404, 'Attendance session not found.');
    }

    const now = Date.now();
    if (session.status !== 'active' || now > new Date(session.endTime).getTime()) {
      session.status = 'closed';
      session.closedAt = session.closedAt || new Date();
      await session.save();
      return errorResponse(res, 400, 'Attendance session has ended or been closed.');
    }

    // Generate new 20-second dynamic QR
    const qrResult = await generateDynamicQr({
      sessionId: session._id,
      subjectId: session.subject._id || session.subject,
      teacherId: session.teacher,
      validitySeconds: 20,
    });

    // Save token in MongoDB for anti-replay tracking
    await QrToken.create({
      sessionId: session._id,
      tokenId: qrResult.tokenId,
      encryptedPayload: qrResult.encryptedPayload,
      expiresAt: qrResult.expiresAt,
      isUsed: false,
    });

    // Update session
    session.currentQrToken = qrResult.encryptedPayload;
    session.currentQrNonce = qrResult.tokenId;
    session.qrExpiresAt = qrResult.expiresAt;
    await session.save();

    return successResponse(res, 200, 'Dynamic QR token refreshed', {
      sessionId: session._id,
      qrDataUrl: qrResult.qrDataUrl,
      qrToken: qrResult.encryptedPayload,
      validitySeconds: 20,
      expiresAt: qrResult.expiresAt,
      totalAttendees: session.totalAttendees,
      remainingMinutes: Math.max(0, Math.ceil((new Date(session.endTime).getTime() - now) / 60000)),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Manually end an attendance session
 * @route   POST /api/attendance/session/:id/close
 * @access  Private (Teacher, Admin)
 */
const closeAttendanceSession = async (req, res, next) => {
  try {
    const session = await AttendanceSession.findById(req.params.id);
    if (!session) {
      return errorResponse(res, 404, 'Attendance session not found.');
    }

    session.status = 'closed';
    session.closedAt = new Date();
    await session.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'ATTENDANCE_SESSION_CLOSED',
      details: `Closed attendance session ${session._id} with ${session.totalAttendees} total attendees`,
    });

    return successResponse(res, 200, 'Attendance session closed successfully.', {
      sessionId: session._id,
      status: 'closed',
      totalAttendees: session.totalAttendees,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get session details and live attendee list
 * @route   GET /api/attendance/session/:id
 * @access  Private (Teacher, Admin)
 */
const getSessionDetails = async (req, res, next) => {
  try {
    const session = await AttendanceSession.findById(req.params.id)
      .populate('subject', 'name code department semester')
      .populate('teacher', 'name email')
      .populate('classroom', 'name roomNumber building');

    if (!session) {
      return errorResponse(res, 404, 'Attendance session not found.');
    }

    const attendees = await Attendance.find({ session: session._id })
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email avatar' },
      })
      .sort({ createdAt: -1 });

    return successResponse(res, 200, 'Session details retrieved', {
      session,
      attendees,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all active attendance sessions
 * @route   GET /api/attendance/sessions/active
 * @access  Private
 */
const getActiveSessions = async (req, res, next) => {
  try {
    const now = new Date();
    // Auto close sessions past endTime
    await AttendanceSession.updateMany(
      { status: 'active', endTime: { $lt: now } },
      { $set: { status: 'closed', closedAt: now } }
    );

    const filter = { status: 'active', endTime: { $gt: now } };
    if (req.user.role === 'teacher') {
      filter.teacher = req.user._id;
    }

    const activeSessions = await AttendanceSession.find(filter)
      .populate('subject', 'name code department semester')
      .populate('teacher', 'name email')
      .populate('classroom', 'name roomNumber')
      .sort({ startTime: -1 });

    return successResponse(res, 200, 'Active sessions retrieved', activeSessions);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Student marks attendance via live camera QR scan with GPS Geofencing, 20s expiry & anti-replay
 * @route   POST /api/attendance/mark-qr
 * @access  Private (Student)
 */
const markAttendanceViaQr = async (req, res, next) => {
  const devInfo = extractDeviceInfo(req);
  const { qrToken, latitude, longitude, selfieImage } = req.body;

  let decoded = null;
  let studentDoc = null;
  let sessionDoc = null;

  try {
    // 0. Verify Student Profile
    studentDoc = await Student.findOne({ user: req.user._id }).populate('user', 'name email avatar');
    if (!studentDoc) {
      return errorResponse(res, 404, 'Student profile not found for this user account.');
    }

    if (!qrToken || typeof qrToken !== 'string') {
      await AttendanceAuditLog.create({
        student: studentDoc._id,
        user: req.user._id,
        status: 'FAILED',
        failureReason: 'Invalid QR Token',
        message: 'Empty or malformed QR token received from client',
        latitude: Number(latitude) || null,
        longitude: Number(longitude) || null,
        ...devInfo,
      });
      return errorResponse(res, 400, 'Valid QR Token is required.');
    }

    // 1. Decrypt QR Payload
    try {
      decoded = verifyDynamicQrToken(qrToken.trim());
    } catch (cryptoErr) {
      const reason = cryptoErr.code === 'EXPIRED_QR' ? 'Expired QR' : 'Invalid QR Token';
      await AttendanceAuditLog.create({
        student: studentDoc._id,
        user: req.user._id,
        session: cryptoErr.payload?.sessionId || null,
        subject: cryptoErr.payload?.subjectId || null,
        status: 'FAILED',
        failureReason: reason,
        message: cryptoErr.message,
        latitude: Number(latitude) || null,
        longitude: Number(longitude) || null,
        ...devInfo,
      });
      return errorResponse(res, 400, cryptoErr.message);
    }

    const { tokenId, sessionId, subjectId, teacherId } = decoded;

    // 2. Anti-Replay Protection: Check if token exists and hasn't been consumed
    const tokenDoc = await QrToken.findOne({ tokenId });
    if (!tokenDoc) {
      await AttendanceAuditLog.create({
        student: studentDoc._id,
        user: req.user._id,
        session: sessionId,
        subject: subjectId,
        status: 'FAILED',
        failureReason: 'Invalid QR Token',
        message: 'QR token was not recognized in server token registry',
        latitude: Number(latitude) || null,
        longitude: Number(longitude) || null,
        ...devInfo,
      });
      return errorResponse(res, 400, 'Invalid QR code. Please scan the current code on the screen.');
    }

    if (tokenDoc.isUsed) {
      await AttendanceAuditLog.create({
        student: studentDoc._id,
        user: req.user._id,
        session: sessionId,
        subject: subjectId,
        status: 'FAILED',
        failureReason: 'Replay Attack',
        message: 'Token was previously consumed by another submission',
        latitude: Number(latitude) || null,
        longitude: Number(longitude) || null,
        ...devInfo,
      });
      return errorResponse(res, 400, 'Replay Attack Detected: This QR code has already been used. Please scan the live QR code.');
    }

    // 3. Verify Active Attendance Session
    sessionDoc = await AttendanceSession.findById(sessionId).populate('subject', 'name code');
    if (!sessionDoc) {
      await AttendanceAuditLog.create({
        student: studentDoc._id,
        user: req.user._id,
        session: sessionId,
        subject: subjectId,
        status: 'FAILED',
        failureReason: 'Session Closed',
        message: 'Attendance session record not found',
        latitude: Number(latitude) || null,
        longitude: Number(longitude) || null,
        ...devInfo,
      });
      return errorResponse(res, 404, 'Attendance session does not exist.');
    }

    const now = Date.now();
    if (sessionDoc.status !== 'active' || now > new Date(sessionDoc.endTime).getTime()) {
      sessionDoc.status = 'closed';
      await sessionDoc.save();

      await AttendanceAuditLog.create({
        student: studentDoc._id,
        user: req.user._id,
        session: sessionDoc._id,
        subject: subjectId,
        status: 'FAILED',
        failureReason: 'Session Closed',
        message: 'Attendance session expired or has already been closed by the teacher',
        latitude: Number(latitude) || null,
        longitude: Number(longitude) || null,
        ...devInfo,
      });
      return errorResponse(res, 400, 'Session Closed: This attendance session has already closed.');
    }

    // 4. One Attendance Per Student Verification
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const duplicateCheck = await Attendance.findOne({
      $or: [
        { session: sessionDoc._id, student: studentDoc._id },
        { date: { $gte: today, $lt: tomorrow }, subject: sessionDoc.subject._id || sessionDoc.subject, student: studentDoc._id },
      ],
    });

    if (duplicateCheck) {
      await AttendanceAuditLog.create({
        student: studentDoc._id,
        user: req.user._id,
        session: sessionDoc._id,
        subject: sessionDoc.subject._id || sessionDoc.subject,
        status: 'FAILED',
        failureReason: 'Already Marked',
        message: 'Student attempted multiple attendance submissions for the same class/session',
        latitude: Number(latitude) || null,
        longitude: Number(longitude) || null,
        ...devInfo,
      });
      return errorResponse(res, 400, 'Attendance Already Marked: You have already marked attendance for this class today.');
    }

    // 5. GPS Verification & Classroom Geofencing
    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      await AttendanceAuditLog.create({
        student: studentDoc._id,
        user: req.user._id,
        session: sessionDoc._id,
        subject: sessionDoc.subject._id || sessionDoc.subject,
        status: 'FAILED',
        failureReason: 'GPS Coordinates Missing',
        message: 'Client did not provide GPS geolocation coordinates',
        ...devInfo,
      });
      return errorResponse(res, 400, 'GPS Verification Failed: Classroom presence requires live GPS coordinates. Please enable device location.');
    }

    const geoCheck = verifyGeofence(
      latitude,
      longitude,
      sessionDoc.roomCoordinates.latitude,
      sessionDoc.roomCoordinates.longitude,
      sessionDoc.roomCoordinates.radiusMeters || 30
    );

    if (!geoCheck.isInside) {
      await AttendanceAuditLog.create({
        student: studentDoc._id,
        user: req.user._id,
        session: sessionDoc._id,
        subject: sessionDoc.subject._id || sessionDoc.subject,
        status: 'FAILED',
        failureReason: 'Outside Geofence',
        message: `Student was ${geoCheck.distanceMeters}m away from ${sessionDoc.roomName}. Allowed radius: ${geoCheck.allowedRadiusMeters}m`,
        latitude: Number(latitude),
        longitude: Number(longitude),
        distanceMeters: geoCheck.distanceMeters,
        allowedRadiusMeters: geoCheck.allowedRadiusMeters,
        ...devInfo,
      });
      return errorResponse(
        res,
        400,
        `Outside Geofence: You are ${geoCheck.distanceMeters}m away from ${sessionDoc.roomName}. Attendance is strictly allowed within ${geoCheck.allowedRadiusMeters}m.`
      );
    }

    // 6. Invalidate QR Token (Single Use / Anti-Replay)
    tokenDoc.isUsed = true;
    tokenDoc.usedBy = studentDoc._id;
    tokenDoc.usedAt = new Date();
    await tokenDoc.save();

    // 7. Create Official Attendance Record
    const attendanceRecord = await Attendance.create({
      date: today,
      subject: sessionDoc.subject._id || sessionDoc.subject,
      student: studentDoc._id,
      session: sessionDoc._id,
      markedBy: sessionDoc.teacher,
      status: 'Present',
      method: 'QR',
      location: {
        latitude: Number(latitude),
        longitude: Number(longitude),
        distanceMeters: geoCheck.distanceMeters,
      },
      deviceInfo: {
        ip: devInfo.ipAddress,
        browser: devInfo.browser,
        os: devInfo.os,
        userAgent: devInfo.userAgent,
        deviceId: devInfo.deviceId,
      },
      faceVerified: Boolean(selfieImage),
      remarks: `Dynamic 20s QR Verified (GPS Distance: ${geoCheck.distanceMeters}m inside ${sessionDoc.roomName})`,
    });

    // 8. Increment Session Attendees
    sessionDoc.totalAttendees = (sessionDoc.totalAttendees || 0) + 1;
    await sessionDoc.save();

    // 9. Record Successful Audit Log Entry
    await AttendanceAuditLog.create({
      student: studentDoc._id,
      user: req.user._id,
      session: sessionDoc._id,
      subject: sessionDoc.subject._id || sessionDoc.subject,
      status: 'SUCCESS',
      failureReason: null,
      message: `Verified attendance at ${geoCheck.distanceMeters}m from classroom`,
      latitude: Number(latitude),
      longitude: Number(longitude),
      distanceMeters: geoCheck.distanceMeters,
      allowedRadiusMeters: geoCheck.allowedRadiusMeters,
      ...devInfo,
    });

    // 10. Student In-App Notification
    const subjectTitle = sessionDoc.subject.name || 'Subject';
    await Notification.create({
      recipient: req.user._id,
      title: 'QR Attendance Confirmed',
      message: `Your attendance for ${subjectTitle} was confirmed (${geoCheck.distanceMeters}m from classroom).`,
      type: 'success',
    });

    return successResponse(res, 200, 'Attendance marked successfully via Secure QR Code!', {
      attendance: attendanceRecord,
      classroom: sessionDoc.roomName,
      distanceMeters: geoCheck.distanceMeters,
      allowedRadiusMeters: geoCheck.allowedRadiusMeters,
      faceVerified: Boolean(selfieImage),
      timestamp: attendanceRecord.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Attendance Security Audit Logs with filtering
 * @route   GET /api/attendance/audit-logs
 * @access  Private (Admin, Teacher)
 */
const getAttendanceAuditLogs = async (req, res, next) => {
  try {
    const { status, failureReason, subjectId, page = 1, limit = 50 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (failureReason) query.failureReason = failureReason;
    if (subjectId) query.subject = subjectId;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await AttendanceAuditLog.countDocuments(query);

    const logs = await AttendanceAuditLog.find(query)
      .populate('user', 'name email role')
      .populate('subject', 'name code')
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email rollNumber' },
      })
      .populate('session', 'roomName startTime endTime')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return successResponse(res, 200, 'Audit logs retrieved', logs, {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      limit: Number(limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Security Alerts (recent failed attempts, spoofing & replay attempts)
 * @route   GET /api/attendance/security-alerts
 * @access  Private (Admin)
 */
const getSecurityAlerts = async (req, res, next) => {
  try {
    const failedLogs = await AttendanceAuditLog.find({ status: 'FAILED' })
      .populate('user', 'name email')
      .populate('subject', 'name code')
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email rollNumber' },
      })
      .sort({ createdAt: -1 })
      .limit(10);

    const countsByReason = await AttendanceAuditLog.aggregate([
      { $match: { status: 'FAILED' } },
      { $group: { _id: '$failureReason', count: { $sum: 1 } } },
      { $project: { reason: '$_id', count: 1, _id: 0 } },
    ]);

    const totalFailedAttempts = await AttendanceAuditLog.countDocuments({ status: 'FAILED' });
    const totalSuccessfulAttempts = await AttendanceAuditLog.countDocuments({ status: 'SUCCESS' });

    return successResponse(res, 200, 'Security alerts summary', {
      totalFailedAttempts,
      totalSuccessfulAttempts,
      countsByReason,
      recentAlerts: failedLogs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Legacy wrapper for backward compatibility
 */
const generateQrSession = async (req, res, next) => {
  return startAttendanceSession(req, res, next);
};

/**
 * @desc    Mark attendance in batch for a class session
 * @route   POST /api/attendance/batch
 * @access  Private (Teacher, Admin)
 */
const markBatchAttendance = async (req, res, next) => {
  try {
    const { subjectId, date, records } = req.body;

    if (!subjectId || !date || !Array.isArray(records) || records.length === 0) {
      return errorResponse(res, 400, 'Subject ID, date, and student records array are required.');
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return errorResponse(res, 404, 'Subject not found.');
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const bulkOperations = records.map((rec) => {
      return {
        updateOne: {
          filter: {
            date: attendanceDate,
            subject: subjectId,
            student: rec.studentId,
          },
          update: {
            $set: {
              status: rec.status || 'Present',
              method: 'Batch',
              remarks: rec.remarks || '',
              markedBy: req.user._id,
            },
          },
          upsert: true,
        },
      };
    });

    await Attendance.bulkWrite(bulkOperations);

    // Notify absent students optionally
    const absentRecords = records.filter((r) => r.status === 'Absent');
    if (absentRecords.length > 0) {
      const absentStudentIds = absentRecords.map((r) => r.studentId);
      const absentStudents = await Student.find({ _id: { $in: absentStudentIds } }).populate('user');

      for (const st of absentStudents) {
        if (st.user) {
          await Notification.create({
            recipient: st.user._id,
            title: `Marked Absent: ${subject.name}`,
            message: `You were marked absent for ${subject.name} on ${attendanceDate.toISOString().split('T')[0]}.`,
            type: 'warning',
          });
        }
      }
    }

    await ActivityLog.create({
      user: req.user._id,
      action: 'ATTENDANCE_MARKED',
      details: `Marked attendance for ${records.length} students in subject: ${subject.name}`,
    });

    return successResponse(res, 200, `Attendance marked successfully for ${records.length} students.`);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attendance records with comprehensive filtering
 * @route   GET /api/attendance
 * @access  Private
 */
const getAttendanceRecords = async (req, res, next) => {
  try {
    const { subjectId, studentId, teacherId, date, startDate, endDate, status, page = 1, limit = 50 } = req.query;

    const query = {};

    if (subjectId) query.subject = subjectId;
    if (studentId) query.student = studentId;
    if (teacherId) query.markedBy = teacherId;
    if (status) query.status = status;

    if (date) {
      const specificDate = new Date(date);
      specificDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(specificDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = { $gte: specificDate, $lt: nextDay };
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Attendance.countDocuments(query);

    const records = await Attendance.find(query)
      .populate('subject', 'name code department semester')
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email avatar' },
      })
      .populate('markedBy', 'name email role')
      .populate('session', 'roomName')
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit));

    return successResponse(res, 200, 'Attendance records fetched successfully', records, {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      limit: Number(limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update single attendance record
 * @route   PUT /api/attendance/:id
 * @access  Private (Teacher, Admin)
 */
const updateAttendance = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return errorResponse(res, 404, 'Attendance record not found.');
    }

    if (status) attendance.status = status;
    if (remarks !== undefined) attendance.remarks = remarks;
    attendance.markedBy = req.user._id;

    await attendance.save();

    const updated = await Attendance.findById(attendance._id)
      .populate('subject', 'name code')
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email rollNumber' },
      });

    return successResponse(res, 200, 'Attendance record updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete attendance record
 * @route   DELETE /api/attendance/:id
 * @access  Private (Admin, Teacher)
 */
const deleteAttendance = async (req, res, next) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return errorResponse(res, 404, 'Attendance record not found.');
    }

    await Attendance.findByIdAndDelete(req.params.id);

    return successResponse(res, 200, 'Attendance record deleted successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attendance calendar breakdown
 * @route   GET /api/attendance/calendar
 * @access  Private
 */
const getAttendanceCalendar = async (req, res, next) => {
  try {
    const { month, year, subjectId, studentId } = req.query;

    const currentYear = parseInt(year, 10) || new Date().getFullYear();
    const currentMonth = parseInt(month, 10) || new Date().getMonth() + 1;

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const query = {
      date: { $gte: startDate, $lte: endDate },
    };

    if (subjectId) query.subject = subjectId;

    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (student) query.student = student._id;
    } else if (studentId) {
      query.student = studentId;
    }

    const records = await Attendance.find(query)
      .populate('subject', 'name code')
      .sort({ date: 1 });

    const calendarMap = {};
    records.forEach((rec) => {
      const dateKey = new Date(rec.date).toISOString().split('T')[0];
      if (!calendarMap[dateKey]) {
        calendarMap[dateKey] = {
          date: dateKey,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          records: [],
        };
      }
      calendarMap[dateKey].total += 1;
      if (rec.status === 'Present') calendarMap[dateKey].present += 1;
      else if (rec.status === 'Absent') calendarMap[dateKey].absent += 1;
      else if (rec.status === 'Late') calendarMap[dateKey].late += 1;

      calendarMap[dateKey].records.push({
        id: rec._id,
        subject: rec.subject ? rec.subject.name : 'Unknown',
        status: rec.status,
      });
    });

    return successResponse(res, 200, 'Calendar attendance data fetched', Object.values(calendarMap));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get individual student's comprehensive attendance summary
 * @route   GET /api/attendance/my-summary
 * @access  Private (Student)
 */
const getMyAttendanceSummary = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return errorResponse(res, 404, 'Student profile not found.');
    }

    const totalLogs = await Attendance.countDocuments({ student: student._id });
    const presentLogs = await Attendance.countDocuments({ student: student._id, status: 'Present' });
    const absentLogs = await Attendance.countDocuments({ student: student._id, status: 'Absent' });
    const lateLogs = await Attendance.countDocuments({ student: student._id, status: 'Late' });

    const percentage = totalLogs > 0 ? ((presentLogs / totalLogs) * 100).toFixed(1) : '100.0';

    const subjects = await Subject.find({ semester: student.semester });
    const subjectBreakdown = await Promise.all(
      subjects.map(async (sub) => {
        const total = await Attendance.countDocuments({ student: student._id, subject: sub._id });
        const present = await Attendance.countDocuments({
          student: student._id,
          subject: sub._id,
          status: 'Present',
        });
        const subPercentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0';
        return {
          subjectId: sub._id,
          subjectName: sub.name,
          subjectCode: sub.code,
          totalLectures: total,
          attendedLectures: present,
          percentage: Number(subPercentage),
        };
      })
    );

    return successResponse(res, 200, 'Student attendance summary retrieved', {
      student,
      overall: {
        total: totalLogs,
        present: presentLogs,
        absent: absentLogs,
        late: lateLogs,
        percentage: Number(percentage),
      },
      subjectBreakdown,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startAttendanceSession,
  rotateQrSessionToken,
  closeAttendanceSession,
  getSessionDetails,
  getActiveSessions,
  markAttendanceViaQr,
  getAttendanceAuditLogs,
  getSecurityAlerts,
  generateQrSession,
  markBatchAttendance,
  getAttendanceRecords,
  updateAttendance,
  deleteAttendance,
  getAttendanceCalendar,
  getMyAttendanceSummary,
};
