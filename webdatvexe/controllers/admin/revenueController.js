const db = require('../../config/database');

class RevenueController {
  async index(req, res) {
    try {
      // Lấy tổng doanh thu
      const [totalRevenueResult] = await db.query(`
        SELECT SUM(total_price) as total
        FROM bookings
        WHERE status_id IN (2, 4)
      `);
      const totalRevenue = totalRevenueResult[0].total || 0;
      
      // Lấy doanh thu theo tháng (năm hiện tại)
      const [monthlyRevenue] = await db.query(`
        SELECT 
          DATE_FORMAT(created_at, '%m/%Y') as month,
          COUNT(*) as booking_count,
          SUM(total_price) as revenue
        FROM bookings
        WHERE YEAR(created_at) = YEAR(CURDATE())
        AND status_id IN (2, 4)
        GROUP BY DATE_FORMAT(created_at, '%m/%Y')
        ORDER BY YEAR(created_at), MONTH(created_at)
      `);
      
      // Lấy doanh thu theo tuyến (top 10)
      const [routeRevenue] = await db.query(`
        SELECT 
          r.id, 
          r.from_location, 
          r.to_location,
          COUNT(b.id) as booking_count,
          SUM(b.total_price) as revenue
        FROM routes r
        JOIN schedules s ON r.id = s.route_id
        JOIN bookings b ON s.id = b.schedule_id
        WHERE b.status_id IN (2, 4)
        GROUP BY r.id
        ORDER BY revenue DESC
        LIMIT 10
      `);
      
      // Lấy doanh thu theo ngày (7 ngày gần đây)
      const [dailyRevenue] = await db.query(`
        SELECT 
          DATE_FORMAT(created_at, '%d/%m/%Y') as date,
          COUNT(*) as booking_count,
          SUM(total_price) as revenue
        FROM bookings
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        AND status_id IN (2, 4)
        GROUP BY DATE_FORMAT(created_at, '%d/%m/%Y')
        ORDER BY created_at DESC
      `);
      
      // Lấy giao dịch mới nhất (đã xác nhận hoặc hoàn thành)
      const [recentTransactions] = await db.query(`
        SELECT 
          b.id,
          b.customer_name,
          b.total_price,
          b.seats,
          r.from_location,
          r.to_location,
          bs.name as status,
          DATE_FORMAT(b.created_at, '%d/%m/%Y %H:%i') as created_at
        FROM bookings b
        JOIN schedules s ON b.schedule_id = s.id
        JOIN routes r ON s.route_id = r.id
        JOIN booking_status bs ON b.status_id = bs.id
        WHERE b.status_id IN (2, 4)
        ORDER BY b.created_at DESC
        LIMIT 20
      `);
      
      res.render('admin/revenue/index', {
        title: 'Thống kê doanh thu',
        totalRevenue,
        monthlyRevenue,
        routeRevenue,
        dailyRevenue,
        recentTransactions
      });
    } catch (err) {
      console.error('Error loading revenue statistics:', err);
      res.status(500).send('Internal Server Error');
    }
  }
}

module.exports = new RevenueController(); 