const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isGuest, isAuth } = require('../middleware/auth');
const { verifyToken } = require('../middleware/token');

// Web routes (session-based auth)
router.get('/login', isGuest, authController.showLogin);
router.post('/login', isGuest, authController.login);
router.get('/logout', isAuth, authController.logout);

// API routes (token-based auth)
router.post('/api/login', authController.apiLogin);
router.post('/api/logout', authController.apiLogout);
router.get('/api/me', verifyToken, authController.getCurrentUser);

module.exports = router; 