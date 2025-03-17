const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate invoice PDF
 * @param {Object} booking - Booking information
 * @param {Object} user - User information
 * @param {Object} schedule - Schedule information
 * @param {Object} route - Route information
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generateInvoice = (booking, user, schedule, route) => {
  return new Promise((resolve, reject) => {
    try {
      console.log('Starting invoice generation for booking:', booking.id);
      
      // Create a document with better font support
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Hóa đơn đặt vé xe #${booking.id}`,
          Author: 'Hệ thống đặt vé xe',
          Subject: 'Hóa đơn đặt vé xe',
          Keywords: 'hóa đơn, vé xe, booking'
        },
        font: 'Helvetica'
      });
      
      // Collect PDF content in a buffer
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        console.log(`PDF generated successfully. Size: ${pdfData.length} bytes`);
        resolve(pdfData);
      });
      
      // Add logo if exists
      const logoPath = path.join(__dirname, '../public/images/logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 100 });
      }
      
      // Invoice title
      doc.fontSize(22).font('Helvetica-Bold').text('HÓA ĐƠN ĐẶT VÉ', {
        align: 'center'
      });
      
      // Company information
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica-Bold').text('CÔNG TY VẬN TẢI XE KHÁCH', {
        align: 'center'
      });
      doc.fontSize(10).font('Helvetica').text('Địa chỉ: 123 Đường ABC, Quận XYZ, TP HCM', {
        align: 'center'
      });
      doc.text('Điện thoại: 1900 1234 - Email: support@xekhach.com', {
        align: 'center'
      });
      
      // Horizontal line
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .stroke();
      
      // Invoice details (right aligned)
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text(`Mã hóa đơn: #${booking.id}`, {
        align: 'right'
      });
      doc.text(`Ngày lập: ${new Date().toLocaleDateString('vi-VN')}`, {
        align: 'right'
      });
      doc.text(`Trạng thái: ${booking.status === 'confirmed' ? 'Đã xác nhận' : 'Chờ xác nhận'}`, {
        align: 'right'
      });
      
      // Customer information section
      doc.moveDown(1);
      doc.fontSize(12).font('Helvetica-Bold').text('THÔNG TIN KHÁCH HÀNG', 50, doc.y);
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Họ tên: ${user.fullName || user.username || 'N/A'}`, 50, doc.y);
      doc.text(`Điện thoại: ${user.phone || 'N/A'}`, 50, doc.y + 15);
      doc.text(`Email: ${booking.email || user.email || 'N/A'}`, 50, doc.y + 15);
      
      // Trip information
      doc.moveDown(1.5);
      doc.fontSize(12).font('Helvetica-Bold').text('THÔNG TIN CHUYẾN XE', 50, doc.y);
      doc.moveDown(0.5);
      
      // Format route information safely 
      const departureLocation = schedule.departure_location || schedule.departureLocation || route?.departureLocation || 'N/A';
      const arrivalLocation = schedule.arrival_location || schedule.arrivalLocation || route?.arrivalLocation || 'N/A';
      const routeName = schedule.route_name || schedule.routeName || route?.name || `${departureLocation} - ${arrivalLocation}`;
      const departureTime = schedule.departure_time || 
        (schedule.departureTime ? new Date(schedule.departureTime).toLocaleTimeString('vi-VN') : 'N/A');
      const departureDate = schedule.departure_date || 
        (schedule.departureTime ? new Date(schedule.departureTime).toLocaleDateString('vi-VN') : 'N/A');
      
      doc.fontSize(10).font('Helvetica');
      doc.text(`Tuyến đường: ${routeName}`, 50, doc.y);
      doc.text(`Điểm đi: ${departureLocation}`, 50, doc.y + 15);
      doc.text(`Điểm đến: ${arrivalLocation}`, 50, doc.y + 15);
      doc.text(`Ngày khởi hành: ${departureDate}`, 50, doc.y + 15);
      doc.text(`Giờ khởi hành: ${departureTime}`, 50, doc.y + 15);
      doc.text(`Loại xe: ${schedule.vehicle_type || schedule.vehicleType || 'N/A'}`, 50, doc.y + 15);
      doc.text(`Số ghế: ${booking.seatNumber || booking.seat_number || 'N/A'}`, 50, doc.y + 15);
      
      // Payment information
      doc.moveDown(1.5);
      doc.fontSize(12).font('Helvetica-Bold').text('CHI TIẾT THANH TOÁN', 50, doc.y);
      doc.moveDown(0.5);
      
      // Invoice table
      const tableTop = doc.y;
      const colWidth = (doc.page.width - 100) / 5;

      // Draw table headers
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('Mã', 50, tableTop, { width: colWidth / 2, align: 'center' });
      doc.text('Mô tả', 50 + colWidth / 2, tableTop, { width: colWidth * 2, align: 'left' });
      doc.text('SL', 50 + colWidth * 2.5, tableTop, { width: colWidth / 2, align: 'center' });
      doc.text('Đơn giá', 50 + colWidth * 3, tableTop, { width: colWidth, align: 'right' });
      doc.text('Thành tiền', 50 + colWidth * 4, tableTop, { width: colWidth, align: 'right' });
      
      // Line below header
      doc.moveTo(50, tableTop + 20)
        .lineTo(doc.page.width - 50, tableTop + 20)
        .stroke();
      
      // Format currency
      const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(amount || 0);
      };
      
      // Table data
      doc.font('Helvetica').fontSize(10);
      const ticketPrice = booking.ticketPrice || booking.ticket_price || 0;
      const quantity = 1;
      
      // Row for ticket
      const rowTop = tableTop + 30;
      doc.text(booking.id, 50, rowTop, { width: colWidth / 2, align: 'center' });
      doc.text(`Vé xe ${routeName}`, 50 + colWidth / 2, rowTop, { width: colWidth * 2, align: 'left' });
      doc.text(quantity.toString(), 50 + colWidth * 2.5, rowTop, { width: colWidth / 2, align: 'center' });
      doc.text(formatCurrency(ticketPrice), 50 + colWidth * 3, rowTop, { width: colWidth, align: 'right' });
      doc.text(formatCurrency(ticketPrice * quantity), 50 + colWidth * 4, rowTop, { width: colWidth, align: 'right' });
      
      // Line above total
      const totalTop = rowTop + 30;
      doc.moveTo(50, totalTop)
        .lineTo(doc.page.width - 50, totalTop)
        .stroke();
      
      // Total amount
      const totalAmount = booking.totalAmount || booking.total_amount || ticketPrice;
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('Tổng cộng:', 50 + colWidth * 3, totalTop + 10, { width: colWidth, align: 'right' });
      doc.text(formatCurrency(totalAmount), 50 + colWidth * 4, totalTop + 10, { width: colWidth, align: 'right' });
      
      // Payment information
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(10);
      doc.text('Thanh toán: Tiền mặt khi lên xe', 50, doc.y + 15);
      
      // Notes
      doc.moveDown(1.5);
      doc.font('Helvetica-Bold').fontSize(10).text('LƯU Ý QUAN TRỌNG:', 50, doc.y);
      doc.font('Helvetica').fontSize(10);
      doc.text('- Quý khách vui lòng có mặt tại bến xe trước giờ khởi hành ít nhất 30 phút.', 50, doc.y + 15);
      doc.text('- Mang theo hóa đơn này (bản in hoặc bản điện tử) và giấy tờ tùy thân khi lên xe.', 50, doc.y + 15);
      doc.text('- Hoàn/hủy vé: Liên hệ trước 24h để được hoàn 80% giá vé.', 50, doc.y + 15);
      
      // Footer
      doc.moveDown(1);
      doc.moveTo(50, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .stroke();
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(10).text('Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!', {
        align: 'center'
      });
      
      // Add page count to footer of each page
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).text(`Trang ${i + 1}/${pageCount}`, 50, doc.page.height - 50, {
          align: 'center'
        });
      }
      
      // Finalize the PDF
      doc.end();
      
    } catch (error) {
      console.error('Error generating invoice:', error);
      reject(error);
    }
  });
};

// Helper function to format currency in VND
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

module.exports = {
  generateInvoice
}; 