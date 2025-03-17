const db = require('../../config/database');
const AdminDashboardModel = require('../../models/admin/AdminDashboardModel');

class AdminDashboardController {
  async index(req, res) {
    try {
      // Get revenue stats
      const [revenueResult] = await db.query(`
        SELECT SUM(total_price) as total_revenue 
        FROM bookings 
        WHERE status_id IN (2, 4)
      `);
      const revenue = revenueResult[0].total_revenue || 0;

      // Get booking stats
      const [bookingStats] = await db.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status_id = 1 THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status_id = 2 THEN 1 ELSE 0 END) as confirmed,
          SUM(CASE WHEN status_id = 3 THEN 1 ELSE 0 END) as cancelled,
          SUM(CASE WHEN status_id = 4 THEN 1 ELSE 0 END) as completed
        FROM bookings
      `);

      // Get recent bookings
      const [recentBookings] = await db.query(`
        SELECT b.*, 
          r.from_location, 
          r.to_location,
          bs.name as status_name,
          bs.color as status_color,
          DATE_FORMAT(b.created_at, '%H:%i:%s %d/%m/%Y') as created_at
        FROM bookings b
        JOIN schedules s ON b.schedule_id = s.id
        JOIN routes r ON s.route_id = r.id
        JOIN booking_status bs ON b.status_id = bs.id
        ORDER BY b.created_at DESC
        LIMIT 10
      `);
      
      // Get monthly booking statistics for the current year
      const [monthlyBookings] = await db.query(`
        SELECT 
          MONTH(created_at) as month,
          SUM(CASE WHEN status_id = 2 THEN 1 ELSE 0 END) as confirmed,
          SUM(CASE WHEN status_id = 3 THEN 1 ELSE 0 END) as cancelled,
          SUM(CASE WHEN status_id = 1 THEN 1 ELSE 0 END) as pending
        FROM bookings
        WHERE YEAR(created_at) = YEAR(CURDATE())
        GROUP BY MONTH(created_at)
        ORDER BY month
      `);
      
      // Prepare data for booking chart
      const months = Array(12).fill(0).map((_, i) => i + 1); // 1-12
      
      const bookingChartData = {
        labels: months.map(m => `T${m}`),
        datasets: [
          {
            label: 'Đã xác nhận',
            data: months.map(month => {
              const found = monthlyBookings.find(b => b.month === month);
              return found ? found.confirmed : 0;
            }),
            backgroundColor: '#10b981',
            borderColor: '#10b981'
          },
          {
            label: 'Đã hủy',
            data: months.map(month => {
              const found = monthlyBookings.find(b => b.month === month);
              return found ? found.cancelled : 0;
            }),
            backgroundColor: '#ef4444',
            borderColor: '#ef4444'
          },
          {
            label: 'Chờ xác nhận',
            data: months.map(month => {
              const found = monthlyBookings.find(b => b.month === month);
              return found ? found.pending : 0;
            }),
            backgroundColor: '#f59e0b',
            borderColor: '#f59e0b'
          }
        ]
      };
      
      // Get monthly revenue for the current year
      const [monthlyRevenue] = await db.query(`
        SELECT 
          MONTH(created_at) as month,
          SUM(total_price) as revenue
        FROM bookings
        WHERE YEAR(created_at) = YEAR(CURDATE())
        AND status_id IN (1, 2, 4)
        GROUP BY MONTH(created_at)
        ORDER BY month
      `);
      
      // Prepare data for revenue chart
      const revenueChartData = {
        labels: months.map(m => `T${m}`),
        datasets: [{
          label: 'Doanh thu',
          data: months.map(month => {
            const found = monthlyRevenue.find(r => r.month === month);
            return found ? found.revenue : 0;
          }),
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: '#3b82f6',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        }]
      };
      
      // Get popular routes
      const [popularRoutes] = await db.query(`
        SELECT 
          r.from_location, 
          r.to_location,
          COUNT(b.id) as booking_count
        FROM routes r
        JOIN schedules s ON r.id = s.route_id
        JOIN bookings b ON s.id = b.schedule_id
        WHERE b.status_id IN (1, 2, 4)
        GROUP BY r.id
        ORDER BY booking_count DESC
        LIMIT 5
      `);
      
      // Prepare data for route chart
      const routeChartData = {
        labels: popularRoutes.map(r => `${r.from_location.substring(0, 2)}-${r.to_location.substring(0, 2)}`),
        datasets: [{
          label: 'Số lượt đặt vé',
          data: popularRoutes.map(r => r.booking_count),
          backgroundColor: [
            '#3b82f6', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6'
          ],
          borderWidth: 1
        }]
      };

      const stats = {
        revenue: revenue,
        totalBookings: bookingStats[0].total || 0,
        pendingBookings: bookingStats[0].pending || 0,
        confirmedBookings: bookingStats[0].confirmed || 0,
        cancelledBookings: bookingStats[0].cancelled || 0,
        completedBookings: bookingStats[0].completed || 0,
        bookingChartData: JSON.stringify(bookingChartData),
        revenueChartData: JSON.stringify(revenueChartData),
        routeChartData: JSON.stringify(routeChartData)
      };

      res.render('admin/dashboard/index', {
        title: 'Tổng quan',
        stats,
        recentBookings
      });
    } catch (err) {
      console.error('Error loading dashboard:', err);
      res.status(500).send('Internal Server Error');
    }
  }

  // Get dashboard stats API
  async getDashboardStats(req, res) {
    try {
      const stats = await AdminDashboardModel.getDashboardStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (err) {
      console.error('Error getting dashboard stats:', err);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi tải thống kê'
      });
    }
  }

  // Get monthly revenue API
  async getMonthlyRevenue(req, res) {
    try {
      const revenue = await AdminDashboardModel.getMonthlyRevenue();
      res.json({
        success: true,
        data: revenue
      });
    } catch (err) {
      console.error('Error getting monthly revenue:', err);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi tải doanh thu theo tháng'
      });
    }
  }

  // Get popular routes API
  async getPopularRoutes(req, res) {
    try {
      const routes = await AdminDashboardModel.getPopularRoutes();
      res.json({
        success: true,
        data: routes
      });
    } catch (err) {
      console.error('Error getting popular routes:', err);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi tải tuyến phổ biến'
      });
    }
  }
}

module.exports = new AdminDashboardController(); 