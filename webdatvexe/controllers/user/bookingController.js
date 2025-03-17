const Booking = require('../../models/user/Booking');
const Schedule = require('../../models/user/Schedule');
const Route = require('../../models/user/Route');
const db = require('../../config/database');
const { generateInvoicePDF } = require('../../utils/pdfUtils');
const { sendEmailWithAttachment, createBookingConfirmationEmailContent } = require('../../utils/emailUtils');

class BookingController {
 
  async showBookingForm(req, res) {
    const { id } = req.params;
    
    // Nếu không có ID, hiển thị trang lịch trình để chọn
    if (!id) {
      return res.redirect('/lich-trinh');
    }
    
    // Validate ID parameter
    if (isNaN(parseInt(id))) {
      return res.render('error', { 
        message: 'ID lịch trình không hợp lệ',
        error: { status: 400 }
      });
    }
    
    try {
      // Lấy thông tin lịch trình
      const schedule = await Schedule.findById(parseInt(id));
      
      if (!schedule) {
        return res.render('error', { 
          message: 'Không tìm thấy lịch trình',
          error: { status: 404 }
        });
      }
      
      // Hiển thị form đặt vé
      res.render('user/bookings/form', { 
        title: 'Đặt vé',
        schedule,
        user: req.session.user
      });
    } catch (err) {
      console.error('Error loading booking form:', err);
      res.render('error', { 
        message: 'Có lỗi xảy ra khi tải trang đặt vé',
        error: { status: 500 }
      });
    }
  }

  // Hiển thị trang chi tiết đặt vé
  async showBookingDetail(req, res) {
    const { id } = req.params;
    
    try {
      const booking = await Booking.findById(id);
      
      if (!booking) {
        return res.render('error', { 
          message: 'Không tìm thấy thông tin đặt vé',
          error: { status: 404 }
        });
      }
      
      res.render('user/bookings/detail', { 
        title: 'Chi tiết đặt vé',
        booking
      });
    } catch (err) {
      console.error('Error loading booking detail:', err);
      res.render('error', { 
        message: 'Có lỗi xảy ra khi tải chi tiết đặt vé',
        error: { status: 500 }
      });
    }
  }

  // POST /dat-ve
  async createBooking(req, res) {
    const conn = await db.getConnection();
    console.log('===== BOOKING REQUEST RECEIVED =====');
    console.log('Request body:', JSON.stringify(req.body));
    try {
      await conn.beginTransaction();

      const { schedule_id, customer_name, phone, email, seats } = req.body;
      const userId = req.session.user?.id;
      console.log('User ID:', userId);
      console.log('Schedule ID:', schedule_id);
      console.log('Customer name:', customer_name);
      console.log('Phone:', phone);
      console.log('Email:', email);
      console.log('Seats:', seats);

      // Validate input
      if (!schedule_id || !customer_name || !phone || !email || !seats) {
        console.log('Missing required fields');
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: 'Vui lòng điền đầy đủ thông tin'
        });
      }

      // Validate schedule_id is numeric
      const scheduleId = parseInt(schedule_id);
      if (isNaN(scheduleId)) {
        console.log('Invalid schedule ID:', schedule_id);
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: 'ID lịch trình không hợp lệ'
        });
      }

      // Kiểm tra và lấy thông tin lịch trình
      const schedule = await Schedule.findById(scheduleId);
      if (!schedule) {
        console.log('Schedule not found');
        await conn.rollback();
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lịch trình'
        });
      }
      
      console.log('Schedule found:', JSON.stringify(schedule));

      // Parse số ghế sang số nguyên
      const seatsCount = parseInt(seats);
      if (isNaN(seatsCount) || seatsCount <= 0) {
        console.log('Invalid seats count:', seats);
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: 'Số ghế không hợp lệ'
        });
      }

      // Kiểm tra số ghế
      if (schedule.available_seats < seatsCount) {
        console.log(`Not enough seats available: requested ${seatsCount}, available ${schedule.available_seats}`);
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `Chỉ còn ${schedule.available_seats} ghế trống`
        });
      }

      const total_price = schedule.price * seatsCount;
      console.log('Total price calculated:', total_price);

      // Tạo booking
      const bookingData = {
        user_id: userId || null,  // Allow null for non-logged in users
        schedule_id: scheduleId,
        seats: seatsCount,
        total_price,
        customer_name,
        phone,
        email
      };
      
      console.log('Booking data prepared:', JSON.stringify(bookingData));

      try {
        // Cập nhật số ghế
        console.log('Updating available seats...');
        const updated = await Schedule.updateSeats(scheduleId, seatsCount);
        if (!updated) {
          throw new Error('Không thể cập nhật số ghế');
        }
        console.log('Available seats updated successfully');

        // Tạo booking với random booking code
        console.log('Creating booking record...');
        const bookingId = await Booking.create(bookingData);
        console.log('Booking created with ID:', bookingId);

        // Commit transaction
        await conn.commit();
        console.log('Database transaction committed');

        // Lấy booking details để đảm bảo dữ liệu đã được lưu
        const bookingDetail = await Booking.findById(bookingId);
        if (!bookingDetail) {
          console.error('Warning: Booking was created but could not be retrieved');
        } else {
          console.log('Booking details retrieved:', JSON.stringify(bookingDetail));
          console.log('Booking code generated:', bookingDetail.booking_code);
        }

        // Gửi email xác nhận đặt vé 
        try {
          console.log('===== SENDING BOOKING CONFIRMATION EMAIL =====');
          console.log('Booking ID:', bookingId);
          console.log('Customer email:', email);
          
          // Lấy thông tin chi tiết booking
          const bookingDetail = await Booking.findById(bookingId);
          
          if (!bookingDetail) {
            throw new Error('Không tìm thấy thông tin đặt vé');
          }
          
          // Lấy thông tin người dùng (nếu có)
          let userData = {
            fullName: customer_name,
            phone: phone,
            email: email
          };
          
          if (userId) {
            const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
            if (users.length > 0) {
              userData = {
                ...userData,
                id: users[0].id,
                username: users[0].username,
                fullName: users[0].full_name || customer_name
              };
            }
          }
          
          // Chuẩn bị dữ liệu cho email
          const bookingForEmail = {
            id: bookingId,
            booking_code: bookingDetail.booking_code,
            seat_number: seatsCount > 1 ? `${seatsCount} ghế` : '1 ghế',
            seatNumber: seatsCount > 1 ? `${seatsCount} ghế` : '1 ghế',
            ticket_price: schedule.price,
            ticketPrice: schedule.price,
            total_amount: total_price,
            totalAmount: total_price,
            status: 'pending',
            email: email,
            created_at: new Date(),
            createdAt: new Date()
          };
          
          console.log('Preparing email data:', { 
            booking: bookingId,
            email: email,
            seats: seatsCount,
            totalPrice: total_price,
            booking_code: bookingDetail.booking_code
          });
          
          // Tạo PDF hóa đơn
          const pdfBuffer = await generateInvoicePDF(bookingForEmail, userData, schedule);
          console.log('PDF generated successfully, buffer size:', pdfBuffer ? pdfBuffer.length : 'NULL');
          
          // Tạo nội dung email
          const emailContent = createBookingConfirmationEmailContent(bookingForEmail, userData, schedule);
          console.log('Email content generated successfully');
          
          const fileName = `hoa-don-dat-ve-${bookingId}.pdf`;
          
          // Gửi email
          const emailResult = await sendEmailWithAttachment(
            email,
            'Xác nhận đặt vé thành công',
            emailContent,
            pdfBuffer,
            fileName
          );
          
          if (emailResult.success) {
            console.log('Email sent successfully:', emailResult.messageId);
          } else {
            console.error('Failed to send email:', emailResult.error);
            
            // Có thể thêm logic thử lại hoặc sử dụng phương thức gửi email dự phòng ở đây
          }
          
          console.log('===== END EMAIL SENDING PROCESS =====');
        } catch (emailError) {
          // Chỉ log lỗi, không làm gián đoạn quá trình đặt vé
          console.error('===== ERROR SENDING EMAIL =====');
          console.error('Error details:', emailError);
          console.error('Error message:', emailError.message);
          console.error('===== END OF ERROR =====');
        }

        console.log('Sending success response to client');
        res.json({
          success: true,
          message: 'Đặt vé thành công',
          bookingId
        });

      } catch (err) {
        await conn.rollback();
        console.error('Error creating booking:', err);
        res.status(500).json({
          success: false,
          message: err.message || 'Có lỗi xảy ra khi đặt vé'
        });
      }

    } catch (err) {
      await conn.rollback();
      console.error('Error creating booking:', err);
      res.status(500).json({
        success: false,
        message: err.message || 'Có lỗi xảy ra khi đặt vé'
      });
    } finally {
      conn.release();
    }
  }

  // GET /dat-ve/chi-tiet/:id
  async getBookingDetails(req, res) {
    try {
      const bookingId = req.params.id;
      const userId = req.session.user.id;

      const booking = await Booking.findById(bookingId);
      
      if (!booking || booking.user_id !== userId) {
        return res.status(404).render('error', {
          title: 'Lỗi',
          message: 'Không tìm thấy thông tin đặt vé'
        });
      }

      res.render('user/bookings/details', {
        title: 'Chi tiết đặt vé',
        booking
      });
    } catch (err) {
      console.error('Error getting booking details:', err);
      res.status(500).render('error', {
        title: 'Lỗi',
        message: 'Có lỗi xảy ra khi tải thông tin đặt vé'
      });
    }
  }

  // GET /dat-ve/lich-su
  async getBookingHistory(req, res) {
    try {
      const userId = req.session.user?.id;
      if (!userId) {
        return res.redirect('/login');
      }

      const bookings = await Booking.findByUserId(userId);

      res.render('user/bookings/history', {
        title: 'Lịch sử đặt vé',
        bookings
      });
    } catch (err) {
      console.error('Error getting booking history:', err);
      res.render('error', {
        title: 'Lỗi',
        message: 'Có lỗi xảy ra khi tải lịch sử đặt vé'
      });
    }
  }

  // POST /dat-ve/huy/:id
  async cancelBooking(req, res) {
    try {
      const bookingId = req.params.id;
      const userId = req.session.user.id;

      const booking = await Booking.findById(bookingId);
      
      if (!booking || booking.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin đặt vé'
        });
      }

      // Chỉ cho phép hủy vé chưa được xác nhận
      if (booking.status_id !== 1) {
        return res.status(400).json({
          success: false,
          message: 'Không thể hủy vé đã được xác nhận'
        });
      }

      // Cập nhật trạng thái vé thành "Đã hủy"
      await Booking.updateStatus(bookingId, 3);

      // Hoàn trả số ghế
      await Schedule.updateAvailableSeats(booking.schedule_id, booking.seats);

      res.json({
        success: true,
        message: 'Hủy vé thành công'
      });
    } catch (err) {
      console.error('Error canceling booking:', err);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi hủy vé'
      });
    }
  }
}

module.exports = new BookingController(); 