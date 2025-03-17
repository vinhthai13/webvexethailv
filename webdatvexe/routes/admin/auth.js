const express = require('express');
const router = express.Router();
const adminAuthController = require('../../controllers/admin/adminAuthController');
const { isAdminGuest, isAdmin } = require('../../middleware/adminAuth');

// Login routes
router.get('/login', isAdminGuest, adminAuthController.showLogin);
router.post('/login', isAdminGuest, adminAuthController.login);

// Logout route
router.get('/logout', isAdmin, adminAuthController.logout);

// Profile routes
router.get('/profile', isAdmin, adminAuthController.showProfile);
router.post('/profile', isAdmin, adminAuthController.updateProfile);

module.exports = router; 