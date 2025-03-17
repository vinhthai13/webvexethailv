const nodemailer = require('nodemailer');
require('dotenv').config();
 
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  // Bỏ qua TLS issues nếu có
  tls: {
    rejectUnauthorized: false
  }
});

/**
 * Gửi email booking confirmation kèm file PDF
 * @param {String} to Email người nhận
 * @param {String} subject Tiêu đề email
 * @param {String} html Nội dung email dạng HTML
 * @param {Buffer} pdfBuffer Buffer chứa file PDF
 * @param {String} fileName Tên file PDF
 * @returns {Promise} Promise kết quả gửi email
 */
const sendEmailWithAttachment = async (to, subject, html, pdfBuffer, fileName) => {
  try {
    // Log thông tin để debug
    console.log('===== START EMAIL SENDING PROCESS =====');
    console.log('Preparing to send email to:', to);
    console.log('Email subject:', subject);
    console.log('PDF file name:', fileName);
    console.log('PDF buffer exists:', !!pdfBuffer);
    console.log('Email configuration:');
    console.log('- HOST:', process.env.EMAIL_HOST);
    console.log('- PORT:', process.env.EMAIL_PORT);
    console.log('- USER:', process.env.EMAIL_USER);
    console.log('- SECURE:', process.env.EMAIL_SECURE);
    
    const mailOptions = {
      from: `"${process.env.COMPANY_NAME || 'Hệ thống đặt vé xe'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      attachments: pdfBuffer ? [
        {
          filename: fileName,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ] : []
    };

    // Kiểm tra kết nối trước khi gửi
    console.log('Verifying SMTP connection...');
    const verification = await transporter.verify();
    console.log('SMTP connection verified:', verification);

    console.log('Sending email...');
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${info.messageId}`);
    console.log('===== END EMAIL SENDING PROCESS =====');
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('===== ERROR IN EMAIL SENDING PROCESS =====');
    console.error('Error sending email:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Detailed error info for authentication issues
    if (error.code === 'EAUTH') {
      console.error('Authentication failed. Please check your email credentials.');
      console.error('Ensure you are using an App Password if you have 2FA enabled on your Google account.');
      console.error('Generate a new App Password at: https://myaccount.google.com/apppasswords');
    }
    
    // Detailed error info for connection issues
    if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.error('Connection failed. Please check your internet connection and email server settings.');
    }
    
    console.error('===== END ERROR IN EMAIL SENDING PROCESS =====');
    return { success: false, error: error.message, errorCode: error.code };
  }
};

/**
 * Tạo nội dung email xác nhận đặt vé
 * @param {Object} booking Thông tin đặt vé
 * @param {Object} user Thông tin người dùng
 * @param {Object} schedule Thông tin lịch trình
 * @returns {String} HTML content cho email
 */
const createBookingConfirmationEmailContent = (booking, user, schedule) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'N/A';
    }
  };

  // Normalize data to handle different property naming conventions
  const normalizedBooking = {
    id: booking.id,
    booking_code: booking.booking_code || '',
    seatNumber: booking.seatNumber || booking.seat_number || 'N/A',
    totalAmount: booking.totalAmount || booking.total_amount || booking.ticket_price || 0,
    ticketPrice: booking.ticketPrice || booking.ticket_price || 0,
    status: booking.status || 'pending',
    email: booking.email || (user ? user.email : 'N/A'),
    createdAt: formatDateTime(booking.createdAt || booking.created_at || new Date())
  };

  const normalizedUser = {
    fullName: (user && (user.fullName || user.full_name || user.name)) || 'Quý khách',
    username: (user && user.username) || 'Quý khách',
    email: (user && user.email) || booking.email || 'N/A',
    phone: (user && user.phone) || booking.passenger_phone || booking.phone || 'N/A'
  };

  const normalizedSchedule = {
    departureLocation: schedule.departure_location || schedule.departureLocation || schedule.from_location || 'N/A',
    arrivalLocation: schedule.arrival_location || schedule.arrivalLocation || schedule.to_location || 'N/A',
    departureDate: formatDateTime(schedule.departure_date || schedule.departureDate || new Date()),
    departureTime: schedule.departure_time || schedule.departureTime || 'N/A'
  };

  console.log('Normalized booking data for email:', {
    id: normalizedBooking.id,
    code: normalizedBooking.booking_code,
    seat: normalizedBooking.seatNumber,
    price: normalizedBooking.ticketPrice,
    user: normalizedUser.fullName,
    departure: normalizedSchedule.departureLocation,
    arrival: normalizedSchedule.arrivalLocation
  });

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2c3e50; margin: 0;">Xác Nhận Đặt Vé</h1>
        <p style="color: #7f8c8d; margin-top: 5px;">Mã đặt vé: #${normalizedBooking.id}</p>
        <p style="color: #16a085; margin-top: 5px; font-weight: bold;">Mã vé: ${normalizedBooking.booking_code}</p>
      </div>

      <div style="margin-bottom: 30px;">
        <p style="margin: 0;">Kính gửi <strong>${normalizedUser.fullName}</strong>,</p>
        <p style="margin-top: 10px;">Cảm ơn bạn đã đặt vé trên hệ thống của chúng tôi. Vé của bạn đã được xác nhận với các thông tin chi tiết như sau:</p>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 30px;">
        <h2 style="color: #2c3e50; margin-top: 0; font-size: 18px;">Thông Tin Chuyến Xe</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #7f8c8d;">Mã vé:</td>
            <td style="padding: 8px 0;"><strong>${normalizedBooking.booking_code}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #7f8c8d;">Tuyến đường:</td>
            <td style="padding: 8px 0;"><strong>${normalizedSchedule.departureLocation} - ${normalizedSchedule.arrivalLocation}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #7f8c8d;">Thời gian khởi hành:</td>
            <td style="padding: 8px 0;"><strong>${normalizedSchedule.departureDate}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #7f8c8d;">Số ghế:</td>
            <td style="padding: 8px 0;"><strong>${normalizedBooking.seatNumber}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #7f8c8d;">Giá vé:</td>
            <td style="padding: 8px 0;"><strong>${formatCurrency(normalizedBooking.ticketPrice)}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #7f8c8d;">Tổng tiền:</td>
            <td style="padding: 8px 0;"><strong>${formatCurrency(normalizedBooking.totalAmount)}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #7f8c8d;">Trạng thái:</td>
            <td style="padding: 8px 0;"><strong style="color: ${normalizedBooking.status === 'confirmed' ? '#27ae60' : '#f39c12'}">${normalizedBooking.status === 'confirmed' ? 'Đã xác nhận' : 'Chờ xác nhận'}</strong></td>
          </tr>
        </table>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 30px;">
        <h2 style="color: #2c3e50; margin-top: 0; font-size: 18px;">Thông Tin Hành Khách</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #7f8c8d;">Họ tên:</td>
            <td style="padding: 8px 0;"><strong>${normalizedUser.fullName}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #7f8c8d;">Email:</td>
            <td style="padding: 8px 0;"><strong>${normalizedBooking.email}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #7f8c8d;">Số điện thoại:</td>
            <td style="padding: 8px 0;"><strong>${normalizedUser.phone}</strong></td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 30px;">
        <h2 style="color: #2c3e50; margin-top: 0; font-size: 18px;">Hướng Dẫn Lên Xe</h2>
        <ul style="padding-left: 20px; margin-top: 10px;">
          <li style="margin-bottom: 8px;">Vui lòng đến điểm đón trước giờ khởi hành ít nhất 30 phút.</li>
          <li style="margin-bottom: 8px;">Mang theo hóa đơn này (bản in hoặc bản điện tử) khi lên xe.</li>
          <li style="margin-bottom: 8px;">Xuất trình mã vé <strong>${normalizedBooking.booking_code}</strong> cho nhân viên xác nhận.</li>
          <li style="margin-bottom: 8px;">Mang theo giấy tờ tùy thân khi đi xe.</li>
        </ul>
      </div>

      <div style="margin-bottom: 30px;">
        <h2 style="color: #2c3e50; margin-top: 0; font-size: 18px;">Chính Sách Hoàn / Hủy Vé</h2>
        <ul style="padding-left: 20px; margin-top: 10px;">
          <li style="margin-bottom: 8px;">Hoàn vé trước 24h: Hoàn 80% giá vé</li>
          <li style="margin-bottom: 8px;">Hoàn vé trước 12h: Hoàn 50% giá vé</li>
          <li style="margin-bottom: 8px;">Hoàn vé dưới 12h: Không hoàn tiền</li>
        </ul>
      </div>

      <div style="text-align: center; padding-top: 30px; border-top: 1px solid #eee;">
        <p style="margin: 0; color: #7f8c8d;">Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
        <p style="margin: 5px 0; color: #7f8c8d;">Hotline: 1900 xxxx | Email: support@example.com</p>
        <p style="margin-top: 20px; color: #2c3e50;">Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
      </div>
    </div>
  `;
};

module.exports = {
  sendEmailWithAttachment,
  createBookingConfirmationEmailContent
}; 