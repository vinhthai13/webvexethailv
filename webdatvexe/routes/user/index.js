const express = require('express');
const router = express.Router();
const { isUser } = require('../../middleware/userAuth');
const authController = require('../../controllers/user/authController');
const { isGuest } = require('../../middleware/auth');

// Import route modules
const bookingRoutes = require('./bookings');
const scheduleRoutes = require('./schedules');
const routeRoutes = require('./routes');
const profileRoutes = require('./profile');

// Auth routes
router.get('/register', isGuest, authController.showRegister);
router.post('/register', isGuest, authController.register);

router.get('/login', isGuest, authController.showLogin);
router.post('/login', isGuest, authController.login);

router.get('/logout', authController.logout);

// Booking routes
router.use('/booking', isUser, bookingRoutes);

// Schedule routes
router.use('/lich-trinh', scheduleRoutes);

// Route routes
router.use('/tuyen-xe', routeRoutes);

// Profile routes
router.use('/profile', isUser, profileRoutes);

// Các routes đã được di chuyển ra file riêng:
// - Trang chủ (/) -> home.js
// - Tin tức (/tin-tuc) -> news.js
// - Liên hệ (/lien-he) -> contact.js

module.exports = router;