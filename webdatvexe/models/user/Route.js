const db = require('../../config/database');

class Route {
  static async findAll() {
    try {
      const query = `
        SELECT r.*, 
          COUNT(DISTINCT s.id) as trip_count,
          MIN(s.price) as min_price,
          r.duration,
          r.image
        FROM routes r
        LEFT JOIN schedules s ON s.route_id = r.id AND s.date >= CURDATE()
        GROUP BY r.id, r.from_location, r.to_location, r.distance, r.duration, r.image
        ORDER BY r.from_location, r.to_location
      `;
      const [routes] = await db.execute(query);
      return routes.map(route => ({
        ...route,
        min_price: route.min_price || 0,
        trip_count: route.trip_count || 0,
        distance: parseInt(route.distance) || 0
      }));
    } catch (err) {
      console.error('Error in Route.findAll:', err);
      throw new Error('Không thể lấy danh sách tuyến xe');
    }
  }

  static async findById(id) {
    if (id === undefined || id === null) {
      console.error('Route.findById called with invalid ID:', id);
      return null;
    }

    try {
      const query = `
        SELECT r.*, 
          COUNT(DISTINCT s.id) as trip_count,
          MIN(s.price) as min_price,
          GROUP_CONCAT(DISTINCT s.bus_type) as bus_types,
          r.image
        FROM routes r
        LEFT JOIN schedules s ON s.route_id = r.id AND s.date >= CURDATE()
        WHERE r.id = ?
        GROUP BY r.id, r.from_location, r.to_location, r.distance, r.duration, r.image
      `;
      const [routes] = await db.execute(query, [id]);
      if (routes.length === 0) return null;
      
      const route = routes[0];
      return {
        ...route,
        min_price: route.min_price || 0,
        trip_count: route.trip_count || 0,
        distance: parseInt(route.distance) || 0,
        bus_types: route.bus_types ? route.bus_types.split(',') : []
      };
    } catch (err) {
      console.error('Error in Route.findById:', err);
      throw new Error('Không thể tìm thấy tuyến xe');
    }
  }

  static async getLocations() {
    try {
      const query = `
        SELECT DISTINCT from_location as location FROM routes
        UNION
        SELECT DISTINCT to_location as location FROM routes
        ORDER BY location
      `;
      const [results] = await db.execute(query);
      return results.map(row => row.location);
    } catch (err) {
      console.error('Error in Route.getLocations:', err);
      throw new Error('Không thể lấy danh sách địa điểm');
    }
  }

  static async search({ from, to }) {
    try {
      const query = `
        SELECT r.*, 
          COUNT(DISTINCT s.id) as trip_count,
          MIN(s.price) as min_price,
          r.image
        FROM routes r
        LEFT JOIN schedules s ON s.route_id = r.id AND s.date >= CURDATE()
        WHERE (? IS NULL OR r.from_location LIKE ?)
          AND (? IS NULL OR r.to_location LIKE ?)
        GROUP BY r.id, r.from_location, r.to_location, r.distance, r.duration, r.image
        ORDER BY r.from_location, r.to_location
      `;
      
      const fromTerm = from ? `%${from}%` : null;
      const toTerm = to ? `%${to}%` : null;
      
      const [routes] = await db.execute(query, [fromTerm, fromTerm, toTerm, toTerm]);
      return routes.map(route => ({
        ...route,
        min_price: route.min_price || 0,
        trip_count: route.trip_count || 0,
        distance: parseInt(route.distance) || 0
      }));
    } catch (err) {
      console.error('Error in Route.search:', err);
      throw new Error('Không thể tìm kiếm tuyến xe');
    }
  }
}

module.exports = Route; 