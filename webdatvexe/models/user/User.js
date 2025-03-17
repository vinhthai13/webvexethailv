const db = require('../../config/database');

class User {
  static async findById(id) {
    try {
      const query = `
        SELECT id, username, email, phone, created_at, is_active, role
        FROM users 
        WHERE id = ?
      `;
      const [users] = await db.execute(query, [id]);
      return users[0];
    } catch (err) {
      console.error('Error in User.findById:', err);
      throw err;
    }
  }

  static async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = ?';
    try {
      const [users] = await db.execute(query, [username]);
      return users[0];
    } catch (err) {
      console.error('Error in User.findByUsername:', err);
      throw err;
    }
  }

  static async create(userData) {
    const query = `
      INSERT INTO users (username, password, email, phone, created_at, is_active)
      VALUES (?, ?, ?, ?, NOW(), 0)
    `;

    try {
      // Kiểm tra username đã tồn tại chưa
      const [existingUsers] = await db.execute(
        'SELECT id FROM users WHERE username = ?',
        [userData.username]
      );

      if (existingUsers.length > 0) {
        throw new Error('Tên đăng nhập đã tồn tại');
      }

      // Kiểm tra email đã tồn tại chưa
      const [existingEmails] = await db.execute(
        'SELECT id FROM users WHERE email = ?',
        [userData.email]
      );

      if (existingEmails.length > 0) {
        throw new Error('Email đã được sử dụng');
      }

      const [result] = await db.execute(query, [
        userData.username,
        userData.password,
        userData.email,
        userData.phone
      ]);

      return result.insertId;
    } catch (err) {
      console.error('Error in User.create:', err);
      throw err;
    }
  }

  static async update(id, userData) {
    try {
      const query = 'UPDATE users SET ? WHERE id = ?';
      const [result] = await db.execute(query, [userData, id]);
      return result.affectedRows > 0;
    } catch (err) {
      console.error('Error in User.update:', err);
      throw err;
    }
  }

  static async activate(id, token) {
    try {
      const query = `
        UPDATE users 
        SET is_active = 1, activation_token = NULL 
        WHERE id = ? AND activation_token = ?
      `;
      const [result] = await db.execute(query, [id, token]);
      return result.affectedRows > 0;
    } catch (err) {
      console.error('Error in User.activate:', err);
      throw err;
    }
  }

  static async delete(id) {
    try {
      const query = 'DELETE FROM users WHERE id = ?';
      const [result] = await db.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (err) {
      console.error('Error in User.delete:', err);
      throw err;
    }
  }
}

module.exports = User; 