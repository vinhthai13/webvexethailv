require('dotenv').config(); // Load environment variables
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const connection = require('./config/database');
const app = express();
const port = process.env.PORT  
const fs = require('fs');
const mysql = require('mysql');
const flash = require('connect-flash');
const jwt = require('jsonwebtoken');
const moment = require('moment-timezone');
const fileUpload = require('express-fileupload');

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

// Import routes
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const scheduleRoutes = require('./routes/user/schedules');
const bookingRoutes = require('./routes/user/bookings');
const homeRoutes = require('./routes/user/home');
const newsRoutes = require('./routes/user/news');
const contactRoutes = require('./routes/user/contact');

// Import middleware
const { notFound, errorHandler } = require('./middleware/error');
const loadBanners = require('./middleware/bannerMiddleware'); // Thêm middleware banner

// Middleware cho static files (CSS, JS, hình ảnh) 
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File Upload middleware
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  createParentPath: true, // Tự động tạo thư mục nếu chưa tồn tại
  useTempFiles: true,
  tempFileDir: path.join(__dirname, 'tmp')
}));

// Add session middleware configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.SESSION_SECURE === 'true' } // set to true if using https
}));

// Add flash middleware
app.use(flash());

// JWT Middleware - Extract token from request headers
app.use((req, res, next) => {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
        try {
            // Verify token
            const decoded = jwt.verify(token, JWT_SECRET);
            req.tokenUser = decoded; // Store decoded user in request
        } catch (error) {
            // Token verification failed
            console.error('Token verification failed:', error.message);
        }
    }
    next();
});

// JWT Token Generator Helper
app.generateToken = (user, isAdmin = false) => {
    return jwt.sign(
        { 
            id: user.id, 
            username: user.username,
            ...(isAdmin ? { isAdmin: true } : {}),
            ...(isAdmin && user.is_super_admin === 1 ? { isSuperAdmin: true } : {})
        }, 
        JWT_SECRET, 
        { expiresIn: JWT_EXPIRES_IN }
    );
};

// Add helper functions to app locals
app.locals.formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount || 0);
};

// Format date helper
app.locals.formatDate = function(date) {
  if (!date) return 'Chưa có thông tin';
  
  try {
    // Nếu đã là đối tượng Date
    if (date instanceof Date) {
      return moment(date).format('DD/MM/YYYY HH:mm:ss');
    }
    
    // Nếu là string
    if (typeof date === 'string') {
      // Kiểm tra định dạng MySQL datetime
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(date)) {
        return moment(date).format('DD/MM/YYYY HH:mm:ss');
      }
      // Kiểm tra định dạng chỉ có ngày MySQL
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return moment(date).format('DD/MM/YYYY');
      }
    }
    
    // Xử lý các trường hợp khác
    return moment(new Date(date)).format('DD/MM/YYYY HH:mm:ss');
  } catch (error) {
    console.error('Date format error:', error);
    return date; // Trả về nguyên chuỗi nếu lỗi
  }
};

app.locals.formatNumber = (number) => {
  return new Intl.NumberFormat('vi-VN').format(number || 0);
};

// Middleware để truyền user và currentPath vào tất cả views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.currentPath = req.path;
  next();
});

// Add currentPath middleware
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

// Cấu hình view engine là Pug 
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Load các banner chung cho toàn bộ ứng dụng
app.use(loadBanners);

// API Response Helper Middleware
app.use((req, res, next) => {
  // Add API response helpers
  res.success = (data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  };
  
  res.error = (message = 'Error', statusCode = 400, errors = null) => {
    return res.status(statusCode).json({
      success: false,
      message,
      errors
    });
  };
  
  next();
});

// Mount routes
app.use('/', authRoutes);     // Mount auth routes first
app.use('/admin', adminRoutes); // Then mount admin routes
app.use('/', homeRoutes);     // Mount home routes
app.use('/tin-tuc', newsRoutes); // Mount news routes
app.use('/lien-he', contactRoutes); // Mount contact routes
app.use('/lich-trinh', scheduleRoutes);
app.use('/dat-ve', bookingRoutes);
app.use('/search', require('./routes/user/search'));
app.use('/tuyen-xe', require('./routes/user/routes'));
app.use('/', userRoutes);     // Mount user routes for any remaining routes

// API Routes
app.use('/api', require('./routes/api')); // Mount all API routes

// Error handling
app.use(notFound);
app.use(errorHandler);

 

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});