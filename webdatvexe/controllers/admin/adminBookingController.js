const AdminBookingModel = require('../../models/admin/AdminBookingModel');

class AdminBookingController {
  // List all bookings
  async getAllBookings(req, res) {
    try {
      const bookings = await AdminBookingModel.getAllBookings();
      
      // Tính toán số lượng vé theo trạng thái
      const stats = {
        total: 0,
        pending: 0,
        confirmed: 0,
        cancelled: 0,
        completed: 0
      };
      
      bookings.forEach(booking => {
        stats.total += parseInt(booking.seats);
        
        if (booking.status_id == 1) {
          stats.pending += parseInt(booking.seats);
        } else if (booking.status_id == 2) {
          stats.confirmed += parseInt(booking.seats);
        } else if (booking.status_id == 3) {
          stats.cancelled += parseInt(booking.seats);
        } else if (booking.status_id == 4) {
          stats.completed += parseInt(booking.seats);
        }
      });
      
      res.render('admin/bookings/index', {
        title: 'Quản lý đặt vé',
        bookings,
        stats,
        messages: req.flash()
      });
    } catch (err) {
      console.error('Error getting bookings:', err);
      req.flash('error', 'Có lỗi xảy ra khi tải danh sách đặt vé');
      res.redirect('/admin');
    }
  }

  // Show booking details
  async getBookingDetails(req, res) {
    try {
      const booking = await AdminBookingModel.getBookingById(req.params.id);

      if (!booking) {
        req.flash('error', 'Không tìm thấy đơn đặt vé');
        return res.redirect('/admin/bookings');
      }

      const statuses = await AdminBookingModel.getAllBookingStatuses();

      res.render('admin/bookings/details', {
        title: 'Chi tiết đặt vé',
        booking,
        statuses,
        messages: req.flash()
      });
    } catch (err) {
      console.error('Error getting booking details:', err);
      req.flash('error', 'Có lỗi xảy ra khi tải thông tin đặt vé');
      res.redirect('/admin/bookings');
    }
  }

  // Update booking status
  async updateBookingStatus(req, res) {
    try {
      const { status_id } = req.body;
      await AdminBookingModel.updateBookingStatus(req.params.id, status_id);

      req.flash('success', 'Cập nhật trạng thái đặt vé thành công');
      res.redirect(`/admin/bookings/${req.params.id}`);
    } catch (err) {
      console.error('Error updating booking status:', err);
      req.flash('error', 'Có lỗi xảy ra khi cập nhật trạng thái đặt vé');
      res.redirect(`/admin/bookings/${req.params.id}`);
    }
  }

  // Delete booking
  async deleteBooking(req, res) {
    try {
      await AdminBookingModel.deleteBooking(req.params.id);
      req.flash('success', 'Xóa đơn đặt vé thành công');
    } catch (err) {
      console.error('Error deleting booking:', err);
      req.flash('error', 'Có lỗi xảy ra khi xóa đơn đặt vé');
    }
    res.redirect('/admin/bookings');
  }

  // Cập nhật trạng thái nhiều đơn đặt vé
  async bulkUpdateStatus(req, res) {
    try {
      const { bookingIds, statusId } = req.body;
      
      if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn ít nhất một đơn đặt vé' });
      }
      
      const result = await AdminBookingModel.bulkUpdateBookingStatus(bookingIds, statusId);
      
      const statusMap = {
        1: 'chờ xác nhận',
        2: 'đã xác nhận',
        3: 'đã hủy',
        4: 'hoàn thành'
      };
      
      return res.json({ 
        success: true, 
        message: `Đã cập nhật ${result.updated} đơn đặt vé thành trạng thái "${statusMap[statusId] || 'mới'}"` 
      });
    } catch (err) {
      console.error('Error updating booking statuses:', err);
      return res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi cập nhật trạng thái đơn đặt vé' });
    }
  }

  async getAllBookingStatuses() {
    // Trả về danh sách trạng thái cứng vì không có bảng booking_statuses
    return [
      { id: 1, name: 'Chờ xác nhận' },
      { id: 2, name: 'Đã xác nhận' },
      { id: 3, name: 'Đã hủy' },
      { id: 4, name: 'Hoàn thành' }
    ];
  }
}

module.exports = new AdminBookingController(); 