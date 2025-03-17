const validateSchedule = (req, res, next) => {
    const { route_id, departure_time, arrival_time, bus_type, price, available_seats } = req.body;

    if (!route_id || !departure_time || !arrival_time || !bus_type || !price || !available_seats) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng điền đầy đủ thông tin'
        });
    }

    if (price < 0) {
        return res.status(400).json({
            success: false,
            message: 'Giá vé không hợp lệ'
        });
    }

    if (available_seats < 0) {
        return res.status(400).json({
            success: false,
            message: 'Số ghế trống không hợp lệ'
        });
    }

    next();
};

const validateRoute = (req, res, next) => {
    const { from_location, to_location } = req.body;

    if (!from_location || !to_location) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng điền đầy đủ thông tin'
        });
    }

    if (from_location === to_location) {
        return res.status(400).json({
            success: false,
            message: 'Điểm đi và điểm đến không được trùng nhau'
        });
    }

    next();
};

const validateBooking = (req, res, next) => {
    const { schedule_id, customer_name, phone, email, seats, total_price } = req.body;

    if (!schedule_id || !customer_name || !phone || !email || !seats || !total_price) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng điền đầy đủ thông tin'
        });
    }

    // Validate phone number format (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
        return res.status(400).json({
            success: false,
            message: 'Số điện thoại không hợp lệ. Phải có 10 chữ số'
        });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Email không hợp lệ'
        });
    }

    // Validate seats
    if (seats < 1) {
        return res.status(400).json({
            success: false,
            message: 'Số ghế phải lớn hơn 0'
        });
    }

    if (isNaN(total_price) || total_price <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Tổng tiền không hợp lệ'
        });
    }

    next();
};

const validateUser = (req, res, next) => {
    const { username, password, email, phone } = req.body;

    if (!username || !password || !email || !phone) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng điền đầy đủ thông tin'
        });
    }

    // Validate username
    if (username.length < 3) {
        return res.status(400).json({
            success: false,
            message: 'Tên đăng nhập phải có ít nhất 3 ký tự'
        });
    }

    // Validate password
    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Mật khẩu phải có ít nhất 6 ký tự'
        });
    }

    // Validate phone
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
        return res.status(400).json({
            success: false,
            message: 'Số điện thoại không hợp lệ'
        });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Email không hợp lệ'
        });
    }

    next();
};

// Validate booking status update
const validateBookingStatus = (req, res, next) => {
    const { statusId } = req.body;

    if (!statusId) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng chọn trạng thái'
        });
    }

    // Validate status ID (1: Pending, 2: Confirmed, 3: Cancelled)
    if (![1, 2, 3].includes(Number(statusId))) {
        return res.status(400).json({
            success: false,
            message: 'Trạng thái không hợp lệ'
        });
    }

    next();
};

module.exports = {
    validateSchedule,
    validateRoute,
    validateBooking,
    validateUser,
    validateBookingStatus
}; 