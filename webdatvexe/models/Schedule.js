const db = require('../config/database');

class Schedule {
  constructor(data) {
    this.id = data.id;
    this.route_id = data.route_id;
    this.departure_date = data.departure_date;
    this.departure_time = data.departure_time;
    this.vehicle_type = data.vehicle_type;
    this.available_seats = data.available_seats;
    this.price = data.price;
  }

  static async getUpcoming() {
    const sql = `
      SELECT s.*, r.from_location, r.to_location 
      FROM schedules s
      JOIN routes r ON s.route_id = r.id
      WHERE s.departure_date >= CURDATE()
      ORDER BY s.departure_date, s.departure_time
    `;
    const [schedules] = await db.execute(sql);
    return schedules;
  }

  static async search({ from, to, date }) {
    let sql = `
      SELECT s.*, r.from_location, r.to_location 
      FROM schedules s
      JOIN routes r ON s.route_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (from) {
      sql += ` AND r.from_location = ?`;
      params.push(from);
    }
    if (to) {
      sql += ` AND r.to_location = ?`;
      params.push(to);
    }
    if (date) {
      sql += ` AND s.departure_date = ?`;
      params.push(date);
    }

    sql += ` ORDER BY s.departure_date, s.departure_time`;

    const [schedules] = await db.execute(sql, params);
    return schedules;
  }

  static async getById(id) {
    const sql = `
      SELECT s.*, r.from_location, r.to_location 
      FROM schedules s
      JOIN routes r ON s.route_id = r.id
      WHERE s.id = ?
    `;
    const [schedules] = await db.execute(sql, [id]);
    return schedules[0];
  }
}

module.exports = Schedule; 