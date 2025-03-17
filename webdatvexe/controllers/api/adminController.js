const db = require('../../config/database');
const bcrypt = require('bcrypt');

// Lấy danh sách admin (chỉ super admin)
exports.getAllAdmins = async (req, res) => {
  try {
    const [admins] = await db.execute(
      'SELECT id, username, email, full_name, is_super_admin, last_login, created_at FROM admins'
    );
    
    return res.success(admins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    return res.error('Error fetching admins', 500);
  }
};

// Lấy thông tin admin theo ID (chỉ super admin)
exports.getAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [admins] = await db.execute(
      'SELECT id, username, email, full_name, is_super_admin, last_login, created_at FROM admins WHERE id = ?',
      [id]
    );
    
    if (admins.length === 0) {
      return res.error('Admin not found', 404);
    }
    
    return res.success(admins[0]);
  } catch (error) {
    console.error('Error fetching admin:', error);
    return res.error('Error fetching admin', 500);
  }
};

// Tạo admin mới (chỉ super admin)
exports.createAdmin = async (req, res) => {
  try {
    const { username, password, email, full_name, is_super_admin } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.error('Username and password are required', 400);
    }
    
    // Check if username already exists
    const [existingAdmins] = await db.execute(
      'SELECT * FROM admins WHERE username = ?',
      [username]
    );
    
    if (existingAdmins.length > 0) {
      return res.error('Username already exists', 400);
    }
    
    // Hash password
    let hashedPassword = password;
    if (!process.env.DISABLE_PASSWORD_HASHING) {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    
    // Create admin
    const [result] = await db.execute(
      'INSERT INTO admins (username, password, email, full_name, is_super_admin) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, email || null, full_name || null, is_super_admin ? 1 : 0]
    );
    
    // Get created admin
    const [newAdmin] = await db.execute(
      'SELECT id, username, email, full_name, is_super_admin, created_at FROM admins WHERE id = ?',
      [result.insertId]
    );
    
    return res.success(newAdmin[0], 'Admin created successfully', 201);
  } catch (error) {
    console.error('Error creating admin:', error);
    return res.error('Error creating admin', 500);
  }
};

// Cập nhật admin (chỉ super admin)
exports.updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, full_name, is_super_admin } = req.body;
    
    // Check if admin exists
    const [admins] = await db.execute('SELECT * FROM admins WHERE id = ?', [id]);
    if (admins.length === 0) {
      return res.error('Admin not found', 404);
    }
    
    // Prevent downgrading self from super admin
    if (req.tokenUser.id == id && req.tokenUser.isSuperAdmin && is_super_admin === 0) {
      return res.error('Cannot remove your own super admin privileges', 400);
    }
    
    // Prepare update data
    const updates = [];
    const params = [];
    
    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email);
    }
    
    if (full_name !== undefined) {
      updates.push('full_name = ?');
      params.push(full_name);
    }
    
    if (is_super_admin !== undefined) {
      updates.push('is_super_admin = ?');
      params.push(is_super_admin ? 1 : 0);
    }
    
    if (updates.length === 0) {
      return res.error('No fields to update', 400);
    }
    
    // Add id to params
    params.push(id);
    
    // Update admin
    await db.execute(
      `UPDATE admins SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    // Get updated admin
    const [updatedAdmin] = await db.execute(
      'SELECT id, username, email, full_name, is_super_admin, last_login, created_at FROM admins WHERE id = ?',
      [id]
    );
    
    return res.success(updatedAdmin[0], 'Admin updated successfully');
  } catch (error) {
    console.error('Error updating admin:', error);
    return res.error('Error updating admin', 500);
  }
};

// Cập nhật mật khẩu admin (chỉ super admin hoặc chính bản thân admin đó)
exports.updateAdminPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password, current_password } = req.body;
    
    // Validate input
    if (!password) {
      return res.error('New password is required', 400);
    }
    
    // Check if admin exists
    const [admins] = await db.execute('SELECT * FROM admins WHERE id = ?', [id]);
    if (admins.length === 0) {
      return res.error('Admin not found', 404);
    }
    
    const admin = admins[0];
    
    // If not super admin and not the same user, require current password
    if (!req.tokenUser.isSuperAdmin && req.tokenUser.id != id) {
      return res.error('You do not have permission to change this password', 403);
    }
    
    // If changing own password, require current password
    if (req.tokenUser.id == id && !current_password) {
      return res.error('Current password is required', 400);
    }
    
    // Verify current password if provided
    if (current_password) {
      let passwordMatch = false;
      
      // Try direct comparison first
      if (current_password === admin.password) {
        passwordMatch = true;
      } 
      // If direct comparison fails, try bcrypt compare
      else if (admin.password.startsWith('$2')) {
        passwordMatch = await bcrypt.compare(current_password, admin.password);
      }
      
      if (!passwordMatch) {
        return res.error('Current password is incorrect', 400);
      }
    }
    
    // Hash new password
    let hashedPassword = password;
    if (!process.env.DISABLE_PASSWORD_HASHING) {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    
    // Update password
    await db.execute(
      'UPDATE admins SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
    
    return res.success(null, 'Password updated successfully');
  } catch (error) {
    console.error('Error updating admin password:', error);
    return res.error('Error updating admin password', 500);
  }
};

// Xóa admin (chỉ super admin)
exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if admin exists
    const [admins] = await db.execute('SELECT * FROM admins WHERE id = ?', [id]);
    if (admins.length === 0) {
      return res.error('Admin not found', 404);
    }
    
    // Prevent deleting self
    if (req.tokenUser.id == id) {
      return res.error('Cannot delete your own account', 400);
    }
    
    // Delete admin
    await db.execute('DELETE FROM admins WHERE id = ?', [id]);
    
    return res.success(null, 'Admin deleted successfully');
  } catch (error) {
    console.error('Error deleting admin:', error);
    return res.error('Error deleting admin', 500);
  }
}; 