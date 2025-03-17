const db = require('../../config/database');

class AdminBookingModel {
  async getAllBookings() {
    const [bookings] = await db.query(`
      SELECT b.*, 
        bs.name as status_name,
        bs.color as status_color,
        r.from_location,
        r.to_location,
        u.username as customer_name,
        b.seats,
        (SELECT COUNT(*) FROM bookings WHERE user_id = b.user_id) as user_booking_count
      FROM bookings b
      JOIN booking_status bs ON b.status_id = bs.id
      JOIN schedules s ON b.schedule_id = s.id
      JOIN routes r ON s.route_id = r.id
      LEFT JOIN users u ON b.user_id = u.id
      ORDER BY b.created_at DESC
    `);
    return bookings;
  }

  async getBookingById(id) {
    try {
      const [rows] = await db.query(`
        SELECT 
          b.*,
          r.from_location, r.to_location, r.duration as route_duration, r.distance,
          DATE_FORMAT(s.date, '%d/%m/%Y') as schedule_date,
          DATE_FORMAT(s.departure_time, '%H:%i') as departure_time_formatted,
          DATE_FORMAT(s.arrival_time, '%H:%i') as arrival_time_formatted,
          s.departure_time, s.arrival_time, s.date,
          TIMEDIFF(s.arrival_time, s.departure_time) as travel_time,
          u.username, u.email as user_email
        FROM bookings b
        LEFT JOIN schedules s ON b.schedule_id = s.id
        LEFT JOIN routes r ON s.route_id = r.id
        LEFT JOIN users u ON b.user_id = u.id
        WHERE b.id = ?
      `, [id]);
      
      if (rows.length > 0) {
        const booking = rows[0];
        
        // Thêm thông tin trạng thái
        booking.status_name = this.getStatusName(booking.status_id);
        booking.status_color = this.getStatusColor(booking.status_id);
        
        // Định dạng thời gian khởi hành
        if (booking.schedule_date && booking.departure_time_formatted && booking.arrival_time_formatted) {
          booking.formatted_time_range = `${booking.schedule_date} ${booking.departure_time_formatted} - ${booking.arrival_time_formatted}`;
        } else if (booking.departure_time && booking.arrival_time) {
          booking.formatted_time_range = `${booking.departure_time} - ${booking.arrival_time}`;
        }
        
        // Tính thời gian di chuyển
        if (booking.departure_time && booking.arrival_time) {
          try {
            const dep = new Date(`1970-01-01T${booking.departure_time_formatted}`);
            const arr = new Date(`1970-01-01T${booking.arrival_time_formatted}`);
            
            let diffMinutes = (arr - dep) / 60000;
            if (diffMinutes < 0) {
              diffMinutes += 24 * 60; // Cộng thêm 24h cho chuyến qua đêm
            }
            
            const hours = Math.floor(diffMinutes / 60);
            const minutes = Math.floor(diffMinutes % 60);
            
            if (hours > 0) {
              booking.travel_time_formatted = `${hours} giờ ${minutes > 0 ? minutes + ' phút' : ''}`;
            } else {
              booking.travel_time_formatted = `${minutes} phút`;
            }
          } catch (err) {
            console.error('Error calculating travel time:', err);
            booking.travel_time_formatted = booking.route_duration || '1 phút';
          }
        } else {
          booking.travel_time_formatted = booking.route_duration || '1 phút';
        }
        
        return booking;
      }
      return null;
    } catch (err) {
      console.error('Error getting booking details:', err);
      throw err;
    }
  }

  async getAllBookingStatuses() {
    return [
      { id: 1, name: 'Chờ xác nhận' },
      { id: 2, name: 'Đã xác nhận' },
      { id: 3, name: 'Đã hủy' },
      { id: 4, name: 'Hoàn thành' }
    ];
  }

  async updateBookingStatus(id, statusId) {
    await db.query(`
      UPDATE bookings 
      SET status_id = ?
      WHERE id = ?
    `, [statusId, id]);
  }

  async deleteBooking(id) {
    await db.query('DELETE FROM bookings WHERE id = ?', [id]);
  }

  async bulkUpdateBookingStatus(bookingIds, statusId) {
    // Chuyển đổi mảng id thành chuỗi placeholders (?, ?, ?)
    const placeholders = bookingIds.map(() => '?').join(',');
    
    await db.query(`
      UPDATE bookings 
      SET status_id = ?
      WHERE id IN (${placeholders})
    `, [statusId, ...bookingIds]);
    
    return { updated: bookingIds.length };
  }

  // Lấy thông tin đặt vé kèm thông tin tuyến đường
  async getBookingWithRouteDetails(id) {
    try {
      const [rows] = await db.query(`
        SELECT b.*, 
          r.from_location, r.to_location, r.duration as route_duration, r.distance, 
          s.departure_time, s.arrival_time,
          u.username AS user_username,
          CASE 
            WHEN b.status_id = 1 THEN 'Chờ xác nhận'
            WHEN b.status_id = 2 THEN 'Đã xác nhận'
            WHEN b.status_id = 3 THEN 'Đã hủy'
            WHEN b.status_id = 4 THEN 'Hoàn thành'
            ELSE 'Không xác định'
          END AS status_name,
          CASE 
            WHEN b.status_id = 1 THEN 'warning'
            WHEN b.status_id = 2 THEN 'success'
            WHEN b.status_id = 3 THEN 'danger'
            WHEN b.status_id = 4 THEN 'info'
            ELSE 'secondary'
          END AS status_color
        FROM bookings b
        JOIN schedules s ON b.schedule_id = s.id
        JOIN routes r ON s.route_id = r.id
        LEFT JOIN users u ON b.user_id = u.id
        WHERE b.id = ?
      `, [id]);
      
      return rows[0];
    } catch (err) {
      console.error('Error getting booking details with route:', err);
      throw err;
    }
  }

  // Hàm hỗ trợ xác định màu dựa trên trạng thái
  getStatusColor(statusId) {
    switch (parseInt(statusId)) {
      case 1: return 'warning';  // Chờ xác nhận
      case 2: return 'success';  // Đã xác nhận
      case 3: return 'danger';   // Đã hủy
      case 4: return 'info';     // Hoàn thành
      default: return 'secondary';
    }
  }

  // Hàm hỗ trợ xác định tên trạng thái
  getStatusName(statusId) {
    switch (parseInt(statusId)) {
      case 1: return 'Chờ xác nhận';
      case 2: return 'Đã xác nhận';
      case 3: return 'Đã hủy';
      case 4: return 'Hoàn thành';
      default: return 'Không xác định';
    }
  }

  // Hàm hỗ trợ chuyển đổi chuỗi thời gian sang phút
  extractMinutes(durationString) {
    if (!durationString) return 1; // Mặc định 1 phút nếu không có dữ liệu
    
    // Xử lý các dạng thời gian khác nhau
    if (typeof durationString === 'number') return durationString;
    
    // Trường hợp chỉ là số
    if (/^\d+$/.test(durationString)) return parseInt(durationString);
    
    // Trường hợp "X giờ"
    const hourMatch = durationString.match(/(\d+)\s*gi[ờơở]/i);
    if (hourMatch) {
      return parseInt(hourMatch[1]) * 60;
    }
    
    // Trường hợp "X phút"
    const minuteMatch = durationString.match(/(\d+)\s*ph[úùư]t/i);
    if (minuteMatch) {
      return parseInt(minuteMatch[1]);
    }
    
    return 1; // Mặc định 1 phút
  }
}

module.exports = new AdminBookingModel(); 