const db = require('../config/database');

class Search {
  static async searchRoutes(from, to) {
    try {
      let sql = `
        SELECT 
          id,
          from_location,
          to_location,
          distance,
          duration,
          description,
          price
        FROM routes
        WHERE 1=1
      `;
      
      const params = [];

      if (from && from !== '') {
        sql += ` AND from_location = ?`;
        params.push(from);
      }

      if (to && to !== '') {
        sql += ` AND to_location = ?`;
        params.push(to);
      }

      sql += ` ORDER BY from_location ASC`;

      const [results] = await db.execute(sql, params);
      return results;
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  static async getLocations() {
    try {
      const [fromLocations] = await db.execute('SELECT DISTINCT from_location FROM routes ORDER BY from_location ASC');
      const [toLocations] = await db.execute('SELECT DISTINCT to_location FROM routes ORDER BY to_location ASC');
      
      return {
        fromLocations: fromLocations.map(row => row.from_location),
        toLocations: toLocations.map(row => row.to_location)
      };
    } catch (error) {
      console.error('Get locations error:', error);
      throw error;
    }
  }
}

module.exports = Search; 