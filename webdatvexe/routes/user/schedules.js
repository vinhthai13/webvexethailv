const express = require('express');
const router = express.Router();
const scheduleController = require('../../controllers/user/scheduleController');

// Schedule list route
router.get('/', scheduleController.getAllSchedules);

// Schedule details route
router.get('/:id', scheduleController.getScheduleDetails);

// API routes
router.get('/api/lich-trinh', scheduleController.getSchedulesApi);
router.get('/api/search', scheduleController.searchSchedules);

module.exports = router; 