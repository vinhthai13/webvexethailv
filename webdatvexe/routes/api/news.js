const express = require('express');
const router = express.Router();
const newsController = require('../../controllers/api/newsController');
const { verifyToken, verifyAdminToken } = require('../../middleware/token');

// Public routes
router.get('/', newsController.getAllNews);
router.get('/:id', newsController.getNewsById);

// Admin-only routes
router.post('/', verifyAdminToken, newsController.createNews);
router.put('/:id', verifyAdminToken, newsController.updateNews);
router.delete('/:id', verifyAdminToken, newsController.deleteNews);

module.exports = router; 