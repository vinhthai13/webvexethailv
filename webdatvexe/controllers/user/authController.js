const User = require('../../models/user/User');

class AuthController {
  // GET /dang-ky
  async showRegister(req, res) {
    res.render('user/auth/register', {
      title: 'Đăng ký tài khoản'
    });
  }

  // POST /dang-ky
  async register(req, res) {
    try {
      const { username, password, email, phone } = req.body;

      // Validate input
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
      if (password.length < 4) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu phải có ít nhất 4 ký tự'
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

      // Create user
      await User.create({
        username,
        password,
        email,
        phone
      });

      res.status(200).json({
        success: true,
        message: 'Đăng ký thành công'
      });

    } catch (err) {
      console.error('Registration error:', err);
      res.status(400).json({
        success: false,
        message: err.message || 'Có lỗi xảy ra khi đăng ký'
      });
    }
  }

  // GET /dang-nhap
  async showLogin(req, res) {
    res.render('user/auth/login', {
      title: 'Đăng nhập'
    });
  }

  // POST /dang-nhap
  async login(req, res) {
    try {
      const { username, password } = req.body;

      // Validate input
      if (!username || !password) {
        return res.render('user/auth/login', {
          title: 'Đăng nhập',
          error: 'Vui lòng nhập đầy đủ thông tin'
        });
      }

      // Find user
      const user = await User.findByUsername(username);
      if (!user) {
        return res.render('user/auth/login', {
          title: 'Đăng nhập',
          error: 'Tên đăng nhập hoặc mật khẩu không đúng'
        });
      }

      // Check password
      if (password !== user.password) {
        return res.render('user/auth/login', {
          title: 'Đăng nhập',
          error: 'Tên đăng nhập hoặc mật khẩu không đúng'
        });
      }

      // Set session
      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone
      };

      res.redirect('/');

    } catch (err) {
      console.error('Login error:', err);
      res.render('user/auth/login', {
        title: 'Đăng nhập',
        error: 'Có lỗi xảy ra khi đăng nhập'
      });
    }
  }

  // GET /dang-xuat
  async logout(req, res) {
    req.session.destroy();
    res.redirect('/');
  }
}

module.exports = new AuthController(); 