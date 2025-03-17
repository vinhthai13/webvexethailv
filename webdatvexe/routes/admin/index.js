const express = require('express');
const router = express.Router();
const { isAdmin, isSuperAdmin } = require('../../middleware/auth');
const adminDashboardController = require('../../controllers/admin/adminDashboardController');
const adminUserController = require('../../controllers/admin/adminUserController');
const revenueController = require('../../controllers/admin/revenueController');

// Import route modules
const bookingRoutes = require('./bookings');
const scheduleRoutes = require('./schedules');
const routeRoutes = require('./routes');
const userRoutes = require('./users');
const databaseRoutes = require('./database');
const bannerRoutes = require('./banners');

// Protected routes - All routes require admin authentication
router.use(isAdmin);

// Dashboard routes
router.get(['/', '/dashboard'], adminDashboardController.index);
router.get('/api/stats', adminDashboardController.getDashboardStats);
router.get('/api/revenue', adminDashboardController.getMonthlyRevenue);
router.get('/api/popular-routes', adminDashboardController.getPopularRoutes);
router.get('/revenue', revenueController.index);

// Admin profile routes
router.get('/profile', adminUserController.getProfile);
router.post('/profile', adminUserController.updateProfile);

// Booking routes
router.use('/bookings', bookingRoutes);

// Schedule routes
router.use('/schedules', scheduleRoutes);

// Route routes
router.use('/routes', routeRoutes);

// User routes
router.use('/users', userRoutes);

// Banner routes
router.use('/banners', bannerRoutes);

// Database management routes (super admin only)
router.use('/db', isSuperAdmin, databaseRoutes);

module.exports = router; 