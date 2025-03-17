const db = require('../../config/database');
const Route = require('../../models/Route');
const Search = require('../../models/Search');

class RouteController {
  // GET /tuyen-xe
  async getAllRoutes(req, res) {
    try {
      const routes = await Route.findAll();
      const locations = await Route.getLocations();
      
      res.render('user/routes', { 
        routes,
        locations,
        query: req.query,
        title: 'Tuyến xe'
      });
    } catch (err) {
      console.error('Error in getAllRoutes:', err);
      res.status(500).render('error', {
        message: 'Có lỗi xảy ra khi tải danh sách tuyến xe',
        error: process.env.NODE_ENV === 'development' ? err : {}
      });
    }
  }

  // GET /tuyen-xe/:id
  async getRouteDetails(req, res) {
    try {
      const route = await Route.findById(req.params.id);
      if (!route) {
        return res.status(404).render('error', {
          message: 'Không tìm thấy tuyến xe',
          error: { status: 404 }
        });
      }
      res.render('user/route-details', { 
        route,
        title: `${route.from_location} - ${route.to_location}`
      });
    } catch (err) {
      console.error('Error in getRouteDetails:', err);
      res.status(500).render('error', {
        message: 'Có lỗi xảy ra khi tải chi tiết tuyến xe',
        error: process.env.NODE_ENV === 'development' ? err : {}
      });
    }
  }

  // GET /api/tuyen-xe
  async getRoutesApi(req, res) {
    try {
      const routes = await Route.findAll();
      res.json({
        success: true,
        data: routes
      });
    } catch (err) {
      console.error('Error in getRoutesApi:', err);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy dữ liệu tuyến xe'
      });
    }
  }

  // GET /api/tuyen-xe/search
  async searchRoutes(req, res) {
    try {
      const { keyword } = req.query;
      const routes = await Route.search(keyword);
      res.json({
        success: true,
        data: routes
      });
    } catch (err) {
      console.error('Error in searchRoutes:', err);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tìm kiếm tuyến xe'
      });
    }
  }

  async index(req, res) {
    try {
      const { from, to } = req.query;
      
      // Lấy danh sách địa điểm
      const [locationsResult] = await db.execute('SELECT DISTINCT from_location FROM routes UNION SELECT DISTINCT to_location FROM routes ORDER BY from_location');
      const locations = locationsResult.map(row => row.from_location);
      
      // Tìm kiếm tuyến xe
      let routes = [];
      if (from || to) {
        let sql = `
          SELECT 
            r.id, 
            r.from_location, 
            r.to_location, 
            r.distance, 
            r.duration, 
            r.price as min_price,
            r.description,
            r.image,
            (SELECT COUNT(*) FROM schedules WHERE route_id = r.id) as trip_count
          FROM routes r
          WHERE 1=1
        `;
        
        const params = [];
        
        if (from && from !== '') {
          sql += ` AND r.from_location = ?`;
          params.push(from);
        }
        
        if (to && to !== '') {
          sql += ` AND r.to_location = ?`;
          params.push(to);
        }
        
        sql += ` ORDER BY r.from_location, r.to_location`;
        
        const [results] = await db.execute(sql, params);
        routes = results;
      } else {
        // Lấy tất cả tuyến xe nếu không có tìm kiếm
        const [results] = await db.execute(`
          SELECT 
            r.id, 
            r.from_location, 
            r.to_location, 
            r.distance, 
            r.duration, 
            r.price as min_price,
            r.description,
            r.image,
            (SELECT COUNT(*) FROM schedules WHERE route_id = r.id) as trip_count
          FROM routes r
          ORDER BY r.from_location, r.to_location
        `);
        routes = results;
      }
      
      // Log để debug
      console.log(`Found ${routes.length} routes`);
      if (routes.length > 0) {
        console.log('Sample route data:', {
          id: routes[0].id,
          from: routes[0].from_location,
          to: routes[0].to_location,
          image: routes[0].image
        });
      }
      
      res.render('user/routes', {
        title: 'Tuyến xe',
        routes,
        locations,
        query: req.query
      });
    } catch (error) {
      console.error('Error in routes page:', error);
      res.status(500).send('Internal Server Error');
    }
  }
}

module.exports = new RouteController(); 