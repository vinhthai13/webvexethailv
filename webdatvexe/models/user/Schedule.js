const db = require('../../config/database');

class Schedule {
  static async findAll() {
    try {
      const query = `
        SELECT s.*, 
          r.from_location, 
          r.to_location, 
          r.duration, 
          r.distance,
          r.image,
          DATE_FORMAT(s.date, '%d/%m/%Y') as formatted_date,
          TIME_FORMAT(s.departure_time, '%H:%i') as formatted_departure_time,
          TIME_FORMAT(s.arrival_time, '%H:%i') as formatted_arrival_time,
          (SELECT COUNT(*) FROM bookings b WHERE b.schedule_id = s.id) as booked_seats
        FROM schedules s
        JOIN routes r ON s.route_id = r.id
        ORDER BY s.date DESC, s.departure_time ASC
      `;
      const [schedules] = await db.execute(query);
      return schedules;
    } catch (err) {
      console.error('Error in Schedule.findAll:', err);
      throw new Error('Không thể lấy danh sách lịch trình');
    }
  }

  static async findById(id) {
    if (id === undefined || id === null) {
      console.error('Schedule.findById called with invalid ID:', id);
      return null;
    }

    const query = `
      SELECT s.*, r.from_location, r.to_location, r.distance, r.duration, r.image
      FROM schedules s
      LEFT JOIN routes r ON s.route_id = r.id
      WHERE s.id = ?
    `;
    try {
      const [schedules] = await db.execute(query, [id]);
      return schedules[0];
    } catch (err) {
      console.error('Error in findById:', err);
      throw err;
    }
  }

  static async findByIdWithRoute(id) {
    const query = `
      SELECT s.*, tt.type_name as bus_type, tt.price,
             r.start_point, r.end_point, r.image
      FROM schedules s
      JOIN routes r ON s.route_id = r.id
      JOIN ticket_types tt ON s.ticket_type_id = tt.id
      WHERE s.id = ?
    `;
    const [schedules] = await db.execute(query, [id]);
    return schedules[0];
  }

  static async findByRouteId(routeId, date = null) {
    try {
      let query = `
        SELECT s.*, r.from_location, r.to_location, r.duration, r.distance, r.image,
               DATE_FORMAT(s.date, '%Y-%m-%d') as formatted_date,
               TIME_FORMAT(s.departure_time, '%H:%i') as formatted_departure_time,
               TIME_FORMAT(s.arrival_time, '%H:%i') as formatted_arrival_time
        FROM schedules s
        JOIN routes r ON s.route_id = r.id
        WHERE s.route_id = ?
        AND s.date >= CURDATE()
      `;
      const params = [routeId];

      if (date) {
        query += ' AND DATE(s.date) = DATE(?)';
        params.push(date);
      }

      query += ' ORDER BY s.date, s.departure_time';
      
      const [schedules] = await db.execute(query, params);
      return schedules.map(schedule => ({
        ...schedule,
        price: parseFloat(schedule.price) || 0,
        distance: parseInt(schedule.distance) || 0,
        available_seats: parseInt(schedule.available_seats) || 0,
        date: schedule.formatted_date,
        departure_time: schedule.formatted_departure_time,
        arrival_time: schedule.formatted_arrival_time
      }));
    } catch (err) {
      console.error('Error in Schedule.findByRouteId:', err);
      throw new Error('Không thể lấy danh sách lịch trình cho tuyến xe này');
    }
  }

  static async search({ from, to, date }) {
    try {
      let query = `
        SELECT s.*, 
          r.from_location, 
          r.to_location, 
          r.duration, 
          r.distance,
          r.image,
          DATE_FORMAT(s.date, '%d/%m/%Y') as formatted_date,
          TIME_FORMAT(s.departure_time, '%H:%i') as formatted_departure_time,
          TIME_FORMAT(s.arrival_time, '%H:%i') as formatted_arrival_time,
          (SELECT COUNT(*) FROM bookings b WHERE b.schedule_id = s.id) as booked_seats
        FROM schedules s
        JOIN routes r ON s.route_id = r.id
        WHERE 1=1
      `;
      const params = [];

      if (from) {
        query += ' AND r.from_location LIKE ?';
        params.push(`%${from}%`);
      }

      if (to) {
        query += ' AND r.to_location LIKE ?';
        params.push(`%${to}%`);
      }

      if (date) {
        query += ' AND DATE(s.date) = ?';
        params.push(date);
      }

      query += ' ORDER BY s.date DESC, s.departure_time ASC';
      
      const [schedules] = await db.execute(query, params);
      return schedules;
    } catch (err) {
      console.error('Error in Schedule.search:', err);
      throw new Error('Không thể tìm kiếm lịch trình');
    }
  }

  static async updateAvailableSeats(id, amount) {
    const query = `
      UPDATE schedules 
      SET available_seats = available_seats + ? 
      WHERE id = ?
    `;
    await db.execute(query, [amount, id]);
  }

  static async getStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_schedules,
          COUNT(DISTINCT route_id) as total_routes,
          SUM(available_seats) as total_seats,
          AVG(price) as avg_price,
          MIN(price) as min_price,
          MAX(price) as max_price
        FROM schedules
      `;
      const [results] = await db.execute(query);
      return results[0];
    } catch (err) {
      console.error('Error in Schedule.getStats:', err);
      throw new Error('Không thể lấy thống kê lịch trình');
    }
  }

  static async updateSeats(id, seats) {
    const query = `
      UPDATE schedules 
      SET available_seats = available_seats - ? 
      WHERE id = ? AND available_seats >= ?
    `;
    try {
      const [result] = await db.execute(query, [seats, id, seats]);
      return result.affectedRows > 0;
    } catch (err) {
      console.error('Error in updateSeats:', err);
      throw err;
    }
  }
}

module.exports = Schedule; 