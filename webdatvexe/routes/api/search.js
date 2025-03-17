const express = require('express');
const router = express.Router();
const db = require('../../config/database');

router.get('/', async (req, res) => {
  try {
    const { from, to, date } = req.query;
    
    if (!from || !to || !date) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const [results] = await db.execute(`
      SELECT 
        s.id,
        r.from_location,
        r.to_location,
        s.departure_date,
        s.departure_time,
        s.bus_type,
        s.available_seats,
        r.price,
        r.distance,
        r.duration
      FROM schedules s
      JOIN routes r ON s.route_id = r.id
      WHERE r.from_location = ? 
        AND r.to_location = ?
        AND s.departure_date = ?
        AND s.available_seats > 0
      ORDER BY s.departure_time ASC
    `, [from, to, date]);
    
    res.json(results);
  } catch (error) {
    console.error('API search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 