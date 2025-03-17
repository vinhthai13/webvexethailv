const express = require('express');
const router = express.Router();
const { isAuth } = require('../../middleware/auth');
const User = require('../../models/user/User');
const profileController = require('../../controllers/user/profileController');

// Profile page route
router.get('/', isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.status(404).send('Không tìm thấy người dùng');
    }
    
    res.render('user/profile', { 
      user,
      title: 'Thông tin cá nhân'
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).send('Lỗi server');
  }
});

// Update profile route
router.post('/update', isAuth, async (req, res) => {
  try {
    const { email, phone } = req.body;
    const userId = req.session.user.id;

    const success = await User.update(userId, { email, phone });
    if (!success) {
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi cập nhật' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Cập nhật thành công' 
    });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi cập nhật' 
    });
  }
});

// Thêm routes cho đổi mật khẩu
router.get('/change-password', isAuth, profileController.getChangePassword);
router.post('/change-password', isAuth, profileController.updatePassword);

module.exports = router; 