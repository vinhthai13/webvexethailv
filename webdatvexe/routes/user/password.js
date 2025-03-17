const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../../middleware/auth');
const passwordController = require('../../controllers/user/passwordController');

router.get('/change-password', isAuthenticated, passwordController.getChangePassword);
router.post('/change-password', isAuthenticated, passwordController.updatePassword);

module.exports = router;