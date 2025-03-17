const mysql = require('mysql2');
const connection = require('../../config/database');

class AdminSchedule {
  static async findAll() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          schedules.*,
          routes.from_location,
          routes.to_location,
          COUNT(bookings.id) as total_bookings,
          SUM(bookings.seats) as total_seats_booked
        FROM schedules
        JOIN routes ON schedules.route_id = routes.id
        LEFT JOIN bookings ON schedules.id = bookings.schedule_id
        GROUP BY schedules.id
        ORDER BY schedules.departure_time DESC
      `;
      
      connection.query(query, (err, results) => {
        if (err) reject(err);
        resolve(results);
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          schedules.*,
          routes.from_location,
          routes.to_location,
          COUNT(bookings.id) as total_bookings,
          SUM(bookings.seats) as total_seats_booked
        FROM schedules
        JOIN routes ON schedules.route_id = routes.id
        LEFT JOIN bookings ON schedules.id = bookings.schedule_id
        WHERE schedules.id = ?
        GROUP BY schedules.id
      `;
      
      connection.query(query, [id], (err, results) => {
        if (err) reject(err);
        resolve(results[0]);
      });
    });
  }

  static async create(scheduleData) {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO schedules SET ?';
      connection.query(query, scheduleData, (err, result) => {
        if (err) reject(err);
        resolve(result.insertId);
      });
    });
  }

  static async update(id, scheduleData) {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE schedules SET ? WHERE id = ?';
      connection.query(query, [scheduleData, id], (err, result) => {
        if (err) reject(err);
        resolve(result.affectedRows > 0);
      });
    });
  }

  static async delete(id) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM schedules WHERE id = ?';
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
          COUNT(*) as total_schedules,
          SUM(available_seats) as total_available_seats,
          AVG(price) as average_price,
          COUNT(DISTINCT route_id) as total_routes
        FROM schedules
      `;
      
      connection.query(query, (err, results) => {
        if (err) reject(err);
        
        if (results.length > 0) {
          const stats = {
            ...results[0],
            average_price: parseFloat(results[0].average_price)
          };
          resolve(stats);
        } else {
          resolve(null);
        }
      });
    });
  }
}

module.exports = AdminSchedule; 