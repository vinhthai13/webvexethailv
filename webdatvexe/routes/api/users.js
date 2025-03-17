const express = require('express');
const router = express.Router();
const userController = require('../../controllers/api/userController');
const { verifyToken } = require('../../middleware/token');

// All routes require token authentication
router.use(verifyToken);

// User profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/change-password', userController.changePassword);

// User bookings routes
router.get('/bookings', userController.getBookings);
router.put('/bookings/:bookingId/cancel', userController.cancelBooking);

module.exports = router; 