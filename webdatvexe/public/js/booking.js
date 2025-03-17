document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('bookingForm');
  const seatsInput = document.getElementById('seats');
  const totalPriceElement = document.getElementById('totalPrice');
  
  // Lấy giá vé từ input hidden hoặc data attribute
  const priceInput = document.querySelector('input[name="price"]');
  const price = priceInput ? parseInt(priceInput.value) : 0;

  // Tính tổng tiền khi thay đổi số lượng vé
  if (seatsInput && totalPriceElement) {
    seatsInput.addEventListener('input', function() {
      const seats = parseInt(this.value) || 0;
      const total = seats * price;
      totalPriceElement.textContent = total.toLocaleString('vi-VN') + 'đ';
    });
  }

  // Xử lý submit form
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      try {
        // Hiển thị thông báo đang xử lý
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
        
        // Lấy dữ liệu từ form
        const formData = {
          schedule_id: document.querySelector('input[name="schedule_id"]').value,
          customer_name: document.getElementById('customer_name').value,
          phone: document.getElementById('phone').value,
          email: document.getElementById('email').value,
          seats: parseInt(document.getElementById('seats').value || '1')
        };

        console.log('Submitting booking data:', formData);

        // Gửi dữ liệu lên server
        const response = await fetch('/dat-ve', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        });

        const data = await response.json();
        
        if (data.success) {
          console.log('Booking success, ID:', data.bookingId);
          alert('Đặt vé thành công! Thông tin vé đã được gửi đến email của bạn.');
          window.location.href = `/dat-ve/chi-tiet/${data.bookingId}`;
        } else {
          console.error('Booking failed:', data.message);
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
          alert(data.message || 'Có lỗi xảy ra khi đặt vé');
        }
      } catch (err) {
        console.error('Error submitting booking:', err);
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Xác nhận đặt vé';
        alert('Có lỗi xảy ra khi đặt vé. Vui lòng thử lại sau.');
      }
    });
  } else {
    console.error('Booking form not found on page');
  }
}); 