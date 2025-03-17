const Schedule = require('../../models/user/Schedule');
const Route = require('../../models/user/Route');

class ScheduleController {
  // GET /lich-trinh
  async getAllSchedules(req, res) {
    try {
      const { from, to, date } = req.query;
      
      // Nếu không có tham số date, mặc định tìm lịch trình của ngày hôm nay
      const todayDate = new Date().toISOString().split('T')[0]; // Định dạng YYYY-MM-DD
      const searchDate = date || todayDate;
      
      const [schedules, locations, stats] = await Promise.all([
        from || to ? Schedule.search({ from, to, date: searchDate }) : Schedule.search({ date: searchDate }),
        Route.getLocations(),
        Schedule.getStats()
      ]);
      
      // Debug: Log thông tin để kiểm tra
      console.log('Debug - Schedules:', schedules.length);
      if (schedules.length > 0) {
        console.log('Debug - First schedule:', {
          id: schedules[0].id,
          from: schedules[0].from_location,
          to: schedules[0].to_location,
          image: schedules[0].image
        });
      }
      
      res.render('user/schedules/index', { 
        title: 'Lịch trình xe',
        schedules,
        locations,
        stats,
        query: { ...req.query, date: searchDate }, // Truyền ngày tìm kiếm vào query
        moment: require('moment')
      });
    } catch (err) {
      console.error('Error getting schedules:', err);
      res.status(500).render('error', {
        message: 'Có lỗi xảy ra khi tải danh sách lịch trình'
      });
    }
  }

  // GET /lich-trinh/:id
  async getScheduleDetails(req, res) {
    try {
      const scheduleId = req.params.id;
      
      // Validate scheduleId is numeric
      if (!scheduleId || isNaN(parseInt(scheduleId))) {
        return res.status(400).render('error', {
          message: 'ID lịch trình không hợp lệ',
          error: { status: 400 }
        });
      }
      
      const schedule = await Schedule.findById(parseInt(scheduleId));
      
      if (!schedule) {
        return res.status(404).render('user/schedules/schedule-details', {
          title: 'Chi tiết lịch trình',
          schedule: null
        });
      }

      res.render('user/schedules/schedule-details', {
        title: 'Chi tiết lịch trình',
        schedule: schedule
      });
    } catch (error) {
      console.error('Error getting schedule details:', error);
      res.status(500).send('Internal Server Error');
    }
  }

  // GET /api/lich-trinh
  async getSchedulesApi(req, res) {
    try {
      const { from, to, date } = req.query;
      const schedules = await Schedule.search({ from, to, date });
      res.json({
        success: true,
        data: schedules
      });
    } catch (err) {
      console.error('Error getting schedules:', err);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy dữ liệu'
      });
    }
  }

  // GET /api/lich-trinh/search
  async searchSchedules(req, res) {
    try {
      const { from, to, date } = req.query;
      const schedules = await Schedule.search({ from, to, date });
      res.json({
        success: true,
        data: schedules
      });
    } catch (err) {
      console.error('Error searching schedules:', err);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi tìm kiếm lịch trình'
      });
    }
  }
}

module.exports = new ScheduleController(); 