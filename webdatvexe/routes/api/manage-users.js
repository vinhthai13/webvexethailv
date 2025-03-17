const express = require('express');
const router = express.Router();
const manageUsersController = require('../../controllers/api/manageUsersController');
const { verifyAdminToken } = require('../../middleware/token');

// Tất cả các route đều yêu cầu quyền admin
router.use(verifyAdminToken);

// Lấy danh sách người dùng
router.get('/', manageUsersController.getAllUsers);

// Lấy thông tin chi tiết người dùng
router.get('/:id', manageUsersController.getUserById);

// Tạo người dùng mới
router.post('/', manageUsersController.createUser);

// Cập nhật thông tin người dùng
router.put('/:id', manageUsersController.updateUser);

// Đặt lại mật khẩu cho người dùng
router.put('/:id/reset-password', manageUsersController.resetUserPassword);

// Xóa người dùng
router.delete('/:id', manageUsersController.deleteUser);

module.exports = router; 