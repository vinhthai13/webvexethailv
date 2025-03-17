const AdminScheduleModel = require('../../models/admin/AdminScheduleModel');

class AdminScheduleController {
  // Get all schedules
  async getAllSchedules(req, res) {
    try {
      const { date, startDate, endDate } = req.query;
      let schedules;

      if (date) {
        // Get schedules for specific date
        schedules = await AdminScheduleModel.getSchedulesByDate(date);
      } else if (startDate && endDate) {
        // Get schedules for date range
        schedules = await AdminScheduleModel.getSchedulesByDateRange(startDate, endDate);
      } else {
        // Get all schedules
        schedules = await AdminScheduleModel.getAllSchedules();
      }

      // Format dates and times
      schedules = schedules.map(schedule => ({
        ...schedule,
        formatted_date: formatDate(schedule.date),
        formatted_departure_time: formatTime(schedule.departure_time),
        formatted_arrival_time: formatTime(schedule.arrival_time),
        price: parseFloat(schedule.price) || 0
      }));

      res.render('admin/schedules/index', {
        title: 'Quản lý lịch trình',
        schedules,
        currentDate: date || new Date().toISOString().split('T')[0],
        messages: req.flash()
      });
    } catch (err) {
      console.error('Error getting schedules:', err);
      req.flash('error', err.message || 'Có lỗi xảy ra khi tải danh sách lịch trình');
      res.redirect('/admin/schedules');
    }
  }

  // Show create schedule form
  async showCreateForm(req, res) {
    try {
      const routes = await AdminScheduleModel.getAllRoutes();
      res.render('admin/schedules/create', {
        title: 'Thêm lịch trình mới',
        routes,
        defaultDate: new Date().toISOString().split('T')[0],
        messages: req.flash()
      });
    } catch (err) {
      console.error('Error showing create form:', err);
      req.flash('error', 'Có lỗi xảy ra khi tải form thêm lịch trình');
      res.redirect('/admin/schedules');
    }
  }

  // Create new schedule
  async createSchedule(req, res) {
    try {
      const scheduleData = {
        route_id: req.body.route_id,
        date: req.body.date,
        departure_time: req.body.departure_time,
        arrival_time: req.body.arrival_time,
        bus_type: req.body.bus_type,
        price: req.body.price,
        available_seats: req.body.available_seats
      };

      await AdminScheduleModel.createSchedule(scheduleData);
      req.flash('success', 'Thêm lịch trình thành công');
      res.redirect('/admin/schedules');
    } catch (err) {
      console.error('Error creating schedule:', err);
      req.flash('error', err.message || 'Có lỗi xảy ra khi thêm lịch trình');
      res.redirect('/admin/schedules/create');
    }
  }

  // Show edit schedule form
  async showEditForm(req, res) {
    try {
      const [schedule, routes] = await Promise.all([
        AdminScheduleModel.getScheduleById(req.params.id),
        AdminScheduleModel.getAllRoutes()
      ]);

      if (!schedule) {
        req.flash('error', 'Không tìm thấy lịch trình');
        return res.redirect('/admin/schedules');
      }

      res.render('admin/schedules/edit', {
        title: 'Sửa lịch trình',
        schedule,
        routes,
        messages: req.flash()
      });
    } catch (err) {
      console.error('Error showing edit form:', err);
      req.flash('error', 'Có lỗi xảy ra khi tải form sửa lịch trình');
      res.redirect('/admin/schedules');
    }
  }

  // Update schedule
  async updateSchedule(req, res) {
    try {
      const scheduleData = {
        route_id: req.body.route_id,
        date: req.body.date,
        departure_time: req.body.departure_time,
        arrival_time: req.body.arrival_time,
        bus_type: req.body.bus_type,
        price: req.body.price,
        available_seats: req.body.available_seats
      };

      await AdminScheduleModel.updateSchedule(req.params.id, scheduleData);
      req.flash('success', 'Cập nhật lịch trình thành công');
      res.redirect('/admin/schedules');
    } catch (err) {
      console.error('Error updating schedule:', err);
      req.flash('error', err.message || 'Có lỗi xảy ra khi cập nhật lịch trình');
      res.redirect(`/admin/schedules/${req.params.id}/edit`);
    }
  }

  // Delete schedule
  async deleteSchedule(req, res) {
    try {
      await AdminScheduleModel.deleteSchedule(req.params.id);
      req.flash('success', 'Xóa lịch trình thành công');
    } catch (err) {
      console.error('Error deleting schedule:', err);
      req.flash('error', err.message || 'Có lỗi xảy ra khi xóa lịch trình');
    }
    res.redirect('/admin/schedules');
  }
}

// Helper functions
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('vi-VN');
}

function formatTime(time) {
  if (!time) return '';
  // Nếu time là string dạng HH:mm:ss
  if (typeof time === 'string' && time.includes(':')) {
    return time.substring(0, 5); // Lấy chỉ HH:mm
  }
  // Nếu time là Date object
  const d = new Date(time);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

module.exports = new AdminScheduleController(); 