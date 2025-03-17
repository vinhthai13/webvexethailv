const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../../middleware/auth');
const bookingController = require('../../controllers/api/bookingController');

// User routes
router.post('/', verifyToken, bookingController.createBooking);
router.get('/:id', verifyToken, bookingController.getBookingById);

// Admin routes
router.get('/admin/all', verifyToken, verifyAdmin, bookingController.getAllBookings);
router.put('/admin/:id/status', verifyToken, verifyAdmin, bookingController.updateBookingStatus);

// Resend invoice route (accessible by both user and admin)
router.post('/:id/resend-invoice', verifyToken, bookingController.resendInvoice);

module.exports = router;