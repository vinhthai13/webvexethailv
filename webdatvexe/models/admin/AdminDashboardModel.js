const db = require('../../config/database');

class AdminDashboardModel {
  async getTotalRevenue() {
    const [revenueResult] = await db.query(`
      SELECT SUM(total_price) as total
      FROM bookings
      WHERE status_id IN (1, 2, 4)
    `);
    return revenueResult[0].total || 0;
  }

  async getBookingStats() {
    const [bookingResult] = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status_id = 1 THEN 1 END) as pending,
        COUNT(CASE WHEN status_id = 2 THEN 1 END) as confirmed,
        COUNT(CASE WHEN status_id = 3 THEN 1 END) as cancelled,
        COUNT(CASE WHEN status_id = 4 THEN 1 END) as completed
      FROM bookings
    `);
    return bookingResult[0];
  }

  async getRecentBookings(limit = 5) {
    const [recentBookings] = await db.query(`
      SELECT b.*, 
        bs.name as status_name, 
        bs.color as status_color,
        r.from_location,
        r.to_location,
        u.username as customer_name
      FROM bookings b
      JOIN booking_status bs ON b.status_id = bs.id
      JOIN schedules s ON b.schedule_id = s.id
      JOIN routes r ON s.route_id = r.id
      LEFT JOIN users u ON b.user_id = u.id
      ORDER BY b.created_at DESC
      LIMIT ?
    `, [limit]);
    return recentBookings;
  }

  async getDashboardStats() {
    const [stats] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM routes) as total_routes,
        (SELECT COUNT(*) FROM schedules) as total_schedules,
        (SELECT COUNT(*) FROM bookings WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as bookings_last_30_days
    `);
    return stats[0];
  }

  async getMonthlyRevenue() {
    const [monthlyRevenue] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        SUM(total_price) as revenue,
        COUNT(*) as booking_count
      FROM bookings
      WHERE status_id IN (1, 2, 4)
      AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
    `);
    return monthlyRevenue;
  }

  async getPopularRoutes(limit = 5) {
    const [popularRoutes] = await db.query(`
      SELECT 
        r.id,
        r.from_location,
        r.to_location,
        COUNT(b.id) as booking_count,
        SUM(b.total_price) as total_revenue
      FROM routes r
      JOIN schedules s ON r.id = s.route_id
      JOIN bookings b ON s.id = b.schedule_id
      WHERE b.status_id IN (1, 2, 4)
      GROUP BY r.id
      ORDER BY booking_count DESC
      LIMIT ?
    `, [limit]);
    return popularRoutes;
  }
}

module.exports = new AdminDashboardModel(); 