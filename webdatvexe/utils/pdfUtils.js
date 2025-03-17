const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Tạo file PDF hóa đơn
 * @param {Object} booking - Thông tin đặt vé
 * @param {Object} user - Thông tin người dùng
 * @param {Object} schedule - Thông tin lịch trình
 * @returns {Promise<Buffer>} - Buffer của file PDF
 */
const generateInvoicePDF = (booking, user, schedule) => {
  return new Promise((resolve, reject) => {
    try {
      console.log('===== START PDF GENERATION =====');
      console.log('Schedule data:', JSON.stringify({
        departureLocation: schedule.departure_location || schedule.departureLocation,
        arrivalLocation: schedule.arrival_location || schedule.arrivalLocation
      }));
      
      // Tạo document PDF với font mặc định hỗ trợ UTF-8
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Hóa đơn #${booking.id}`,
          Author: 'Hệ thống đặt vé xe',
          Subject: 'Hóa đơn đặt vé',
        },
        font: 'Helvetica'
      });

      // Chuẩn bị các giá trị từ dữ liệu đầu vào
      const departureLocation = schedule.departure_location || schedule.departureLocation || 'N/A';
      const arrivalLocation = schedule.arrival_location || schedule.arrivalLocation || 'N/A';
      const routeName = schedule.route_name || schedule.routeName || `${departureLocation} - ${arrivalLocation}`;
      const departureDate = schedule.departure_date || (schedule.departureTime ? new Date(schedule.departureTime).toLocaleDateString('vi-VN') : 'N/A');
      const departureTime = schedule.departure_time || (schedule.departureTime ? new Date(schedule.departureTime).toLocaleTimeString('vi-VN') : 'N/A');
      
      // Tạo buffer để lưu nội dung PDF
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        console.log('PDF buffer created, size:', pdfData.length);
        console.log('===== END PDF GENERATION =====');
        resolve(pdfData);
      });
      
      // Handle errors
      doc.on('error', (err) => {
        console.error('PDF generation error:', err);
        reject(err);
      });

      // Thêm logo nếu có
      const logoPath = path.join(__dirname, '../public/images/logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 50, { width: 100 });
      }

      // Tiêu đề hóa đơn
      doc.fontSize(20).font('Helvetica-Bold').text('HÓA ĐƠN ĐẶT VÉ', {
        align: 'center'
      });
      
      // Thông tin công ty
      doc.moveDown(1);
      doc.fontSize(12).font('Helvetica-Bold').text('CÔNG TY VẬN TẢI XE KHÁCH', {
        align: 'center'
      });
      doc.fontSize(10).font('Helvetica').text('Địa chỉ: 123 Đường ABC, Quận XYZ, TP HCM', {
        align: 'center'
      });
      doc.text('Điện thoại: 1900 1234 - Email: support@xekhach.com', {
        align: 'center'
      });
      
      // Đường kẻ ngang
      doc.moveDown(1);
      doc.moveTo(50, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .stroke();
        
      // Mã hóa đơn và ngày
      doc.moveDown(1);
      doc.fontSize(10).font('Helvetica').text(`Mã hóa đơn: #${booking.id}`, {
        align: 'right'
      });
      doc.text(`Ngày lập: ${new Date().toLocaleDateString('vi-VN')}`, {
        align: 'right'
      });
      
      // Thông tin khách hàng
      doc.moveDown(1.5);
      doc.fontSize(12).font('Helvetica-Bold').text('THÔNG TIN KHÁCH HÀNG', 50, doc.y);
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text(`Họ tên: ${user.fullName || user.username || 'N/A'}`, 50, doc.y);
      doc.text(`Điện thoại: ${user.phone || 'N/A'}`, 50, doc.y + 15);
      doc.text(`Email: ${booking.email || user.email || 'N/A'}`, 50, doc.y + 15);
      
      // Thông tin chuyến xe
      doc.moveDown(1.5);
      doc.fontSize(12).font('Helvetica-Bold').text('THÔNG TIN CHUYẾN XE', 50, doc.y);
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text(`Tuyến đường: ${routeName}`, 50, doc.y);
      doc.text(`Điểm đi: ${departureLocation}`, 50, doc.y + 15);
      doc.text(`Điểm đến: ${arrivalLocation}`, 50, doc.y + 15);
      doc.text(`Ngày khởi hành: ${departureDate}`, 50, doc.y + 15);
      doc.text(`Giờ khởi hành: ${departureTime}`, 50, doc.y + 15);
      doc.text(`Số ghế: ${booking.seatNumber || booking.seat_number || 'N/A'}`, 50, doc.y + 15);
      
      // Bảng thông tin thanh toán
      doc.moveDown(1.5);
      doc.fontSize(12).font('Helvetica-Bold').text('CHI TIẾT THANH TOÁN', 50, doc.y);
      doc.moveDown(0.5);
      
      // Vẽ tiêu đề bảng
      const tableTop = doc.y;
      const colWidth = (doc.page.width - 100) / 4;
      
      // Header
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('STT', 50, tableTop, { width: 40, align: 'center' });
      doc.text('Mô tả', 90, tableTop, { width: colWidth * 2 - 40, align: 'left' });
      doc.text('Đơn giá', 90 + colWidth * 2 - 40, tableTop, { width: colWidth, align: 'right' });
      doc.text('Thành tiền', 90 + colWidth * 3 - 40, tableTop, { width: colWidth, align: 'right' });
      
      // Đường kẻ dưới header
      doc.moveTo(50, tableTop + 20)
         .lineTo(doc.page.width - 50, tableTop + 20)
         .stroke();
         
      // Định dạng số
      const formatNumber = (number) => {
        return new Intl.NumberFormat('vi-VN', { 
          style: 'currency', 
          currency: 'VND',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(number || 0);
      };
      
      // Dòng dữ liệu
      doc.font('Helvetica').fontSize(10);
      const rowY = tableTop + 30;
      doc.text('1', 50, rowY, { width: 40, align: 'center' });
      doc.text(`Vé xe - ${routeName}`, 90, rowY, { width: colWidth * 2 - 40, align: 'left' });
      doc.text(formatNumber(booking.ticketPrice || booking.ticket_price), 90 + colWidth * 2 - 40, rowY, { width: colWidth, align: 'right' });
      doc.text(formatNumber(booking.ticketPrice || booking.ticket_price), 90 + colWidth * 3 - 40, rowY, { width: colWidth, align: 'right' });
      
      // Đường kẻ trên tổng cộng
      const totalY = rowY + 30;
      doc.moveTo(50, totalY)
         .lineTo(doc.page.width - 50, totalY)
         .stroke();
      
      // Tổng tiền
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('Tổng cộng:', 90 + colWidth * 2 - 40, totalY + 15, { width: colWidth, align: 'right' });
      doc.text(formatNumber(booking.totalAmount || booking.total_amount || booking.ticket_price), 90 + colWidth * 3 - 40, totalY + 15, { width: colWidth, align: 'right' });
      
      // Thông tin trạng thái
      doc.moveDown(2);
      doc.fontSize(10).font('Helvetica-Bold').text('Trạng thái: ', 50, doc.y, { continued: true })
         .font('Helvetica').text(`${booking.status === 'confirmed' ? 'Đã xác nhận' : 'Chờ xác nhận'}`);
      
      // Ghi chú
      doc.moveDown(1);
      doc.fontSize(10).font('Helvetica-Bold').text('Lưu ý:', 50, doc.y);
      doc.font('Helvetica').text('- Vui lòng mang theo hóa đơn này khi lên xe.', 50, doc.y + 15);
      doc.text('- Có mặt tại bến xe trước giờ khởi hành ít nhất 30 phút.', 50, doc.y + 15);
      doc.text('- Mang theo giấy tờ tùy thân để đối chiếu.', 50, doc.y + 15);
      
      // Thông tin liên hệ
      doc.moveDown(1.5);
      doc.fontSize(10).font('Helvetica-Bold').text('Thông tin liên hệ:', 50, doc.y);
      doc.font('Helvetica').text('Hotline: 1900 xxxx', 50, doc.y + 15);
      doc.text('Email: support@example.com', 50, doc.y + 15);
      
      // Thông tin chân trang
      doc.fontSize(10).font('Helvetica').text('Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!', {
        align: 'center'
      });
      
      // Kết thúc document
      doc.end();
      
    } catch (error) {
      console.error('===== ERROR IN PDF GENERATION =====');
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('===== END OF PDF ERROR =====');
      reject(error);
    }
  });
};

module.exports = {
  generateInvoicePDF
}; 