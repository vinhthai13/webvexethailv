const AdminUserModel = require('../../models/admin/AdminUserModel');
const bcrypt = require('bcrypt');

class AdminUserController {
  // List all users
  async getAllUsers(req, res) {
    try {
      const users = await AdminUserModel.getAllUsers();
      res.render('admin/users/index', {
        title: 'Quản lý người dùng',
        users,
        messages: req.flash()
      });
    } catch (err) {
      console.error('Error fetching users:', err);
      req.flash('error', 'Có lỗi xảy ra khi tải danh sách người dùng');
      res.redirect('/admin/dashboard');
    }
  }

  // Show create user form
  showCreateForm(req, res) {
    res.render('admin/users/form', {
      title: 'Thêm người dùng mới',
      user: {},
      messages: req.flash()
    });
  }

  // Create new user
  async createUser(req, res) {
    try {
      const { username, email, phone, password } = req.body;

      // Check if username already exists
      if (await AdminUserModel.checkUsernameExists(username)) {
        req.flash('error', 'Tên đăng nhập đã tồn tại');
        return res.redirect('/admin/users/create');
      }

      // Check if email already exists
      if (await AdminUserModel.checkEmailExists(email)) {
        req.flash('error', 'Email đã được sử dụng');
        return res.redirect('/admin/users/create');
      }

      await AdminUserModel.createUser({ username, email, phone, password });
      req.flash('success', 'Đã thêm người dùng mới thành công');
      res.redirect('/admin/users');
    } catch (err) {
      console.error('Error creating user:', err);
      req.flash('error', 'Có lỗi xảy ra khi thêm người dùng');
      res.redirect('/admin/users/create');
    }
  }

  // Show edit user form
  async showEditForm(req, res) {
    try {
      const user = await AdminUserModel.getUserById(req.params.id);
      
      if (!user) {
        req.flash('error', 'Không tìm thấy người dùng');
        return res.redirect('/admin/users');
      }

      res.render('admin/users/form', {
        title: 'Sửa thông tin người dùng',
        user,
        messages: req.flash()
      });
    } catch (err) {
      console.error('Error loading edit form:', err);
      req.flash('error', 'Có lỗi xảy ra khi tải thông tin người dùng');
      res.redirect('/admin/users');
    }
  }

  // Update user
  async updateUser(req, res) {
    try {
      const { username, email, phone, password } = req.body;
      const userId = req.params.id;

      // Check if username already exists for other users
      if (await AdminUserModel.checkUsernameExists(username, userId)) {
        req.flash('error', 'Tên đăng nhập đã tồn tại');
        return res.redirect(`/admin/users/${userId}/edit`);
      }

      // Check if email already exists for other users
      if (await AdminUserModel.checkEmailExists(email, userId)) {
        req.flash('error', 'Email đã được sử dụng');
        return res.redirect(`/admin/users/${userId}/edit`);
      }

      await AdminUserModel.updateUser(userId, { username, email, phone, password });
      req.flash('success', 'Đã cập nhật thông tin người dùng thành công');
      res.redirect('/admin/users');
    } catch (err) {
      console.error('Error updating user:', err);
      req.flash('error', 'Có lỗi xảy ra khi cập nhật thông tin người dùng');
      res.redirect(`/admin/users/${req.params.id}/edit`);
    }
  }

  // Show user details
  async getUserDetails(req, res) {
    try {
      const userWithBookings = await AdminUserModel.getUserWithBookings(req.params.id);

      if (!userWithBookings) {
        req.flash('error', 'Không tìm thấy người dùng');
        return res.redirect('/admin/users');
      }

      res.render('admin/users/details', {
        title: 'Chi tiết người dùng',
        user: userWithBookings,
        bookings: userWithBookings.bookings,
        messages: req.flash()
      });
    } catch (err) {
      console.error('Error fetching user details:', err);
      req.flash('error', 'Có lỗi xảy ra khi tải thông tin người dùng');
      res.redirect('/admin/users');
    }
  }

  // Delete user
  async deleteUser(req, res) {
    try {
      const userId = req.params.id;

      // Check if user has any bookings
      if (await AdminUserModel.hasBookings(userId)) {
        req.flash('error', 'Không thể xóa người dùng đã có đặt vé');
        return res.redirect('/admin/users');
      }

      await AdminUserModel.deleteUser(userId);
      req.flash('success', 'Đã xóa người dùng thành công');
      res.redirect('/admin/users');
    } catch (err) {
      console.error('Error deleting user:', err);
      req.flash('error', 'Có lỗi xảy ra khi xóa người dùng');
      res.redirect('/admin/users');
    }
  }

  // Get admin profile
  async getProfile(req, res) {
    try {
      const user = await AdminUserModel.findById(req.user.id);
      res.render('admin/profile', {
        user,
        success: req.flash('success'),
        error: req.flash('error'),
        title: 'Thông tin cá nhân'
      });
    } catch (error) {
      console.error('Error getting profile:', error);
      req.flash('error', 'Có lỗi xảy ra khi tải thông tin cá nhân');
      res.redirect('/admin');
    }
  }

  // Update admin profile
  async updateProfile(req, res) {
    try {
      const { name, email, current_password, new_password, confirm_password } = req.body;
      const user = await AdminUserModel.findById(req.user.id);

      // Validate password if trying to change it
      if (new_password) {
        if (!current_password) {
          req.flash('error', 'Vui lòng nhập mật khẩu hiện tại');
          return res.redirect('/admin/profile');
        }

        if (new_password !== confirm_password) {
          req.flash('error', 'Mật khẩu mới không khớp');
          return res.redirect('/admin/profile');
        }

        const isValidPassword = await bcrypt.compare(current_password, user.password);
        if (!isValidPassword) {
          req.flash('error', 'Mật khẩu hiện tại không đúng');
          return res.redirect('/admin/profile');
        }
      }

      // Update user info
      const updateData = {
        name,
        email
      };

      if (new_password) {
        updateData.password = await bcrypt.hash(new_password, 10);
      }

      await AdminUserModel.updateById(req.user.id, updateData);
      req.flash('success', 'Cập nhật thông tin thành công');
      res.redirect('/admin/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      req.flash('error', 'Có lỗi xảy ra khi cập nhật thông tin');
      res.redirect('/admin/profile');
    }
  }
}

module.exports = new AdminUserController(); 