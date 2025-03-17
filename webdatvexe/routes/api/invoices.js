const express = require('express');
const router = express.Router();
const invoiceController = require('../../controllers/api/invoiceController');
const { verifyToken, verifyAdmin } = require('../../middleware/auth');

// Lấy hóa đơn theo ID
router.get('/:id', verifyToken, invoiceController.getInvoiceById);

// Chỉ admin mới có quyền lấy tất cả hóa đơn
router.get('/', verifyToken, verifyAdmin, invoiceController.getAllInvoices);

// Lấy hóa đơn theo user ID (cho người dùng xem lịch sử hóa đơn của họ)
router.get('/user/:userId', verifyToken, invoiceController.getInvoicesByUserId);

module.exports = router; 