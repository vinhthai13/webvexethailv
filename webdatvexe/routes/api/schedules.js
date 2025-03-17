const express = require('express');
const router = express.Router();
const scheduleController = require('../../controllers/api/scheduleController');
const { verifyToken, verifyAdminToken } = require('../../middleware/token');

// Public routes
router.get('/', scheduleController.getAllSchedules);
router.get('/upcoming', scheduleController.getUpcomingSchedules);
router.get('/search', scheduleController.searchSchedules);
router.get('/:id', scheduleController.getScheduleById);

// Protected admin routes
router.post('/', verifyAdminToken, scheduleController.createSchedule);
router.put('/:id', verifyAdminToken, scheduleController.updateSchedule);
router.delete('/:id', verifyAdminToken, scheduleController.deleteSchedule);

module.exports = router; 