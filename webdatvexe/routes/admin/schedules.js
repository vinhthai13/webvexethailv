const express = require('express');
const router = express.Router();
const adminScheduleController = require('../../controllers/admin/adminScheduleController');

// List all schedules
router.get('/', adminScheduleController.getAllSchedules);

// Show create schedule form
router.get('/create', adminScheduleController.showCreateForm);

// Create new schedule
router.post('/', adminScheduleController.createSchedule);

// Show edit schedule form
router.get('/:id/edit', adminScheduleController.showEditForm);

// Update schedule
router.post('/:id', adminScheduleController.updateSchedule);

// Delete schedule
router.post('/:id/delete', adminScheduleController.deleteSchedule);

module.exports = router; 