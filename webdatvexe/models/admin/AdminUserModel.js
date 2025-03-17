const db = require('../../config/database');
const bcrypt = require('bcrypt');

class AdminUserModel {
  async getAllUsers() {
    const [users] = await db.execute(`
      SELECT u.*, 
        COUNT(DISTINCT b.id) as booking_count,
        SUM(CASE WHEN b.status_id IN (1, 2, 4) THEN b.total_price ELSE 0 END) as total_spent
      FROM users u
      LEFT JOIN bookings b ON u.id = b.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    return users;
  }

  async getUserById(id) {
    const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
    return users[0];
  }

  async getUserWithBookings(id) {
    const [users] = await db.execute(`
      SELECT u.*, 
        COUNT(DISTINCT b.id) as booking_count,
        SUM(CASE WHEN b.status_id IN (1, 2, 4) THEN b.total_price ELSE 0 END) as total_spent
      FROM users u
      LEFT JOIN bookings b ON u.id = b.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `, [id]);

    if (users.length === 0) {
      return null;
    }

    const [bookings] = await db.execute(`
      SELECT b.*, 
        bs.name as status_name, 
        bs.color as status_color,
        r.from_location,
        r.to_location,
        s.departure_time
      FROM bookings b
      JOIN booking_status bs ON b.status_id = bs.id
      JOIN schedules s ON b.schedule_id = s.id
      JOIN routes r ON s.route_id = r.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `, [id]);

    return {
      ...users[0],
      bookings
    };
  }

  async checkUsernameExists(username, excludeId = null) {
    const query = excludeId 
      ? 'SELECT id FROM users WHERE username = ? AND id != ?'
      : 'SELECT id FROM users WHERE username = ?';
    const params = excludeId ? [username, excludeId] : [username];
    const [users] = await db.execute(query, params);
    return users.length > 0;
  }

  async checkEmailExists(email, excludeId = null) {
    const query = excludeId
      ? 'SELECT id FROM users WHERE email = ? AND id != ?'
      : 'SELECT id FROM users WHERE email = ?';
    const params = excludeId ? [email, excludeId] : [email];
    const [users] = await db.execute(query, params);
    return users.length > 0;
  }

  async createUser(userData) {
    const { username, email, phone, password } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await db.execute(
      'INSERT INTO users (username, email, phone, password) VALUES (?, ?, ?, ?)',
      [username, email, phone, hashedPassword]
    );
    return result.insertId;
  }

  async updateUser(id, userData) {
    const { username, email, phone, password } = userData;
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.execute(
        'UPDATE users SET username = ?, email = ?, phone = ?, password = ? WHERE id = ?',
        [username, email, phone, hashedPassword, id]
      );
    } else {
      await db.execute(
        'UPDATE users SET username = ?, email = ?, phone = ? WHERE id = ?',
        [username, email, phone, id]
      );
    }
  }

  async hasBookings(userId) {
    const [bookings] = await db.execute(
      'SELECT COUNT(*) as count FROM bookings WHERE user_id = ?',
      [userId]
    );
    return bookings[0].count > 0;
  }

  async deleteUser(id) {
    await db.execute('DELETE FROM users WHERE id = ?', [id]);
  }

  async findById(id) {
    const [admins] = await db.execute('SELECT * FROM admins WHERE id = ?', [id]);
    return admins[0];
  }

  async updateById(id, data) {
    const { name, email, password } = data;
    
    if (password) {
      await db.execute(
        'UPDATE admins SET name = ?, email = ?, password = ? WHERE id = ?',
        [name, email, password, id]
      );
    } else {
      await db.execute(
        'UPDATE admins SET name = ?, email = ? WHERE id = ?',
        [name, email, id]
      );
    }
  }
}

module.exports = new AdminUserModel(); 