const jwt = require('jsonwebtoken');

const isAuth = (req, res, next) => {
    if (req.session.user) {
        req.user = req.session.user;
        next();
    } else {
        req.flash('error', 'Vui lòng đăng nhập để tiếp tục');
        res.redirect('/login');
    }
};

const isGuest = (req, res, next) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    next();
};

const isAdmin = (req, res, next) => {
    if (req.session.admin) {
        req.user = req.session.admin;
        next();
    } else {
        req.flash('error', 'Bạn không có quyền truy cập trang này');
        res.redirect('/login');
    }
};

const isSuperAdmin = (req, res, next) => {
    if (req.session.admin && req.session.admin.is_super_admin) {
        req.user = req.session.admin;
        next();
    } else {
        req.flash('error', 'Bạn không có quyền truy cập trang này');
        res.redirect('/admin');
    }
};

// Middleware xác thực JWT token cho API
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
};

// Middleware kiểm tra quyền admin cho API
const verifyAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này' });
    }
    next();
};

module.exports = {
    isAuth,
    isGuest,
    isAdmin,
    isSuperAdmin,
    verifyToken,
    verifyAdmin
}; 