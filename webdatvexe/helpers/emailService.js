const nodemailer = require('nodemailer');
require('dotenv').config();

// Cấu hình transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Gửi email
const sendEmail = async (to, subject, html, attachments = []) => {
  try {
    console.log('Preparing to send email via emailService to:', to);
    
    const mailOptions = {
      from: `"${process.env.COMPANY_NAME || 'Hệ thống đặt vé xe'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      attachments
    };

    // Kiểm tra kết nối
    await transporter.verify();
    console.log('SMTP connection verified in emailService');

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent via emailService:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email via emailService:', error);
    return { success: false, error: error.message };
  }
};

// Gửi email xác nhận đặt vé
const sendBookingConfirmation = async (booking, pdfBuffer) => {
  const { email, passenger_name, schedule } = booking;
  
  if (!email) {
    console.log('No email provided for booking confirmation');
    return { success: false, error: 'No email provided' };
  }

  const subject = 'Xác nhận đặt vé thành công';
  
  const html = `
    <h1>Xác nhận đặt vé thành công</h1>
    <p>Kính gửi ${passenger_name},</p>
    <p>Cảm ơn bạn đã đặt vé tại hệ thống của chúng tôi. Dưới đây là thông tin chi tiết về vé của bạn:</p>
    <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse;">
      <tr>
        <td><strong>Mã đặt vé:</strong></td>
        <td>${booking.id}</td>
      </tr>
      <tr>
        <td><strong>Tuyến đường:</strong></td>
        <td>${schedule.from_location} - ${schedule.to_location}</td>
      </tr>
      <tr>
        <td><strong>Ngày khởi hành:</strong></td>
        <td>${new Date(schedule.departure_date).toLocaleDateString('vi-VN')}</td>
      </tr>
      <tr>
        <td><strong>Giờ khởi hành:</strong></td>
        <td>${schedule.departure_time}</td>
      </tr>
      <tr>
        <td><strong>Số ghế:</strong></td>
        <td>${booking.seat_number || 'Chưa chỉ định'}</td>
      </tr>
      <tr>
        <td><strong>Giá vé:</strong></td>
        <td>${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.ticket_price)}</td>
      </tr>
      <tr>
        <td><strong>Trạng thái:</strong></td>
        <td>${booking.status === 'confirmed' ? 'Đã xác nhận' : 'Chờ xác nhận'}</td>
      </tr>
    </table>
    <p>Vui lòng kiểm tra tệp đính kèm để xem hóa đơn chi tiết.</p>
    <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email hoặc số điện thoại được cung cấp trong hóa đơn.</p>
    <p>Trân trọng,<br>Đội ngũ hỗ trợ khách hàng</p>
  `;

  const attachments = pdfBuffer ? [
    {
      filename: `hoa-don-dat-ve-${booking.id}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf'
    }
  ] : [];

  return await sendEmail(email, subject, html, attachments);
};

module.exports = {
  sendEmail,
  sendBookingConfirmation
}; 