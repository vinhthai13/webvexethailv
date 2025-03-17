const db = require('../../config/database');
const { generateInvoicePDF } = require('../../utils/pdfUtils');
const { sendEmailWithAttachment } = require('../../utils/emailUtils');

/**
 * Lấy hóa đơn theo ID
 */
const getInvoiceById = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Lấy thông tin hóa đơn
    const [invoice] = await db.query(
      `SELECT i.*, b.user_id, b.schedule_id, b.status, b.email FROM invoices i
       JOIN bookings b ON i.booking_id = b.id
       WHERE i.id = ?`,
      [id]
    );
    
    if (!invoice.length) {
      return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
    }
    
    // Kiểm tra quyền truy cập (chỉ admin hoặc chủ sở hữu hóa đơn mới có quyền xem)
    if (!req.user.isAdmin && req.user.id !== invoice[0].user_id) {
      return res.status(403).json({ message: 'Không có quyền truy cập hóa đơn này' });
    }
    
    return res.status(200).json({ invoice: invoice[0] });
  } catch (error) {
    console.error('Error in getInvoiceById:', error);
    return res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy thông tin hóa đơn' });
  }
};

/**
 * Lấy tất cả hóa đơn (chỉ dành cho admin)
 */
const getAllInvoices = async (req, res) => {
  try {
    // Phân trang
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Lấy danh sách hóa đơn với phân trang
    const [invoices] = await db.query(
      `SELECT i.*, b.user_id, b.status, b.email, u.username, u.full_name 
       FROM invoices i
       JOIN bookings b ON i.booking_id = b.id
       JOIN users u ON b.user_id = u.id
       ORDER BY i.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    // Lấy tổng số hóa đơn để tính toán phân trang
    const [total] = await db.query('SELECT COUNT(*) as total FROM invoices');
    
    return res.status(200).json({
      invoices,
      pagination: {
        total: total[0].total,
        page,
        limit,
        totalPages: Math.ceil(total[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error in getAllInvoices:', error);
    return res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy danh sách hóa đơn' });
  }
};

/**
 * Lấy hóa đơn theo user ID
 */
const getInvoicesByUserId = async (req, res) => {
  const { userId } = req.params;
  
  try {
    // Kiểm tra quyền truy cập (chỉ admin hoặc chính người dùng mới có quyền xem)
    if (!req.user.isAdmin && req.user.id !== parseInt(userId)) {
      return res.status(403).json({ message: 'Không có quyền truy cập hóa đơn này' });
    }
    
    // Phân trang
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Lấy danh sách hóa đơn của user với phân trang
    const [invoices] = await db.query(
      `SELECT i.*, b.status, b.schedule_id, b.email, s.departure_time
       FROM invoices i
       JOIN bookings b ON i.booking_id = b.id
       JOIN schedules s ON b.schedule_id = s.id
       WHERE b.user_id = ?
       ORDER BY i.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
    
    // Lấy tổng số hóa đơn của user để tính toán phân trang
    const [total] = await db.query(
      'SELECT COUNT(*) as total FROM invoices i JOIN bookings b ON i.booking_id = b.id WHERE b.user_id = ?',
      [userId]
    );
    
    return res.status(200).json({
      invoices,
      pagination: {
        total: total[0].total,
        page,
        limit,
        totalPages: Math.ceil(total[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error in getInvoicesByUserId:', error);
    return res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy danh sách hóa đơn' });
  }
};

/**
 * Gửi lại hóa đơn
 * Lưu ý: Hàm này không expose qua API, chỉ sử dụng nội bộ
 */
const regenerateAndSendInvoice = async (bookingId, email) => {
  try {
    // Lấy thông tin booking
    const [bookings] = await db.query(
      `SELECT b.*, u.username, u.full_name, u.phone, u.email as user_email, 
              s.route_id, s.departure_time, s.arrival_time, 
              r.name as route_name, r.departure as departure_location, r.arrival as arrival_location
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN schedules s ON b.schedule_id = s.id
       JOIN routes r ON s.route_id = r.id
       WHERE b.id = ?`,
      [bookingId]
    );
    
    if (!bookings.length) {
      throw new Error('Booking not found');
    }
    
    const booking = bookings[0];
    const user = {
      id: booking.user_id,
      username: booking.username,
      fullName: booking.full_name,
      phone: booking.phone,
      email: booking.user_email
    };
    
    const schedule = {
      id: booking.schedule_id,
      routeId: booking.route_id,
      routeName: booking.route_name,
      departureTime: booking.departure_time,
      arrivalTime: booking.arrival_time,
      departureLocation: booking.departure_location,
      arrivalLocation: booking.arrival_location
    };
    
    // Tạo PDF hóa đơn
    const pdfBuffer = await generateInvoicePDF(booking, user, schedule);
    
    // Gửi email với file đính kèm
    const emailToSend = email || booking.email || user.email;
    
    if (!emailToSend) {
      throw new Error('No email provided for sending invoice');
    }
    
    // Tạo nội dung email
    const emailSubject = `Hóa đơn đặt vé #${booking.id}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hóa Đơn Đặt Vé</h2>
        <p>Kính gửi ${user.fullName || 'Quý khách'},</p>
        <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi. Vui lòng xem hóa đơn đính kèm cho đơn đặt vé của bạn.</p>
        <p>Thông tin chuyến xe:</p>
        <ul>
          <li>Tuyến đường: ${schedule.routeName}</li>
          <li>Ngày đi: ${new Date(schedule.departureTime).toLocaleString('vi-VN')}</li>
          <li>Trạng thái: ${booking.status === 'confirmed' ? 'Đã xác nhận' : 'Chờ xác nhận'}</li>
        </ul>
        <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
        <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
      </div>
    `;
    
    const fileName = `Invoice-Booking-${booking.id}.pdf`;
    
    // Gửi email
    await sendEmailWithAttachment(emailToSend, emailSubject, emailHtml, pdfBuffer, fileName);
    
    return { success: true };
  } catch (error) {
    console.error('Error in regenerateAndSendInvoice:', error);
    throw error;
  }
};

module.exports = {
  getInvoiceById,
  getAllInvoices,
  getInvoicesByUserId,
  regenerateAndSendInvoice
}; 