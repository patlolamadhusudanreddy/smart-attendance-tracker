const Classroom = require('../models/Classroom');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Get all active classrooms
 * @route   GET /api/classrooms
 * @access  Private (Admin, Teacher, Student)
 */
const getClassrooms = async (req, res, next) => {
  try {
    let classrooms = await Classroom.find({ isActive: true }).sort({ roomNumber: 1 });

    // If no classrooms exist yet, seed standard college classrooms automatically
    if (classrooms.length === 0) {
      const defaults = [
        {
          name: 'Main Computer Science Lecture Hall',
          roomNumber: 'LH-101',
          building: 'Academic Block A',
          latitude: 17.385044,
          longitude: 78.486671,
          radiusMeters: 30,
        },
        {
          name: 'Advanced Software Engineering Lab',
          roomNumber: 'LAB-204',
          building: 'Technology Block B',
          latitude: 17.385150,
          longitude: 78.486780,
          radiusMeters: 35,
        },
        {
          name: 'Central University Seminar Hall',
          roomNumber: 'SH-301',
          building: 'Main Administrative Wing',
          latitude: 17.384910,
          longitude: 78.486510,
          radiusMeters: 40,
        },
      ];
      classrooms = await Classroom.insertMany(defaults);
    }

    return successResponse(res, 200, 'Classrooms fetched successfully', classrooms);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get classroom by ID
 * @route   GET /api/classrooms/:id
 * @access  Private
 */
const getClassroomById = async (req, res, next) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return errorResponse(res, 404, 'Classroom not found');
    }
    return successResponse(res, 200, 'Classroom retrieved successfully', classroom);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new classroom with GPS geofence
 * @route   POST /api/classrooms
 * @access  Private (Admin)
 */
const createClassroom = async (req, res, next) => {
  try {
    const { name, roomNumber, building, latitude, longitude, radiusMeters, allowedWifiIps } = req.body;

    if (!name || !roomNumber || latitude === undefined || longitude === undefined) {
      return errorResponse(res, 400, 'Please provide classroom name, room number, latitude, and longitude');
    }

    const existing = await Classroom.findOne({ roomNumber: roomNumber.toUpperCase(), isActive: true });
    if (existing) {
      return errorResponse(res, 400, `Classroom with room number ${roomNumber} already exists`);
    }

    const classroom = await Classroom.create({
      name,
      roomNumber: roomNumber.toUpperCase(),
      building: building || 'Main Academic Block',
      latitude: Number(latitude),
      longitude: Number(longitude),
      radiusMeters: Number(radiusMeters) || 30,
      allowedWifiIps: Array.isArray(allowedWifiIps) ? allowedWifiIps : [],
      createdBy: req.user._id,
    });

    return successResponse(res, 201, 'Classroom and geofence created successfully', classroom);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update classroom coordinates and radius
 * @route   PUT /api/classrooms/:id
 * @access  Private (Admin)
 */
const updateClassroom = async (req, res, next) => {
  try {
    const { name, roomNumber, building, latitude, longitude, radiusMeters, allowedWifiIps, isActive } = req.body;

    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return errorResponse(res, 404, 'Classroom not found');
    }

    if (name) classroom.name = name;
    if (roomNumber) classroom.roomNumber = roomNumber.toUpperCase();
    if (building) classroom.building = building;
    if (latitude !== undefined) classroom.latitude = Number(latitude);
    if (longitude !== undefined) classroom.longitude = Number(longitude);
    if (radiusMeters !== undefined) classroom.radiusMeters = Number(radiusMeters);
    if (allowedWifiIps !== undefined) classroom.allowedWifiIps = allowedWifiIps;
    if (isActive !== undefined) classroom.isActive = isActive;

    await classroom.save();

    return successResponse(res, 200, 'Classroom geofence updated successfully', classroom);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete classroom
 * @route   DELETE /api/classrooms/:id
 * @access  Private (Admin)
 */
const deleteClassroom = async (req, res, next) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return errorResponse(res, 404, 'Classroom not found');
    }

    // Soft delete
    classroom.isActive = false;
    await classroom.save();

    return successResponse(res, 200, 'Classroom deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClassrooms,
  getClassroomById,
  createClassroom,
  updateClassroom,
  deleteClassroom,
};
