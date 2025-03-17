const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

exports.generatePDF = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      // Tạo thư mục uploads nếu chưa tồn tại
      const uploadsDir = path.join(__dirname, '../public/uploads/invoices');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Tạo tên file PDF
      const fileName = `invoice_${data.bookingId || 'new'}_${Date.now()}.pdf`;
      const filePath = path.join(uploadsDir, fileName);
      
      // Tạo PDF document với font hỗ trợ tiếng Việt
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: 'Hóa đơn đặt vé xe',
          Author: 'Hệ thống đặt vé xe',
        }
      });
      
      // Đăng ký font hỗ trợ tiếng Việt
      doc.registerFont('NotoSans', path.join(__dirname, '../public/fonts/NotoSans-Regular.ttf'));
      doc.registerFont('NotoSansBold', path.join(__dirname, '../public/fonts/NotoSans-Bold.ttf'));
      
      // Sử dụng font hỗ trợ tiếng Việt
      doc.font('NotoSans');
      
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);
      
      // Thêm logo và tiêu đề
      doc.font('NotoSansBold').fontSize(20).text('HÓA ĐƠN ĐẶT VÉ', { align: 'center' });
      doc.moveDown();
      
      // Thông tin công ty
      doc.fontSize(12).text('CÔNG TY VẬN TẢI XE KHÁCH', { align: 'center' });
      doc.font('NotoSans').fontSize(10).text('Địa chỉ: 123 Đường ABC, Quận XYZ, TP HCM', { align: 'center' });
      doc.fontSize(10).text('Điện thoại: 1900 1234 - Email: support@example.com', { align: 'center' });
      
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
      
      // Thông tin hóa đơn
      doc.moveDown();
      doc.fontSize(10).text(`Mã hóa đơn: #${data.bookingId || ''}`, { align: 'right' });
      doc.fontSize(10).text(`Ngày lập: ${new Date().toLocaleDateString('vi-VN')}`, { align: 'right' });
      
      // Thông tin khách hàng
      doc.moveDown();
      doc.font('NotoSansBold').fontSize(14).text('THÔNG TIN KHÁCH HÀNG');
      doc.moveDown(0.5);
      doc.font('NotoSans').fontSize(10).text(`Họ tên: ${data.customerName || ''}`);
      doc.fontSize(10).text(`Điện thoại: ${data.customerPhone || ''}`);
      doc.fontSize(10).text(`Email: ${data.customerEmail || ''}`);
      
      // Thông tin chuyến xe
      doc.moveDown();
      doc.font('NotoSansBold').fontSize(14).text('THÔNG TIN CHUYẾN XE');
      doc.moveDown(0.5);
      doc.font('NotoSans').fontSize(10).text(`Tuyến xe: ${data.route || ''}`);
      doc.fontSize(10).text(`Ngày đi: ${data.departureDate || ''}`);
      doc.fontSize(10).text(`Giờ đi: ${data.departureTime || ''}`);
      doc.fontSize(10).text(`Số ghế: ${data.seatNumber || ''}`);
      
      // Chi tiết thanh toán
      doc.moveDown();
      doc.font('NotoSansBold').fontSize(14).text('CHI TIẾT THANH TOÁN');
      doc.moveDown(0.5);
      
      // Tạo bảng chi tiết
      const tableTop = doc.y;
      const tableLeft = 50;
      
      // Headers
      doc.font('NotoSansBold').fontSize(10);
      doc.text('STT', tableLeft, tableTop);
      doc.text('Mô tả', tableLeft + 50, tableTop);
      doc.text('Đơn giá', tableLeft + 300, tableTop, { width: 80, align: 'right' });
      doc.text('Thành tiền', tableLeft + 400, tableTop, { width: 80, align: 'right' });
      
      // Vẽ đường kẻ ngang
      doc.moveTo(50, doc.y + 5).lineTo(doc.page.width - 50, doc.y + 5).stroke();
      
      // Row
      doc.font('NotoSans').fontSize(10);
      doc.text('1', tableLeft, doc.y + 10);
      doc.text(`Vé xe: ${data.route || ''}`, tableLeft + 50, doc.y);
      doc.text(formatCurrency(data.price || 0), tableLeft + 300, doc.y, { width: 80, align: 'right' });
      doc.text(formatCurrency(data.price || 0), tableLeft + 400, doc.y, { width: 80, align: 'right' });
      
      // Vẽ đường kẻ ngang
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
      
      // Tổng tiền
      doc.moveDown();
      doc.font('NotoSansBold').fontSize(10).text('Tổng cộng:', tableLeft + 300, doc.y, { width: 80, align: 'right' });
      doc.text(formatCurrency(data.price || 0), tableLeft + 400, doc.y, { width: 80, align: 'right' });
      
      // Trạng thái đơn hàng
      doc.moveDown(2);
      doc.font('NotoSansBold').fontSize(12);
      doc.text(`Trạng thái: `, 50, doc.y);
      
      // Hiển thị trạng thái với màu sắc tương ứng
      let statusText = 'Chưa xác định';
      let statusColor = '#000000';
      
      switch(data.status) {
        case 'pending':
          statusText = 'Chờ xác nhận';
          statusColor = '#FFA500'; // Orange
          break;
        case 'confirmed':
          statusText = 'Đã xác nhận';
          statusColor = '#4CAF50'; // Green
          break;
        case 'completed':
          statusText = 'Hoàn thành';
          statusColor = '#2196F3'; // Blue
          break;
        case 'cancelled':
          statusText = 'Đã hủy';
          statusColor = '#F44336'; // Red
          break;
      }
      
      doc.fillColor(statusColor).text(statusText, 120, doc.y - 12);
      doc.fillColor('#000000'); // Reset về màu đen
      
      // Lưu ý
      doc.moveDown(2);
      doc.font('NotoSansBold').fontSize(10).text('Lưu ý:');
      doc.font('NotoSans').fontSize(9);
      doc.text('- Vui lòng mang theo hóa đơn này khi lên xe.');
      doc.text('- Có mặt tại bến xe trước giờ xuất phát 30 phút để làm thủ tục.');
      doc.text('- Mang theo giấy tờ tùy thân để kiểm tra.');
      
      // Thông tin liên hệ
      doc.moveDown();
      doc.font('NotoSansBold').fontSize(10).text('Thông tin liên hệ:');
      doc.font('NotoSans').fontSize(9).text('Hotline: 1900 xxxx');
      
      // Footer
      doc.fontSize(8).text(
        'Email: support@example.com',
        50,
        doc.page.height - 50,
        { align: 'center' }
      );
      
      // Hoàn thành PDF
      doc.end();
      
      // Khi writeStream hoàn thành, trả về đường dẫn file
      writeStream.on('finish', () => {
        resolve(filePath);
      });
      
      writeStream.on('error', (err) => {
        reject(err);
      });
      
    } catch (error) {
      console.error('Lỗi khi tạo PDF:', error);
      reject(error);
    }
  });
};

// Helper format tiền tệ
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0
  }).format(amount);
} 