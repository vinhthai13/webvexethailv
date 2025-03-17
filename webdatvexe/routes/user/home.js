const express = require('express');
const router = express.Router();
const homeController = require('../../controllers/user/homeController');
const db = require('../../config/database');

// Home page route (/)
router.get('/', async (req, res) => {
  try {
    // Get popular routes với đầy đủ thông tin
    const routesQuery = `
      SELECT 
        r.id,
        r.from_location,
        r.to_location,
        r.distance,
        r.duration,
        r.description,
        r.price,
        r.image,
        MIN(s.price) as min_price,
        COUNT(DISTINCT s.id) as trip_count
      FROM routes r
      LEFT JOIN schedules s ON r.id = s.route_id
      GROUP BY r.id, r.from_location, r.to_location, r.distance, r.duration, r.description, r.price, r.image
      ORDER BY r.from_location, r.to_location
      LIMIT 8
    `;

    const [routes] = await db.execute(routesQuery);
    
    // Debug dữ liệu routes
    console.log('===== ROUTES DATA FROM DATABASE =====');
    console.log(JSON.stringify(routes));
    console.log('=====================================');

    res.render('user/home', {
      title: 'Trang chủ',
      routes: routes, // Truyền trực tiếp dữ liệu gốc, không định dạng lại
      news: [] // Empty news array for now
    });
  } catch (err) {
    console.error('Error loading home page:', err);
    res.status(500).send('Lỗi server');
  }
});

// Search route (/search)
router.get('/search', homeController.searchSchedules);

module.exports = router; 