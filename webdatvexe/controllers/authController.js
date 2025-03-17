const User = require('../models/user/User');
const AdminUser = require('../models/admin/AdminUser');
const bcrypt = require('bcrypt');
const db = require('../config/database');

class AuthController {
  // GET /login
  async showLogin(req, res) {
    res.render('auth/login', { 
      title: 'Đăng nhập',
      error: req.flash('error')
    });
  }

  // POST /login
  async login(req, res) {
    try {
      const { username, password } = req.body;
      
      // Validate input
      if (!username || !password) {
        req.flash('error', 'Vui lòng nhập đầy đủ thông tin');
        return res.redirect('/login');
      }

      console.log('Attempting login for username:', username);

      // Try to find admin user first
      const [admins] = await db.execute(
        'SELECT * FROM admins WHERE username = ?',
        [username]
      );
      const admin = admins[0];

      console.log('Found admin:', admin ? 'yes' : 'no');

      if (admin) {
        // Try direct comparison first (for non-hashed passwords)
        let isValidPassword = password === admin.password;
        
        // If direct comparison fails, try bcrypt compare (for hashed passwords)
        if (!isValidPassword && admin.password.startsWith('$2')) {
          isValidPassword = await bcrypt.compare(password, admin.password);
        }

        console.log('Admin password match:', isValidPassword ? 'yes' : 'no');

        if (isValidPassword) {
          // Set admin session
          req.session.admin = {
            id: admin.id,
            username: admin.username,
            fullName: admin.full_name || admin.username,
            email: admin.email,
            isSuperAdmin: admin.is_super_admin === 1
          };

          // Update last login time
          await db.execute(
            'UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [admin.id]
          );

          // Redirect to admin dashboard
          return res.redirect('/admin/dashboard');
        }
      }

      // If not admin, try to find regular user
      const [users] = await db.execute(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      const user = users[0];

      console.log('Found user:', user ? 'yes' : 'no');

      if (user) {
        // For now, compare passwords directly for users
        if (password === user.password) {
          console.log('User password matched');
          
          // Set user session
          req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email || '',
            phone: user.phone || '',
            created_at: user.created_at
          };

          // Redirect to user homepage
          return res.redirect('/');
        }
        console.log('User password did not match');
      }

      // If no matching user found or password incorrect
      req.flash('error', 'Tên đăng nhập hoặc mật khẩu không đúng');
      return res.redirect('/login');

    } catch (err) {
      console.error('Login error:', err);
      req.flash('error', 'Có lỗi xảy ra, vui lòng thử lại');
      res.redirect('/login');
    }
  }

  // POST /api/login - Token-based login for API
  async apiLogin(req, res) {
    try {
      const { username, password } = req.body;
      
      // Validate input
      if (!username || !password) {
        return res.error('Vui lòng nhập đầy đủ thông tin', 400);
      }

      // Try to find admin user first
      const [admins] = await db.execute(
        'SELECT * FROM admins WHERE username = ?',
        [username]
      );
      const admin = admins[0];

      if (admin) {
        // Try direct comparison first (for non-hashed passwords)
        let isValidPassword = password === admin.password;
        
        // If direct comparison fails, try bcrypt compare (for hashed passwords)
        if (!isValidPassword && admin.password.startsWith('$2')) {
          isValidPassword = await bcrypt.compare(password, admin.password);
        }

        if (isValidPassword) {
          // Create admin data object
          const adminData = {
            id: admin.id,
            username: admin.username,
            fullName: admin.full_name || admin.username,
            email: admin.email,
            isSuperAdmin: admin.is_super_admin === 1
          };

          // Generate JWT token
          const token = req.app.generateToken(admin, true);

          // Update last login time
          await db.execute(
            'UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [admin.id]
          );

          // Return success with token
          return res.success({ 
            user: adminData,
            token,
            type: 'admin'
          }, 'Đăng nhập thành công');
        }
      }

      // If not admin, try to find regular user
      const [users] = await db.execute(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      const user = users[0];

      if (user) {
        // For now, compare passwords directly for users
        if (password === user.password) {
          // Create user data object
          const userData = {
            id: user.id,
            username: user.username,
            email: user.email || '',
            phone: user.phone || '',
            created_at: user.created_at
          };

          // Generate JWT token
          const token = req.app.generateToken(user);

          // Return success with token
          return res.success({ 
            user: userData,
            token,
            type: 'user'
          }, 'Đăng nhập thành công');
        }
      }

      // If no matching user found or password incorrect
      return res.error('Tên đăng nhập hoặc mật khẩu không đúng', 401);

    } catch (err) {
      console.error('API Login error:', err);
      return res.error('Có lỗi xảy ra, vui lòng thử lại', 500);
    }
  }

  // GET /logout
  async logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
      res.redirect('/login');
    });
  }

  // POST /api/logout - API endpoint for logout
  async apiLogout(req, res) {
    // For token-based auth, the client should discard the token
    // We can blacklist tokens here if needed in the future
    return res.success(null, 'Đăng xuất thành công');
  }

  // GET /api/me - Get current user info from token
  async getCurrentUser(req, res) {
    try {
      if (!req.tokenUser) {
        return res.error('Unauthorized', 401);
      }

      const userId = req.tokenUser.id;
      let userData;

      if (req.tokenUser.isAdmin) {
        // Get admin data
        const [admins] = await db.execute(
          'SELECT id, username, email, full_name, is_super_admin FROM admins WHERE id = ?',
          [userId]
        );
        
        if (!admins.length) {
          return res.error('User not found', 404);
        }

        userData = {
          id: admins[0].id,
          username: admins[0].username,
          email: admins[0].email || '',
          fullName: admins[0].full_name || admins[0].username,
          isSuperAdmin: admins[0].is_super_admin === 1,
          type: 'admin'
        };
      } else {
        // Get regular user data
        const [users] = await db.execute(
          'SELECT id, username, email, phone, created_at FROM users WHERE id = ?',
          [userId]
        );
        
        if (!users.length) {
          return res.error('User not found', 404);
        }

        userData = {
          id: users[0].id,
          username: users[0].username,
          email: users[0].email || '',
          phone: users[0].phone || '',
          created_at: users[0].created_at,
          type: 'user'
        };
      }

      return res.success(userData);
    } catch (err) {
      console.error('Get current user error:', err);
      return res.error('Server error', 500);
    }
  }
}

module.exports = new AuthController(); 