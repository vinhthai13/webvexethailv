const AdminUser = require('../../models/admin/AdminUser');
const bcrypt = require('bcrypt');

class AdminAuthController {
  // GET /admin/login
  async showLogin(req, res) {
    res.render('admin/auth/login', { 
      title: 'Đăng nhập quản trị',
      error: req.flash('error')
    });
  }

  // POST /admin/login
  async login(req, res) {
    try {
      const { username, password } = req.body;
      
      // Validate input
      if (!username || !password) {
        req.flash('error', 'Vui lòng nhập đầy đủ thông tin');
        return res.redirect('/admin/login');
      }

      // Find admin user
      const admin = await AdminUser.findByUsername(username);
      if (!admin) {
        req.flash('error', 'Tên đăng nhập hoặc mật khẩu không đúng');
        return res.redirect('/admin/login');
      }

      // Verify password (plain text comparison for now)
      if (password !== admin.password) {
        req.flash('error', 'Tên đăng nhập hoặc mật khẩu không đúng');
        return res.redirect('/admin/login');
      }

      // Set session data
      req.session.admin = {
        id: admin.id,
        username: admin.username,
        fullName: admin.full_name,
        email: admin.email,
        isSuperAdmin: admin.is_super_admin === 1
      };

      // Update last login time
      await AdminUser.updateLastLogin(admin.id);

      // Redirect to intended URL or dashboard
      const returnTo = req.session.returnTo || '/admin/dashboard';
      delete req.session.returnTo;
      res.redirect(returnTo);

    } catch (err) {
      console.error('Admin login error:', err);
      req.flash('error', 'Có lỗi xảy ra, vui lòng thử lại');
      res.redirect('/admin/login');
    }
  }

  // GET /admin/logout
  async logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
      res.redirect('/admin/login');
    });
  }

  // GET /admin/profile
  async showProfile(req, res) {
    try {
      const admin = await AdminUser.findById(req.session.admin.id);
      if (!admin) {
        return res.redirect('/admin/login');
      }

      res.render('admin/auth/profile', {
        title: 'Thông tin cá nhân',
        admin: {
          ...admin,
          password: undefined // Don't send password to view
        }
      });
    } catch (err) {
      console.error('Error getting admin profile:', err);
      res.status(500).render('error', {
        message: 'Có lỗi xảy ra',
        error: {
          status: 500,
          stack: process.env.NODE_ENV === 'development' ? err.stack : ''
        }
      });
    }
  }

  // POST /admin/profile
  async updateProfile(req, res) {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      
      // Find admin
      const admin = await AdminUser.findById(req.session.admin.id);
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Phiên đăng nhập đã hết hạn'
        });
      }

      // Verify current password
      if (currentPassword !== admin.password) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu hiện tại không đúng'
        });
      }

      // Validate new password
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu mới không khớp'
        });
      }

      // Update password
      await AdminUser.update(admin.id, { 
        password: newPassword,
        updated_at: new Date()
      });

      res.json({
        success: true,
        message: 'Cập nhật mật khẩu thành công'
      });
    } catch (err) {
      console.error('Error updating admin profile:', err);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra, vui lòng thử lại'
      });
    }
  }
}

module.exports = new AdminAuthController(); 