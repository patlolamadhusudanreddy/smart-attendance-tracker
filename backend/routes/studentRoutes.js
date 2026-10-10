const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkUploadStudents,
  uploadStudentPhoto,
} = require('../controllers/studentController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { uploadPhoto, uploadExcel } = require('../middleware/uploadMiddleware');

router.use(protect);

router
  .route('/')
  .get(authorizeRoles('admin', 'teacher'), getStudents)
  .post(authorizeRoles('admin'), createStudent);

router.post('/bulk-upload', authorizeRoles('admin'), uploadExcel.single('file'), bulkUploadStudents);

router
  .route('/:id')
  .get(getStudentById)
  .put(authorizeRoles('admin'), updateStudent)
  .delete(authorizeRoles('admin'), deleteStudent);

router.post('/:id/photo', uploadPhoto.single('photo'), uploadStudentPhoto);

module.exports = router;
