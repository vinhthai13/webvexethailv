const bcrypt = require('bcrypt');
const db = require('../../config/database');

// Hiển thị form đổi mật khẩu
exports.getChangePassword = (req, res) => {
  res.render('user/change-password', {
    title: 'Đổi mật khẩu',
    user: req.user
  });
};

// Xử lý đổi mật khẩu
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Kiểm tra input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.render('user/change-password', {
        title: 'Đổi mật khẩu',
        user: req.user,
        message: {
          type: 'danger',
          content: 'Vui lòng điền đầy đủ thông tin'
        }
      });
    }

    // Kiểm tra mật khẩu mới có khớp không
    if (newPassword !== confirmPassword) {
      return res.render('user/change-password', {
        title: 'Đổi mật khẩu',
        user: req.user,
        message: {
          type: 'danger',
          content: 'Mật khẩu mới không khớp'
        }
      });
    }

    // Lấy thông tin user từ database
    const [users] = await db.execute(
      'SELECT * FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.render('user/change-password', {
        title: 'Đổi mật khẩu',
        user: req.user,
        message: {
          type: 'danger',
          content: 'Không tìm thấy thông tin người dùng'
        }
      });
    }

    // Kiểm tra mật khẩu hiện tại
    const isPasswordValid = await bcrypt.compare(currentPassword, users[0].password);
    if (!isPasswordValid) {
      return res.render('user/change-password', {
        title: 'Đổi mật khẩu',
        user: req.user,
        message: {
          type: 'danger',
          content: 'Mật khẩu hiện tại không đúng'
        }
      });
    }

    // Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu trong database
    await db.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, req.user.id]
    );

    return res.render('user/change-password', {
      title: 'Đổi mật khẩu',
      user: req.user,
      message: {
        type: 'success',
        content: 'Đổi mật khẩu thành công'
      }
    });

  } catch (error) {
    console.error('Error updating password:', error);
    return res.render('user/change-password', {
      title: 'Đổi mật khẩu',
      user: req.user,
      message: {
        type: 'danger',
        content: 'Đã có lỗi xảy ra, vui lòng thử lại'
      }
    });
  }
};