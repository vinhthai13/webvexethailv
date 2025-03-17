const db = require('../../config/database');

class AdminUser {
  static async findByUsername(username) {
    try {
      const query = `
        SELECT * FROM admins 
        WHERE username = ? AND status = 'active'
      `;
      const [admins] = await db.execute(query, [username]);
      return admins[0] || null;
    } catch (err) {
      console.error('Error in AdminUser.findByUsername:', err);
      throw new Error('Không thể tìm thấy tài khoản admin');
    }
  }

  static async findById(id) {
    try {
      const query = `
        SELECT * FROM admins 
        WHERE id = ? AND status = 'active'
      `;
      const [admins] = await db.execute(query, [id]);
      return admins[0] || null;
    } catch (err) {
      console.error('Error in AdminUser.findById:', err);
      throw new Error('Không thể tìm thấy tài khoản admin');
    }
  }

  static async updateLastLogin(id) {
    try {
      const query = `
        UPDATE admins 
        SET last_login = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      await db.execute(query, [id]);
    } catch (err) {
      console.error('Error in AdminUser.updateLastLogin:', err);
      // Không throw error vì đây không phải lỗi nghiêm trọng
    }
  }

  static async update(id, data) {
    try {
      const fields = [];
      const values = [];
      
      Object.entries(data).forEach(([key, value]) => {
        fields.push(`${key} = ?`);
        values.push(value);
      });
      
      values.push(id);

      const query = `
        UPDATE admins 
        SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      const [result] = await db.execute(query, values);
      return result.affectedRows > 0;
    } catch (err) {
      console.error('Error in AdminUser.update:', err);
      throw new Error('Không thể cập nhật thông tin admin');
    }
  }

  static async create(data) {
    try {
      const fields = Object.keys(data);
      const placeholders = fields.map(() => '?').join(', ');
      const values = Object.values(data);

      const query = `
        INSERT INTO admins (${fields.join(', ')})
        VALUES (${placeholders})
      `;
      
      const [result] = await db.execute(query, values);
      return result.insertId;
    } catch (err) {
      console.error('Error in AdminUser.create:', err);
      throw new Error('Không thể tạo tài khoản admin');
    }
  }

  static async delete(id) {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE admins SET status = "inactive" WHERE id = ?';
      connection.query(query, [id], (err, result) => {
        if (err) reject(err);
        resolve(result.affectedRows > 0);
      });
    });
  }
}

module.exports = AdminUser; 