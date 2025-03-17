const db = require('../../config/database');

class AdminRouteModel {
  async getAllRoutes() {
    const [routes] = await db.query(`
      SELECT r.*,
        COUNT(DISTINCT s.id) as schedule_count,
        COUNT(DISTINCT b.id) as booking_count
      FROM routes r
      LEFT JOIN schedules s ON r.id = s.route_id
      LEFT JOIN bookings b ON s.id = b.schedule_id
      GROUP BY r.id
      ORDER BY r.from_location
    `);
    return routes;
  }

  async getRouteById(id) {
    const [routes] = await db.query('SELECT * FROM routes WHERE id = ?', [id]);
    return routes[0];
  }

  async checkDuplicateRoute(from_location, to_location, excludeId = null) {
    let query = 'SELECT id FROM routes WHERE from_location = ? AND to_location = ?';
    const params = [from_location, to_location];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const [routes] = await db.query(query, params);
    return routes.length > 0;
  }

  async createRoute(routeData) {
    try {
      const query = `
        INSERT INTO routes 
        (from_location, to_location, distance, duration, description, price, image)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        routeData.from_location,
        routeData.to_location,
        routeData.distance,
        routeData.duration,
        routeData.description,
        routeData.price,
        routeData.image
      ];

      const [result] = await db.execute(query, values);
      return result.insertId;
    } catch (error) {
      console.error('Error creating route:', error);
      throw error;
    }
  }

  async updateRoute(id, routeData) {
    try {
      const query = `
        UPDATE routes 
        SET from_location = ?,
            to_location = ?,
            distance = ?,
            duration = ?,
            description = ?,
            price = ?,
            image = ?
        WHERE id = ?
      `;

      const values = [
        routeData.from_location,
        routeData.to_location,
        routeData.distance,
        routeData.duration,
        routeData.description,
        routeData.price,
        routeData.image,
        id
      ];

      const [result] = await db.execute(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating route:', error);
      throw error;
    }
  }

  async deleteRoute(id) {
    // Check if route has any schedules
    const [schedules] = await db.query('SELECT id FROM schedules WHERE route_id = ? LIMIT 1', [id]);
    if (schedules.length > 0) {
      throw new Error('Không thể xóa tuyến xe đã có lịch trình');
    }

    await db.query('DELETE FROM routes WHERE id = ?', [id]);
  }
}

module.exports = new AdminRouteModel(); 