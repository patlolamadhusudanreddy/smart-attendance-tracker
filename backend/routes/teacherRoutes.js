const express = require('express');
const router = express.Router();
const {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getMyAssignedSubjects,
} = require('../controllers/teacherController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/my-subjects', authorizeRoles('teacher'), getMyAssignedSubjects);

router
  .route('/')
  .get(authorizeRoles('admin', 'teacher'), getTeachers)
  .post(authorizeRoles('admin'), createTeacher);

router
  .route('/:id')
  .get(getTeacherById)
  .put(authorizeRoles('admin'), updateTeacher)
  .delete(authorizeRoles('admin'), deleteTeacher);

module.exports = router;
