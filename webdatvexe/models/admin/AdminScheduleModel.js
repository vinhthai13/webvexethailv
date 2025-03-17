const db = require('../../config/database');

class AdminScheduleModel {
  async getAllSchedules() {
    try {
      const query = `
        SELECT s.*, 
          r.from_location, 
          r.to_location,
          DATE_FORMAT(s.date, '%Y-%m-%d') as date,
          TIME_FORMAT(s.departure_time, '%H:%i') as departure_time,
          TIME_FORMAT(s.arrival_time, '%H:%i') as arrival_time,
          COUNT(b.id) as total_bookings
        FROM schedules s
        JOIN routes r ON s.route_id = r.id
        LEFT JOIN bookings b ON s.id = b.schedule_id
        GROUP BY s.id
        ORDER BY s.date DESC, s.departure_time DESC
      `;
      const [schedules] = await db.query(query);
      return schedules;
    } catch (error) {
      console.error('Error getting all schedules:', error);
      throw error;
    }
  }

  async getScheduleById(id) {
    const [schedules] = await db.query(`
      SELECT s.*,
        DATE_FORMAT(s.date, '%Y-%m-%d') as formatted_date,
        DATE_FORMAT(s.departure_time, '%H:%i') as formatted_departure_time,
        DATE_FORMAT(s.arrival_time, '%H:%i') as formatted_arrival_time
      FROM schedules s 
      WHERE s.id = ?
    `, [id]);
    return schedules[0];
  }

  async getAllRoutes() {
    const [routes] = await db.query('SELECT * FROM routes ORDER BY from_location');
    return routes;
  }

  async createSchedule(scheduleData) {
    const { route_id, date, departure_time, arrival_time, bus_type, price, available_seats } = scheduleData;
    
    // Validate date and time formats
    if (!this.isValidDate(date)) {
      throw new Error('Định dạng ngày không hợp lệ');
    }
    if (!this.isValidTime(departure_time) || !this.isValidTime(arrival_time)) {
      throw new Error('Định dạng thời gian không hợp lệ');
    }

    const [result] = await db.query(`
      INSERT INTO schedules 
      (route_id, date, departure_time, arrival_time, bus_type, price, available_seats)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [route_id, date, departure_time, arrival_time, bus_type, price, available_seats]);
    return result.insertId;
  }

  async updateSchedule(id, scheduleData) {
    const { route_id, date, departure_time, arrival_time, bus_type, price, available_seats } = scheduleData;

    // Validate date and time formats
    if (!this.isValidDate(date)) {
      throw new Error('Định dạng ngày không hợp lệ');
    }
    if (!this.isValidTime(departure_time) || !this.isValidTime(arrival_time)) {
      throw new Error('Định dạng thời gian không hợp lệ');
    }

    // Check if schedule has any bookings
    const [bookings] = await db.query(
      'SELECT COUNT(*) as count FROM bookings WHERE schedule_id = ?',
      [id]
    );

    if (bookings[0].count > 0) {
      // If has bookings, only allow updating price and available seats
      await db.query(`
        UPDATE schedules 
        SET price = ?, available_seats = ?
        WHERE id = ?
      `, [price, available_seats, id]);
    } else {
      // If no bookings, allow updating all fields
      await db.query(`
        UPDATE schedules 
        SET route_id = ?, date = ?, departure_time = ?, arrival_time = ?, 
            bus_type = ?, price = ?, available_seats = ?
        WHERE id = ?
      `, [route_id, date, departure_time, arrival_time, bus_type, price, available_seats, id]);
    }
  }

  async deleteSchedule(id) {
    // Check if schedule has any bookings
    const [bookings] = await db.query(
      'SELECT COUNT(*) as count FROM bookings WHERE schedule_id = ?',
      [id]
    );

    if (bookings[0].count > 0) {
      throw new Error('Không thể xóa lịch trình đã có đặt vé');
    }

    await db.query('DELETE FROM schedules WHERE id = ?', [id]);
  }

  async getScheduleStats() {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_schedules,
        COUNT(DISTINCT route_id) as total_routes,
        SUM(available_seats) as total_seats,
        AVG(price) as avg_price
      FROM schedules
    `);
    return stats[0];
  }

  async getUpcomingSchedules(limit = 5) {
    const [schedules] = await db.query(`
      SELECT s.*, 
        r.from_location, 
        r.to_location,
        COUNT(b.id) as booking_count
      FROM schedules s
      JOIN routes r ON s.route_id = r.id
      LEFT JOIN bookings b ON s.id = b.schedule_id
      WHERE s.date > NOW()
      GROUP BY s.id
      ORDER BY s.date ASC
      LIMIT ?
    `, [limit]);
    return schedules;
  }

  async getSchedulesByRoute(routeId) {
    const [schedules] = await db.query(`
      SELECT s.*, 
        COUNT(b.id) as booking_count
      FROM schedules s
      LEFT JOIN bookings b ON s.id = b.schedule_id
      WHERE s.route_id = ?
      GROUP BY s.id
      ORDER BY s.date DESC, s.departure_time DESC
    `, [routeId]);
    return schedules;
  }

  async getSchedulesByDate(date) {
    if (!this.isValidDate(date)) {
      throw new Error('Định dạng ngày không hợp lệ');
    }

    const [schedules] = await db.query(`
      SELECT s.*, 
        r.from_location, 
        r.to_location,
        COUNT(b.id) as total_bookings,
        DATE_FORMAT(s.date, '%Y-%m-%d') as formatted_date,
        DATE_FORMAT(s.departure_time, '%H:%i') as formatted_departure_time,
        DATE_FORMAT(s.arrival_time, '%H:%i') as formatted_arrival_time
      FROM schedules s
      JOIN routes r ON s.route_id = r.id
      LEFT JOIN bookings b ON s.id = b.schedule_id
      WHERE s.date = ?
      GROUP BY s.id
      ORDER BY s.departure_time ASC
    `, [date]);
    return schedules;
  }

  async getSchedulesByDateRange(startDate, endDate) {
    if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) {
      throw new Error('Định dạng ngày không hợp lệ');
    }

    const [schedules] = await db.query(`
      SELECT s.*, 
        r.from_location, 
        r.to_location,
        COUNT(b.id) as total_bookings,
        DATE_FORMAT(s.date, '%Y-%m-%d') as formatted_date,
        DATE_FORMAT(s.departure_time, '%H:%i') as formatted_departure_time,
        DATE_FORMAT(s.arrival_time, '%H:%i') as formatted_arrival_time
      FROM schedules s
      JOIN routes r ON s.route_id = r.id
      LEFT JOIN bookings b ON s.id = b.schedule_id
      WHERE s.date BETWEEN ? AND ?
      GROUP BY s.id
      ORDER BY s.date ASC, s.departure_time ASC
    `, [startDate, endDate]);
    return schedules;
  }

  // Helper method to validate date format (YYYY-MM-DD)
  isValidDate(date) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(date)) return false;
    
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
  }

  // Helper method to validate time format (HH:mm or HH:mm:ss)
  isValidTime(time) {
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    return regex.test(time);
  }
}

module.exports = new AdminScheduleModel(); 