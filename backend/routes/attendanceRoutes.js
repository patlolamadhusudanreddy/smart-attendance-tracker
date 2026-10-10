const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/attendanceController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.use(protect);

// Dynamic 20s QR Session Management
router.post('/session/start', authorizeRoles('admin', 'teacher'), startAttendanceSession);
router.post('/session/:id/rotate-qr', authorizeRoles('admin', 'teacher'), rotateQrSessionToken);
router.post('/session/:id/close', authorizeRoles('admin', 'teacher'), closeAttendanceSession);
router.get('/session/:id', authorizeRoles('admin', 'teacher'), getSessionDetails);
router.get('/sessions/active', getActiveSessions);

// Student Secure QR Check-in (Live Camera + GPS + Anti-Replay)
router.post('/mark-qr', authorizeRoles('student'), markAttendanceViaQr);

// Security & Audit Logs
router.get('/audit-logs', authorizeRoles('admin', 'teacher'), getAttendanceAuditLogs);
router.get('/security-alerts', authorizeRoles('admin'), getSecurityAlerts);

// Legacy QR Session
router.post('/qr-session', authorizeRoles('admin', 'teacher'), generateQrSession);

// Batch & Analytics
router.post('/batch', authorizeRoles('admin', 'teacher'), markBatchAttendance);
router.get('/calendar', getAttendanceCalendar);
router.get('/my-summary', authorizeRoles('student'), getMyAttendanceSummary);

// Base Attendance Records
router.get('/', getAttendanceRecords);
router
  .route('/:id')
  .put(authorizeRoles('admin', 'teacher'), updateAttendance)
  .delete(authorizeRoles('admin', 'teacher'), deleteAttendance);

module.exports = router;
