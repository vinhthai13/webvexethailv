const fs = require('fs');
const path = require('path');

// Giả sử hàm gửi email của bạn có dạng như sau
async function sendTicketEmail(email, ticketData, pdfPath) {
  try {
    // Gửi email với file đính kèm
    await transporter.sendMail({
      from: '"Đặt Vé Xe" <support@example.com>',
      to: email,
      subject: 'Hóa đơn đặt vé xe',
      html: ticketEmailTemplate(ticketData),
      attachments: [
        {
          filename: 'hoadon.pdf',
          path: pdfPath
        }
      ]
    });
    
    // Xóa file PDF sau khi gửi email
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