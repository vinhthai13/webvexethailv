const express = require('express');
const router = express.Router();
const authController = require('../../controllers/user/authController');
const { isGuest } = require('../../middleware/auth');

// Login routes
router.get('/dang-nhap', isGuest, authController.showLogin);
router.post('/dang-nhap', isGuest, authController.login);

// Register routes
router.get('/dang-ky', isGuest, authController.showRegister);
router.post('/dang-ky', isGuest, authController.register);

// Logout route
router.get('/dang-xuat', authController.logout);

module.exports = router; 