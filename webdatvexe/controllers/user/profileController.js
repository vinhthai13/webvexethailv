const bcrypt = require('bcrypt');
const db = require('../../config/database');

// ... existing profile methods ...

exports.getChangePassword = (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  
  res.render('user/change-password', {
    title: 'Đổi mật khẩu',
    user: req.session.user
  });
};

exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    if (!req.session.user) {
      return res.redirect('/login');
    }
    
    const userId = req.session.user.id;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.render('user/change-password', {
        title: 'Đổi mật khẩu',
        user: req.session.user,
        message: {
          type: 'danger',
          content: 'Vui lòng điền đầy đủ thông tin'
        }
      });
    }

    if (newPassword !== confirmPassword) {
      return res.render('user/change-password', {
        title: 'Đổi mật khẩu',
        user: req.session.user,
        message: {
          type: 'danger',
          content: 'Mật khẩu mới không khớp'
        }
      });
    }

    // Get user from database
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.render('user/change-password', {
        title: 'Đổi mật khẩu',
        user: req.session.user,
        message: {
          type: 'danger',
          content: 'Không tìm thấy thông tin người dùng'
        }
      });
    }

    const currentUser = rows[0];

    // So sánh mật khẩu trực tiếp vì password trong DB đang là plain text
    if (currentPassword !== currentUser.password) {
      return res.render('user/change-password', {
        title: 'Đổi mật khẩu',
        user: req.session.user,
        message: {
          type: 'danger',
          content: 'Mật khẩu hiện tại không đúng'
        }
      });
    }

    // Update password mới (vẫn giữ dạng plain text để phù hợp với hệ thống hiện tại)
    await db.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [newPassword, userId]
    );

    return res.render('user/change-password', {
      title: 'Đổi mật khẩu',
      user: req.session.user,
      message: {
        type: 'success',
        content: 'Đổi mật khẩu thành công'
      }
    });

  } catch (error) {
    console.error('Error updating password:', error);
    return res.render('user/change-password', {
      title: 'Đổi mật khẩu',
      user: req.session.user,
      message: {
        type: 'danger',
        content: 'Đã có lỗi xảy ra, vui lòng thử lại'
      }
    });
  }
}; 