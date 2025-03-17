const db = require('../../config/database');
const bcrypt = require('bcrypt');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.tokenUser.id;
    
    const [users] = await db.execute(
      'SELECT id, username, email, phone, full_name, created_at FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.error('User not found', 404);
    }
    
    return res.success(users[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.error('Error fetching profile', 500);
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.tokenUser.id;
    const { email, phone, full_name } = req.body;
    
    // Check if user exists
    const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.error('User not found', 404);
    }
    
    // Prepare update data
    const updates = [];
    const params = [];
    
    if (email) {
      // Check if email is already used by another user
      const [existingUsers] = await db.execute(
        'SELECT * FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );
      
      if (existingUsers.length > 0) {
        return res.error('Email is already in use', 400);
      }
      
      updates.push('email = ?');
      params.push(email);
    }
    
    if (phone) {
      updates.push('phone = ?');
      params.push(phone);
    }
    
    if (full_name) {
      updates.push('full_name = ?');
      params.push(full_name);
    }
    
    if (updates.length === 0) {
      return res.error('No fields to update', 400);
    }
    
    // Add userId to params
    params.push(userId);
    
    // Update user profile
    await db.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    // Get updated user profile
    const [updatedUsers] = await db.execute(
      'SELECT id, username, email, phone, full_name, created_at FROM users WHERE id = ?',
      [userId]
    );
    
    return res.success(updatedUsers[0], 'Profile updated successfully');
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.error('Error updating profile', 500);
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.tokenUser.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.error('Current password and new password are required', 400);
    }
    
    // Check if user exists
    const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.error('User not found', 404);
    }
    
    const user = users[0];
    
    // Check current password
    let passwordMatch = false;
    
    // Try direct comparison first (for non-hashed passwords)
    if (currentPassword === user.password) {
      passwordMatch = true;
    } 
    // If direct comparison fails, try bcrypt compare (for hashed passwords)
    else if (user.password.startsWith('$2')) {
      passwordMatch = await bcrypt.compare(currentPassword, user.password);
    }
    
    if (!passwordMatch) {
      return res.error('Current password is incorrect', 400);
    }
    
    // Hash new password if needed
    let hashedPassword = newPassword;
    if (!process.env.DISABLE_PASSWORD_HASHING) {
      hashedPassword = await bcrypt.hash(newPassword, 10);
    }
    
    // Update password
    await db.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );
    
    return res.success(null, 'Password changed successfully');
  } catch (error) {
    console.error('Error changing password:', error);
    return res.error('Error changing password', 500);
  }
};

// Get user bookings
exports.getBookings = async (req, res) => {
  try {
    const userId = req.tokenUser.id;
    
    const [bookings] = await db.execute(`
      SELECT 
        b.id, b.schedule_id, b.passenger_name, b.passenger_phone, 
        b.seat_number, b.status, b.created_at, b.ticket_price,
        s.departure_date, s.departure_time, s.vehicle_type,
        r.from_location, r.to_location
      FROM 
        bookings b
        JOIN schedules s ON b.schedule_id = s.id
        JOIN routes r ON s.route_id = r.id
      WHERE 
        b.user_id = ?
      ORDER BY 
        s.departure_date DESC, s.departure_time DESC
    `, [userId]);
    
    return res.success(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.error('Error fetching bookings', 500);
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const userId = req.tokenUser.id;
    const { bookingId } = req.params;
    
    // Check if booking exists and belongs to user
    const [bookings] = await db.execute(
      'SELECT * FROM bookings WHERE id = ? AND user_id = ?',
      [bookingId, userId]
    );
    
    if (bookings.length === 0) {
      return res.error('Booking not found', 404);
    }
    
    const booking = bookings[0];
    
    // Check if booking can be cancelled (only if status is 'pending' or 'confirmed')
    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      return res.error('Booking cannot be cancelled', 400);
    }
    
    // Get schedule information to update available seats
    const [schedules] = await db.execute(
      'SELECT * FROM schedules WHERE id = ?',
      [booking.schedule_id]
    );
    
    // Update booking status
    await db.execute(
      'UPDATE bookings SET status = ? WHERE id = ?',
      ['cancelled', bookingId]
    );
    
    // Increase available seats in schedule
    if (schedules.length > 0) {
      await db.execute(
        'UPDATE schedules SET available_seats = available_seats + 1 WHERE id = ?',
        [booking.schedule_id]
      );
    }
    
    return res.success(null, 'Booking cancelled successfully');
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return res.error('Error cancelling booking', 500);
  }
}; 