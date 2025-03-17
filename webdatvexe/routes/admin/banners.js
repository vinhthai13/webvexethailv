const express = require('express');
const router = express.Router();
const bannerController = require('../../controllers/admin/bannerController');
const { isAdmin } = require('../../middleware/auth');

// Áp dụng middleware xác thực cho tất cả các route
router.use(isAdmin);

// Route quản lý banner
router.get('/', bannerController.index);
router.get('/create', bannerController.create);
router.post('/create', bannerController.store);
router.get('/:id/edit', bannerController.edit);
router.post('/:id/update', bannerController.update);
router.post('/:id/delete', bannerController.destroy);

module.exports = router; 