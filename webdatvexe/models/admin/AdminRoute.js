const mysql = require('mysql2');
const connection = require('../../config/database');

class AdminRoute {
  static async findAll() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          r.*,
          COUNT(DISTINCT s.id) as total_schedules,
          COUNT(DISTINCT b.id) as total_bookings,
          SUM(b.seats) as total_seats_booked,
          SUM(b.total_price) as total_revenue
        FROM routes r
        LEFT JOIN schedules s ON r.id = s.route_id
        LEFT JOIN bookings b ON s.id = b.schedule_id
        GROUP BY r.id
        ORDER BY r.from_location, r.to_location
      `;
      
      connection.query(query, (err, results) => {
        if (err) reject(err);
        
        const routes = results.map(route => ({
          ...route,
          total_revenue: route.total_revenue ? parseFloat(route.total_revenue) : 0
        }));
        
        resolve(routes);
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          r.*,
          COUNT(DISTINCT s.id) as total_schedules,
          COUNT(DISTINCT b.id) as total_bookings,
          SUM(b.seats) as total_seats_booked,
          SUM(b.total_price) as total_revenue
        FROM routes r
        LEFT JOIN schedules s ON r.id = s.route_id
        LEFT JOIN bookings b ON s.id = b.schedule_id
        WHERE r.id = ?
        GROUP BY r.id
      `;
      
      connection.query(query, [id], (err, results) => {
        if (err) reject(err);
        
        if (results.length > 0) {
          const route = {
            ...results[0],
            total_revenue: results[0].total_revenue ? parseFloat(results[0].total_revenue) : 0
          };
          resolve(route);
        } else {
          resolve(null);
        }
      });
    });
  }

  static async create(routeData) {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO routes SET ?';
      connection.query(query, routeData, (err, result) => {
        if (err) reject(err);
        resolve(result.insertId);
      });
    });
  }

  static async update(id, routeData) {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE routes SET ? WHERE id = ?';
      connection.query(query, [routeData, id], (err, result) => {
        if (err) reject(err);
        resolve(result.affectedRows > 0);
      });
    });
  }

  static async delete(id) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM routes WHERE id = ?';
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
          COUNT(*) as total_routes,
          COUNT(DISTINCT from_location) as total_from_locations,
          COUNT(DISTINCT to_location) as total_to_locations,
          (
            SELECT COUNT(DISTINCT CONCAT(from_location, '-', to_location))
            FROM routes
          ) as total_unique_routes
        FROM routes
      `;
      
      connection.query(query, (err, results) => {
        if (err) reject(err);
        resolve(results[0]);
      });
    });
  }

  static async getMostPopularRoutes(limit = 5) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          r.id,
          r.from_location,
          r.to_location,
          COUNT(DISTINCT b.id) as total_bookings,
          SUM(b.seats) as total_seats_booked,
          SUM(b.total_price) as total_revenue
        FROM routes r
        LEFT JOIN schedules s ON r.id = s.route_id
        LEFT JOIN bookings b ON s.id = b.schedule_id
        GROUP BY r.id
        ORDER BY total_bookings DESC
        LIMIT ?
      `;
      
      connection.query(query, [limit], (err, results) => {
        if (err) reject(err);
        
        const routes = results.map(route => ({
          ...route,
          total_revenue: route.total_revenue ? parseFloat(route.total_revenue) : 0
        }));
        
        resolve(routes);
      });
    });
  }
}

module.exports = AdminRoute; 