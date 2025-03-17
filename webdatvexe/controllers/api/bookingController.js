const db = require('../../config/database');
const { regenerateAndSendInvoice } = require('./invoiceController');
const { generateInvoicePDF } = require('../../utils/pdfUtils');
const { sendEmailWithAttachment, createBookingConfirmationEmailContent } = require('../../utils/emailUtils');
const { generateInvoice } = require('../../helpers/invoiceGenerator');
const { sendBookingConfirmation } = require('../../helpers/emailService');
const Booking = require('../../models/user/Booking');

/**
 * Generate a random booking code
 * @returns {string} Random booking code in format BK-XXXXXX
 */
const generateRandomBookingCode = () => {
  // Generate a random 6-digit number
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `BK-${randomNum}`;
};

const bookingController = {
  // Create a booking
  createBooking: async (req, res) => {
    const { scheduleId, seatNumber, email } = req.body;
    const userId = req.user.id;

    if (!scheduleId || !seatNumber) {
      return res.status(400).json({ message: 'Thiếu thông tin: scheduleId và seatNumber là bắt buộc' });
    }

    let bookingId;
    let pdfBuffer;

    try {
      // Lấy thông tin lịch trình và kiểm tra tồn tại
      const [schedules] = await db.query(
        `SELECT s.*, r.name as route_name, r.departure as departure_location, r.arrival as arrival_location,
                t.price as ticket_price
         FROM schedules s
         JOIN routes r ON s.route_id = r.id 
         JOIN ticket_types t ON s.ticket_type_id = t.id
         WHERE s.id = ?`, 
        [scheduleId]
      );

      if (!schedules.length) {
        return res.status(404).json({ message: 'Không tìm thấy lịch trình' });
      }

      const schedule = schedules[0];
      
      // Kiểm tra chỗ ngồi đã được đặt chưa
      const [existingBookings] = await db.query(
        'SELECT * FROM bookings WHERE schedule_id = ? AND seat_number = ? AND status != "cancelled"',
        [scheduleId, seatNumber]
      );

      if (existingBookings.length > 0) {
        return res.status(400).json({ message: 'Chỗ ngồi đã được đặt' });
      }

      // Kiểm tra số chỗ còn lại
      if (schedule.available_seats <= 0) {
        return res.status(400).json({ message: 'Hết chỗ trống' });
      }

      // Lấy thông tin người dùng
      const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
      if (!users.length) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng' });
      }
      const user = users[0];

      // Generate a random booking code
      const booking_code = generateRandomBookingCode();

      // Tạo booking
      const totalAmount = schedule.ticket_price;
      const [result] = await db.query(
        `INSERT INTO bookings (user_id, schedule_id, seat_number, total_amount, ticket_price, status, email, booking_code, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [userId, scheduleId, seatNumber, totalAmount, schedule.ticket_price, 'pending', email || user.email, booking_code, new Date(), new Date()]
      );

      bookingId = result.insertId;
      
      // Cập nhật số chỗ trống
      await db.query('UPDATE schedules SET available_seats = available_seats - 1 WHERE id = ?', [scheduleId]);
      
      // Tạo invoice
      await db.query(
        `INSERT INTO invoices (booking_id, amount, created_at) 
         VALUES (?, ?, NOW())`,
        [bookingId, totalAmount]
      );
      
      // Lấy lại thông tin booking đã tạo
      const [newBookings] = await db.query(
        `SELECT * FROM bookings WHERE id = ?`,
        [bookingId]
      );
      
      if (!newBookings.length) {
        throw new Error('Không thể tìm thấy booking vừa tạo');
      }
      
      const booking = newBookings[0];
      
      // Tạo PDF hóa đơn
      try {
        const bookingData = {
          id: bookingId,
          booking_code: booking.booking_code,
          seat_number: seatNumber,
          seatNumber: seatNumber,
          ticket_price: schedule.ticket_price,
          ticketPrice: schedule.ticket_price,
          total_amount: totalAmount,
          totalAmount: totalAmount,
          status: booking.status,
          email: booking.email
        };
        
        console.log('Generating PDF for booking:', bookingId);
        pdfBuffer = await generateInvoicePDF(bookingData, user, schedule);
        console.log('PDF generated successfully. Size:', pdfBuffer ? pdfBuffer.length : 'N/A');
        
        // Gửi email xác nhận đặt vé
        const emailContent = createBookingConfirmationEmailContent(bookingData, user, schedule);
        
        const emailResult = await sendEmailWithAttachment(
          booking.email,
          'Xác nhận đặt vé thành công',
          emailContent,
          pdfBuffer,
          `hoa-don-dat-ve-${bookingId}.pdf`
        );
        
        console.log('Email sent:', emailResult.success ? 'Success' : 'Failed');
      } catch (error) {
        console.error('===== ERROR IN EMAIL PROCESS =====');
        console.error('Error details:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('===== END OF ERROR =====');
        
        // Vẫn lưu thông tin hóa đơn nếu chưa được lưu
        try {
          const [existingInvoice] = await db.query(
            'SELECT * FROM invoices WHERE booking_id = ?',
            [bookingId]
          );
          
          if (!existingInvoice.length) {
            await db.query(
              `INSERT INTO invoices (booking_id, amount, created_at) 
               VALUES (?, ?, NOW())`,
              [bookingId, totalAmount]
            );
            console.log('Invoice saved despite email error');
          }
        } catch (dbError) {
          console.error('Error saving invoice:', dbError);
        }
      }

      return res.status(201).json({
        message: 'Đặt vé thành công',
        booking: {
          id: bookingId,
          userId,
          scheduleId,
          seatNumber,
          totalAmount,
          status: 'pending',
          email: email || user.email,
          booking_code: booking.booking_code
        }
      });
    } catch (error) {
      console.error('Error in createBooking:', error);
      
      // Nếu đã tạo booking nhưng có lỗi, thử rollback
      if (bookingId) {
        try {
          await db.query('UPDATE schedules SET available_seats = available_seats + 1 WHERE id = ?', [scheduleId]);
          await db.query('DELETE FROM bookings WHERE id = ?', [bookingId]);
        } catch (rollbackError) {
          console.error('Error rolling back booking:', rollbackError);
        }
      }
      
      return res.status(500).json({ message: 'Đã xảy ra lỗi khi đặt vé' });
    }
  },

  // Get booking by ID
  getBookingById: async (req, res) => {
    try {
      const userId = req.tokenUser.id;
      const { id } = req.params;
      
      // Get booking with related data
      const [bookings] = await db.execute(`
        SELECT 
          b.id, b.schedule_id, b.passenger_name, b.passenger_phone, 
          b.seat_number, b.status, b.created_at, b.ticket_price, b.email,
          b.booking_code,
          s.departure_date, s.departure_time, s.vehicle_type,
          r.from_location, r.to_location
        FROM 
          bookings b
          JOIN schedules s ON b.schedule_id = s.id
          JOIN routes r ON s.route_id = r.id
        WHERE 
          b.id = ? AND b.user_id = ?
      `, [id, userId]);
      
      if (bookings.length === 0) {
        return res.error('Booking not found', 404);
      }
      
      return res.success(bookings[0]);
    } catch (error) {
      console.error('Error fetching booking:', error);
      return res.error('Error fetching booking', 500);
    }
  },

  // Admin: Get all bookings
  getAllBookings: async (req, res) => {
    try {
      const { status, schedule_id, date_from, date_to } = req.query;
      
      let sql = `
        SELECT 
          b.id, b.user_id, b.schedule_id, b.passenger_name, b.passenger_phone, 
          b.seat_number, b.status, b.created_at, b.ticket_price, b.email,
          b.booking_code,
          s.departure_date, s.departure_time, s.vehicle_type,
          r.from_location, r.to_location,
          u.username, u.email as user_email, u.phone as user_phone
        FROM 
          bookings b
          JOIN schedules s ON b.schedule_id = s.id
          JOIN routes r ON s.route_id = r.id
          LEFT JOIN users u ON b.user_id = u.id
        WHERE 1=1
      `;
      
      const params = [];
      
      if (status) {
        sql += ' AND b.status = ?';
        params.push(status);
      }
      
      if (schedule_id) {
        sql += ' AND b.schedule_id = ?';
        params.push(schedule_id);
      }
      
      if (date_from) {
        sql += ' AND s.departure_date >= ?';
        params.push(date_from);
      }
      
      if (date_to) {
        sql += ' AND s.departure_date <= ?';
        params.push(date_to);
      }
      
      sql += ' ORDER BY s.departure_date, s.departure_time';
      
      const [bookings] = await db.execute(sql, params);
      
      return res.success(bookings);
    } catch (error) {
      console.error('Error fetching all bookings:', error);
      return res.error('Error fetching all bookings', 500);
    }
  },

  // Update booking status (admin only)
  updateBookingStatus: async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ. Chỉ chấp nhận: pending, confirmed, cancelled' });
    }

    try {
      // Lấy thông tin booking hiện tại để so sánh trạng thái
      const [currentBooking] = await db.query('SELECT * FROM bookings WHERE id = ?', [id]);
      
      if (!currentBooking.length) {
        return res.status(404).json({ message: 'Không tìm thấy đơn đặt vé' });
      }
      
      const oldStatus = currentBooking[0].status;

      // Cập nhật trạng thái
      await db.query(
        'UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?',
        [status, id]
      );

      // Nếu trạng thái từ pending chuyển sang confirmed, gửi email xác nhận
      if (oldStatus !== 'confirmed' && status === 'confirmed') {
        try {
          await regenerateAndSendInvoice(id);
        } catch (error) {
          console.error('Error sending confirmation email:', error);
          // Không trả lỗi cho người dùng, chỉ log lỗi
        }
      }

      // Nếu chuyển sang trạng thái cancelled, cập nhật lại số ghế trống
      if (status === 'cancelled' && oldStatus !== 'cancelled') {
        await db.query(
          'UPDATE schedules SET available_seats = available_seats + 1 WHERE id = ?',
          [currentBooking[0].schedule_id]
        );
      }

      return res.status(200).json({
        message: 'Cập nhật trạng thái đặt vé thành công',
        booking: {
          id: parseInt(id),
          status
        }
      });
    } catch (error) {
      console.error('Error in updateBookingStatus:', error);
      return res.status(500).json({ message: 'Đã xảy ra lỗi khi cập nhật trạng thái đặt vé' });
    }
  },

  // Resend an invoice for a booking
  resendInvoice: async (req, res) => {
    const { id } = req.params;
    const { email } = req.body;
    const userId = req.user.id;

    try {
      // Kiểm tra booking tồn tại
      const [bookings] = await db.query(
        'SELECT * FROM bookings WHERE id = ?',
        [id]
      );

      if (!bookings.length) {
        return res.status(404).json({ message: 'Không tìm thấy đơn đặt vé' });
      }

      const booking = bookings[0];

      // Kiểm tra quyền truy cập (chỉ admin hoặc chủ sở hữu booking mới có quyền)
      if (!req.user.isAdmin && booking.user_id !== userId) {
        return res.status(403).json({ message: 'Không có quyền truy cập' });
      }

      // Gửi lại hóa đơn
      await regenerateAndSendInvoice(id, email || booking.email);

      return res.status(200).json({ message: 'Gửi lại hóa đơn thành công' });
    } catch (error) {
      console.error('Error in resendInvoice:', error);
      return res.status(500).json({ message: 'Đã xảy ra lỗi khi gửi lại hóa đơn' });
    }
  }
};

module.exports = bookingController; 