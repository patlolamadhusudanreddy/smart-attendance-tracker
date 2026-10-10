const express = require('express');
const router = express.Router();
const {
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  exportReportCsv,
  exportReportPdf,
  exportReportExcel,
} = require('../controllers/reportController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/daily', authorizeRoles('admin', 'teacher'), getDailyReport);
router.get('/weekly', authorizeRoles('admin', 'teacher'), getWeeklyReport);
router.get('/monthly', authorizeRoles('admin', 'teacher'), getMonthlyReport);

// Exports
router.get('/export/csv', authorizeRoles('admin', 'teacher'), exportReportCsv);
router.get('/export/pdf', exportReportPdf); // Admin, Teacher, Student
router.get('/export/excel', authorizeRoles('admin', 'teacher'), exportReportExcel);

module.exports = router;
