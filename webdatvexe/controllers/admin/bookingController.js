const { generatePDF } = require('../../helpers/pdfGenerator');
const nodemailer = require('nodemailer');
const fs = require('fs');

// Cấu hình transporter để gửi email
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: process.env.MAIL_PORT || 587,
  secure: process.env.MAIL_SECURE === 'true',
  auth: {
    user: process.env.MAIL_USER || 'your-email@gmail.com',
    pass: process.env.MAIL_PASS || 'your-password'
  }
});

// Hàm gửi email thông báo cập nhật trạng thái
async function sendStatusUpdateEmail(booking, pdfPath) {
  try {
    // Xác định trạng thái hiển thị cho người dùng
    let statusText = '';
    switch(booking.status) {
      case 'pending': statusText = 'Chờ xác nhận'; break;
      case 'confirmed': statusText = 'Đã xác nhận'; break;
      case 'completed': statusText = 'Hoàn thành'; break;
      case 'cancelled': statusText = 'Đã hủy'; break;
      default: statusText = booking.status; break;
    }
    
    // Tạo nội dung email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
        <h2 style="color: #333; text-align: center;">Cập nhật trạng thái đặt vé</h2>
        <p>Kính gửi <strong>${booking.fullname}</strong>,</p>
        <p>Trạng thái đơn đặt vé của bạn đã được cập nhật thành <strong style="color: #4CAF50;">${statusText}</strong>.</p>
        <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px;">
          <h3 style="margin-top: 0; color: #333;">Thông tin chuyến xe:</h3>
          <p><strong>Mã đơn hàng:</strong> #${booking.id}</p>
          <p><strong>Tuyến xe:</strong> ${booking.route_name}</p>
          <p><strong>Từ:</strong> ${booking.departure}</p>
          <p><strong>Đến:</strong> ${booking.destination}</p>
          <p><strong>Ngày đi:</strong> ${new Date(booking.departure_date).toLocaleDateString('vi-VN')}</p>
          <p><strong>Giờ đi:</strong> ${booking.departure_time}</p>
          <p><strong>Số ghế:</strong> ${booking.seat_number}</p>
          <p><strong>Tổng tiền:</strong> ${new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND'}).format(booking.total_price)}</p>
        </div>
        <p>Vui lòng kiểm tra file hóa đơn đính kèm để biết thêm chi tiết.</p>
        <p style="margin-top: 30px;">Trân trọng,</p>
        <p><strong>Đội ngũ Đặt Vé Xe</strong></p>
      </div>
    `;
    
    // Gửi email
    const info = await transporter.sendMail({
      from: '"Đặt Vé Xe" <support@example.com>',
      to: booking.email,
      subject: `Cập nhật trạng thái đặt vé #${booking.id}`,
      html: htmlContent,
      attachments: [
        {
          filename: `hoadon_${booking.id}.pdf`,
          path: pdfPath
        }
      ]
    });
    
    console.log('Email đã được gửi: %s', info.messageId);
    
    // Xóa file PDF sau khi gửi
    fs.unlink(pdfPath, (err) => {
      if (err) console.error('Lỗi khi xóa file PDF:', err);
      console.log('Đã xóa file PDF sau khi gửi email:', pdfPath);
    });
    
    return true;
  } catch (error) {
    console.error('Lỗi khi gửi email:', error);
    return false;
  }
}

// Hàm cập nhật trạng thái đơn đặt vé
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Cập nhật trạng thái trong cơ sở dữ liệu
    const updateQuery = 'UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?';
    await db.query(updateQuery, [status, id]);
    
    // Lấy thông tin đơn hàng và người dùng để gửi email
    const bookingQuery = `
      SELECT b.*, u.email, u.fullname, r.route_name, r.departure, r.destination, s.departure_time
      FROM bookings b 
      JOIN users u ON b.user_id = u.id
      JOIN routes r ON b.route_id = r.id
      JOIN schedules s ON b.schedule_id = s.id
      WHERE b.id = ?
    `;
    const [bookingResult] = await db.query(bookingQuery, [id]);
    
    if (bookingResult.length > 0) {
      const booking = bookingResult[0];
      booking.status = status; // Cập nhật trạng thái mới
      
      // Chuẩn bị dữ liệu cho PDF
      const pdfData = {
        bookingId: booking.id,
        customerName: booking.fullname,
        customerPhone: booking.phone,
        customerEmail: booking.email,
        route: `${booking.departure} - ${booking.destination}`,
        departureDate: new Date(booking.departure_date).toLocaleDateString('vi-VN'),
        departureTime: booking.departure_time,
        seatNumber: booking.seat_number,
        price: booking.total_price,
        status: status
      };
      
      // Tạo PDF và lưu vào thư mục tạm
      const pdfPath = await generatePDF(pdfData);
      
      // Gửi email với file PDF mới
      const emailSent = await sendStatusUpdateEmail(booking, pdfPath);
      
      if (emailSent) {
        req.flash('success', 'Đã cập nhật trạng thái và gửi email thông báo cho khách hàng');
      } else {
        req.flash('warning', 'Đã cập nhật trạng thái nhưng không thể gửi email');
      }
    } else {
      req.flash('error', 'Không tìm thấy thông tin đơn hàng');
    }
    
    return res.redirect('/admin/bookings');
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái:', error);
    req.flash('error', 'Đã xảy ra lỗi khi cập nhật trạng thái: ' + error.message);
    return res.redirect('/admin/bookings');
  }
}; 