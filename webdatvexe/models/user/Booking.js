const db = require('../../config/database');

/**
 * Generate a random booking code
 * @returns {string} Random booking code in format BK-XXXXXX
 */
const generateRandomBookingCode = () => {
  // Sử dụng timestamp để đảm bảo tính duy nhất
  const timestamp = new Date().getTime().toString().slice(-6);
  
  // Tạo chuỗi chữ cái ngẫu nhiên (2 ký tự)
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let randomChars = '';
  for (let i = 0; i < 2; i++) {
    randomChars += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  // Tạo chuỗi số ngẫu nhiên (4 chữ số)
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  
  // Kết hợp: VD-AB1234
  return `VD-${randomChars}${randomNum}`;
};

class Booking {
  static async create(data) {
    const booking_code = generateRandomBookingCode();
    
    // Tạo đối tượng Date theo múi giờ Việt Nam (UTC+7)
    const now = new Date();
    const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // Thêm 7 giờ để chuyển về múi giờ GMT+7
    
    // Format ngày tháng theo định dạng YYYY-MM-DD
    const bookingDate = vietnamTime.toISOString().split('T')[0];
    
    // Format thời gian theo định dạng HH:MM:SS
    const hours = vietnamTime.getUTCHours().toString().padStart(2, '0');
    const minutes = vietnamTime.getUTCMinutes().toString().padStart(2, '0');
    const seconds = vietnamTime.getUTCSeconds().toString().padStart(2, '0');
    const bookingTime = `${hours}:${minutes}:${seconds}`;
    
    const query = `
      INSERT INTO bookings (
        user_id, schedule_id, seats, total_price,
        booking_date, booking_time,
        customer_name, phone, email,
        booking_code, created_at, status_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 1)
    `;

    try {
      const [result] = await db.execute(query, [
        data.user_id,
        data.schedule_id,
        data.seats,
        data.total_price,
        bookingDate,
        bookingTime,
        data.customer_name,
        data.phone,
        data.email,
        booking_code
      ]);
      return result.insertId;
    } catch (err) {
      console.error('Error in create booking:', err);
      throw err;
    }
  }

  static async findById(id) {
    // Check if id is undefined or null
    if (id === undefined || id === null) {
      console.error('Booking.findById called with invalid ID:', id);
      return null;
    }

    const query = `
      SELECT b.*, s.departure_time, s.price,
             r.from_location, r.to_location,
             bs.name as status_name
      FROM bookings b
      JOIN schedules s ON b.schedule_id = s.id
      JOIN routes r ON s.route_id = r.id
      JOIN booking_status bs ON b.status_id = bs.id
      WHERE b.id = ?
    `;
    
    try {
      const [bookings] = await db.execute(query, [id]);
      return bookings[0];
    } catch (err) {
      console.error('Error in Booking.findById:', err);
      throw err;
    }
  }

  static async findByUserId(userId) {
    const query = `
      SELECT b.*, s.departure_time, s.price,
             r.from_location, r.to_location,
             bs.name as status_name
      FROM bookings b
      JOIN schedules s ON b.schedule_id = s.id
      JOIN routes r ON s.route_id = r.id
      JOIN booking_status bs ON b.status_id = bs.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `;

    try {
      const [bookings] = await db.execute(query, [userId]);
      return bookings;
    } catch (err) {
      console.error('Error in findByUserId:', err);
      throw err;
    }
  }

  static async updateStatus(id, statusId) {
    const query = 'UPDATE bookings SET status_id = ? WHERE id = ?';
    const [result] = await db.execute(query, [statusId, id]);
    return result.affectedRows > 0;
  }
}

module.exports = Booking; 