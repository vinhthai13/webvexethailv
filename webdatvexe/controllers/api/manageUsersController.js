const db = require('../../config/database');
const bcrypt = require('bcrypt');

// Lấy danh sách người dùng (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const { search, status } = req.query;
    
    let sql = `
      SELECT id, username, email, phone, full_name, status, created_at 
      FROM users 
      WHERE 1=1
    `;
    
    const params = [];
    
    if (search) {
      sql += ` AND (username LIKE ? OR email LIKE ? OR phone LIKE ? OR full_name LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }
    
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }
    
    sql += ` ORDER BY created_at DESC`;
    
    const [users] = await db.execute(sql, params);
    
    return res.success(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.error('Error fetching users', 500);
  }
};

// Lấy thông tin chi tiết người dùng (admin only)
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Lấy thông tin cơ bản của người dùng
    const [users] = await db.execute(`
      SELECT id, username, email, phone, full_name, status, created_at 
      FROM users 
      WHERE id = ?
    `, [id]);
    
    if (users.length === 0) {
      return res.error('User not found', 404);
    }
    
    const user = users[0];
    
    // Lấy thông tin đặt vé của người dùng
    const [bookings] = await db.execute(`
      SELECT b.id, b.schedule_id, b.passenger_name, b.status, b.created_at,
             s.departure_date, s.departure_time,
             r.from_location, r.to_location
      FROM bookings b
      JOIN schedules s ON b.schedule_id = s.id
      JOIN routes r ON s.route_id = r.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
      LIMIT 10
    `, [id]);
    
    user.recent_bookings = bookings;
    
    return res.success(user);
  } catch (error) {
    console.error('Error fetching user details:', error);
    return res.error('Error fetching user details', 500);
  }
};

// Tạo người dùng mới (admin only)
exports.createUser = async (req, res) => {
  try {
    const { username, password, email, phone, full_name } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.error('Username and password are required', 400);
    }
    
    // Check if username already exists
    const [existingUsers] = await db.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    if (existingUsers.length > 0) {
      return res.error('Username already exists', 400);
    }
    
    // Check if email already exists
    if (email) {
      const [existingEmails] = await db.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      
      if (existingEmails.length > 0) {
        return res.error('Email already exists', 400);
      }
    }
    
    // Hash password
    let hashedPassword = password;
    if (!process.env.DISABLE_PASSWORD_HASHING) {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    
    // Create user
    const [result] = await db.execute(
      'INSERT INTO users (username, password, email, phone, full_name, status) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, email || null, phone || null, full_name || null, 'active']
    );
    
    // Get created user
    const [newUser] = await db.execute(
      'SELECT id, username, email, phone, full_name, status, created_at FROM users WHERE id = ?',
      [result.insertId]
    );
    
    return res.success(newUser[0], 'User created successfully', 201);
  } catch (error) {
    console.error('Error creating user:', error);
    return res.error('Error creating user', 500);
  }
};

// Cập nhật thông tin người dùng (admin only)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, phone, full_name, status } = req.body;
    
    // Check if user exists
    const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.error('User not found', 404);
    }
    
    // Prepare update data
    const updates = [];
    const params = [];
    
    if (email !== undefined) {
      // Check if email already exists
      const [existingEmails] = await db.execute(
        'SELECT * FROM users WHERE email = ? AND id != ?',
        [email, id]
      );
      
      if (email && existingEmails.length > 0) {
        return res.error('Email already exists', 400);
      }
      
      updates.push('email = ?');
      params.push(email);
    }
    
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone);
    }
    
    if (full_name !== undefined) {
      updates.push('full_name = ?');
      params.push(full_name);
    }
    
    if (status !== undefined) {
      if (!['active', 'inactive', 'suspended'].includes(status)) {
        return res.error('Invalid status value', 400);
      }
      
      updates.push('status = ?');
      params.push(status);
    }
    
    if (updates.length === 0) {
      return res.error('No fields to update', 400);
    }
    
    // Add id to params
    params.push(id);
    
    // Update user
    await db.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    // Get updated user
    const [updatedUser] = await db.execute(
      'SELECT id, username, email, phone, full_name, status, created_at FROM users WHERE id = ?',
      [id]
    );
    
    return res.success(updatedUser[0], 'User updated successfully');
  } catch (error) {
    console.error('Error updating user:', error);
    return res.error('Error updating user', 500);
  }
};

// Đặt lại mật khẩu cho người dùng (admin only)
exports.resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;
    
    if (!new_password) {
      return res.error('New password is required', 400);
    }
    
    // Check if user exists
    const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.error('User not found', 404);
    }
    
    // Hash new password
    let hashedPassword = new_password;
    if (!process.env.DISABLE_PASSWORD_HASHING) {
      hashedPassword = await bcrypt.hash(new_password, 10);
    }
    
    // Update password
    await db.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
    
    return res.success(null, 'Password reset successfully');
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.error('Error resetting password', 500);
  }
};

// Xóa người dùng (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.error('User not found', 404);
    }
    
    // Check if user has bookings
    const [bookings] = await db.execute(
      'SELECT COUNT(*) as count FROM bookings WHERE user_id = ?',
      [id]
    );
    
    if (bookings[0].count > 0) {
      // Instead of deleting, just set status to 'inactive'
      await db.execute(
        'UPDATE users SET status = ? WHERE id = ?',
        ['inactive', id]
      );
      
      return res.success(null, 'User has bookings. Status set to inactive instead of deleting');
    }
    
    // Delete user if no bookings
    await db.execute('DELETE FROM users WHERE id = ?', [id]);
    
    return res.success(null, 'User deleted successfully');
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.error('Error deleting user', 500);
  }
}; 