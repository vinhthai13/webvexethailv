const express = require('express');
const router = express.Router();
const bookingController = require('../../controllers/user/bookingController');
const { isAuth } = require('../../middleware/auth');

// Form đặt vé (trang mặc định)
router.get('/', isAuth, bookingController.showBookingForm);

// Form đặt vé với ID lịch trình - Thêm route cho URL đúng
router.get('/schedule/:id', isAuth, bookingController.showBookingForm);

// Xử lý đặt vé
router.post('/', isAuth, bookingController.createBooking);

// Xem chi tiết đặt vé
router.get('/chi-tiet/:id', isAuth, bookingController.getBookingDetails);

// Xem lịch sử đặt vé
router.get('/lich-su', isAuth, bookingController.getBookingHistory);

// Hủy vé
router.post('/huy/:id', isAuth, bookingController.cancelBooking);

module.exports = router; 