const express = require('express');
const router = express.Router();
const {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  assignTeacher,
} = require('../controllers/subjectController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.use(protect);

router
  .route('/')
  .get(getSubjects)
  .post(authorizeRoles('admin'), createSubject);

router.put('/:id/assign-teacher', authorizeRoles('admin'), assignTeacher);

router
  .route('/:id')
  .get(getSubjectById)
  .put(authorizeRoles('admin'), updateSubject)
  .delete(authorizeRoles('admin'), deleteSubject);

module.exports = router;
