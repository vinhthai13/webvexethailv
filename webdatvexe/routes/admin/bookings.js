const express = require('express');
const router = express.Router();
const adminBookingController = require('../../controllers/admin/adminBookingController');

// List bookings
router.get('/', adminBookingController.getAllBookings);

// Show booking details
router.get('/:id', adminBookingController.getBookingDetails);

// Update booking status
router.post('/:id/status', adminBookingController.updateBookingStatus);

// Delete booking
router.post('/:id/delete', adminBookingController.deleteBooking);

// Bulk update booking status
router.post('/bulk-update', adminBookingController.bulkUpdateStatus);

module.exports = router; 