const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/api/adminController');
const { verifyAdminToken, verifySuperAdminToken } = require('../../middleware/token');

// Tất cả các route đều yêu cầu quyền super admin
router.use(verifySuperAdminToken);

// Lấy danh sách admin
router.get('/', adminController.getAllAdmins);

// Lấy thông tin admin theo ID
router.get('/:id', adminController.getAdminById);

// Tạo admin mới
router.post('/', adminController.createAdmin);

// Cập nhật admin
router.put('/:id', adminController.updateAdmin);

// Cập nhật mật khẩu admin
router.put('/:id/password', adminController.updateAdminPassword);

// Xóa admin
router.delete('/:id', adminController.deleteAdmin);

module.exports = router; 