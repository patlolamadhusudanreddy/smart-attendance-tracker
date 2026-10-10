const express = require('express');
const router = express.Router();
const {
  getClassrooms,
  getClassroomById,
  createClassroom,
  updateClassroom,
  deleteClassroom,
} = require('../controllers/classroomController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getClassrooms);
router.get('/:id', getClassroomById);

router.post('/', authorizeRoles('admin'), createClassroom);
router.put('/:id', authorizeRoles('admin'), updateClassroom);
router.delete('/:id', authorizeRoles('admin'), deleteClassroom);

module.exports = router;
