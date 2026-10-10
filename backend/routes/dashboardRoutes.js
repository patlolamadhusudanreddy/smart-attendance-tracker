const express = require('express');
const router = express.Router();
const {
  getAdminDashboardStats,
  getTeacherDashboardStats,
} = require('../controllers/dashboardController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/admin', authorizeRoles('admin'), getAdminDashboardStats);
router.get('/teacher', authorizeRoles('teacher'), getTeacherDashboardStats);

module.exports = router;
