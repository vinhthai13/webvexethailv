const mysql = require('mysql2');
const connection = require('../../config/database');

class AdminBooking {
  static async findAll(filters = {}) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT 
          b.id,
          b.user_id,
          b.schedule_id,
          b.seats,
          b.total_price,
          bs.code as status_code,
          bs.name as status_name,
          bs.color as status_color,
          b.booking_date,
          b.booking_time,
          b.customer_name,
          b.phone,
          b.email,
          b.created_at,
          s.departure_time,
          s.arrival_time,
          s.bus_type,
          r.from_location,
          r.to_location,
          u.username as booked_by
        FROM bookings b
        LEFT JOIN booking_status bs ON b.status_id = bs.id
        LEFT JOIN schedules s ON b.schedule_id = s.id
        LEFT JOIN routes r ON s.route_id = r.id
        LEFT JOIN users u ON b.user_id = u.id
        WHERE 1=1
      `;
      
      const values = [];
      
      if (filters.status) {
        query += ' AND bs.code = ?';
        values.push(filters.status);
      }
      
      if (filters.date) {
        query += ' AND DATE(b.booking_date) = ?';
        values.push(filters.date);
      }
      
      if (filters.from) {
        query += ' AND r.from_location LIKE ?';
        values.push(`%${filters.from}%`);
      }
      
      if (filters.to) {
        query += ' AND r.to_location LIKE ?';
        values.push(`%${filters.to}%`);
      }
      
      query += ' ORDER BY b.created_at DESC';
      
      connection.query(query, values, (err, results) => {
        if (err) reject(err);
        
        // Format data
        const bookings = results.map(booking => ({
          ...booking,
          total_price: parseFloat(booking.total_price),
          departure_time: booking.departure_time ? new Date(booking.departure_time).toISOString() : null,
          arrival_time: booking.arrival_time ? new Date(booking.arrival_time).toISOString() : null,
          booking_date: booking.booking_date ? new Date(booking.booking_date).toISOString().split('T')[0] : null,
          created_at: new Date(booking.created_at).toISOString()
        }));
        
        resolve(bookings);
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          b.*,
          s.departure_time,
          s.arrival_time,
          s.bus_type,
          s.price as ticket_price,
          r.from_location,
          r.to_location,
          u.username as booked_by,
          bs.code as status_code,
          bs.name as status_name,
          bs.color as status_color
        FROM bookings b
        LEFT JOIN schedules s ON b.schedule_id = s.id
        LEFT JOIN routes r ON s.route_id = r.id
        LEFT JOIN users u ON b.user_id = u.id
        LEFT JOIN booking_status bs ON b.status_id = bs.id
        WHERE b.id = ?
      `;
      
      connection.query(query, [id], (err, results) => {
        if (err) reject(err);
        
        if (results.length > 0) {
          const booking = {
            ...results[0],
            total_price: parseFloat(results[0].total_price),
            departure_time: results[0].departure_time ? new Date(results[0].departure_time).toISOString() : null,
            arrival_time: results[0].arrival_time ? new Date(results[0].arrival_time).toISOString() : null,
            booking_date: results[0].booking_date ? new Date(results[0].booking_date).toISOString().split('T')[0] : null,
            created_at: new Date(results[0].created_at).toISOString()
          };
          resolve(booking);
        } else {
          resolve(null);
        }
      });
    });
  }

  static async updateStatus(id, statusId) {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE bookings SET status_id = ? WHERE id = ?';
      connection.query(query, [statusId, id], (err, result) => {
        if (err) reject(err);
        resolve(result.affectedRows > 0);
      });
    });
  }

  static async delete(id) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM bookings WHERE id = ?';
      connection.query(query, [id], (err, result) => {
        if (err) reject(err);
        resolve(result.affectedRows > 0);
      });
    });
  }

  static async getStats() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          bs.code as status,
          COUNT(*) as total_bookings,
          SUM(b.seats) as total_seats,
          SUM(b.total_price) as total_revenue
        FROM bookings b
        JOIN booking_status bs ON b.status_id = bs.id
        GROUP BY bs.code
      `;
      
      connection.query(query, (err, results) => {
        if (err) reject(err);
        
        const stats = results.map(stat => ({
          ...stat,
          total_revenue: parseFloat(stat.total_revenue)
        }));
        
        resolve(stats);
      });
    });
  }
}

module.exports = AdminBooking; 