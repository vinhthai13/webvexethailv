const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authController');

// Import API route modules
const scheduleRoutes = require('./schedules');
const routeRoutes = require('./routes');
const bookingRoutes = require('./bookings');
const userRoutes = require('./users');
const newsRoutes = require('./news');
const ticketTypeRoutes = require('./ticket-types');
const adminRoutes = require('./admins');
const manageUsersRoutes = require('./manage-users');
const invoiceRoutes = require('./invoices');

// Authentication routes
router.post('/login', authController.apiLogin);
router.post('/logout', authController.apiLogout);
router.get('/me', authController.getCurrentUser);

// Mount API routes
router.use('/schedules', scheduleRoutes);
router.use('/routes', routeRoutes);
router.use('/bookings', bookingRoutes);
router.use('/users', userRoutes);
router.use('/news', newsRoutes);
router.use('/ticket-types', ticketTypeRoutes);
router.use('/admins', adminRoutes);
router.use('/manage-users', manageUsersRoutes);
router.use('/invoices', invoiceRoutes);

module.exports = router; 