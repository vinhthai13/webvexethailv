// Format currency function
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

// Format date function
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Handle seat selection
function toggleSeat(seatElement) {
  if (!seatElement.classList.contains('occupied')) {
    seatElement.classList.toggle('selected');
    updateSelectedSeats();
  }
}

// Update selected seats and total price
function updateSelectedSeats() {
  const selectedSeats = document.querySelectorAll('.seat.selected');
  const seatNumbers = Array.from(selectedSeats).map(seat => seat.dataset.number);
  const totalSeats = selectedSeats.length;
  const pricePerSeat = parseFloat(document.getElementById('pricePerSeat').value);
  const totalPrice = totalSeats * pricePerSeat;

  document.getElementById('selectedSeats').value = seatNumbers.join(',');
  document.getElementById('seats').value = totalSeats;
  document.getElementById('totalPrice').value = totalPrice;
  document.getElementById('displayTotalPrice').textContent = formatCurrency(totalPrice);
}

// Handle booking cancellation
function cancelBooking(bookingId) {
  if (confirm('Bạn có chắc chắn muốn hủy đơn đặt vé này?')) {
    fetch(`/dat-ve/huy/${bookingId}`, {
      method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        location.reload();
      } else {
        alert(data.message || 'Có lỗi xảy ra');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Có lỗi xảy ra');
    });
  }
}

// Search schedules
function searchSchedules() {
  const from = document.getElementById('from').value;
  const to = document.getElementById('to').value;
  const date = document.getElementById('date').value;

  fetch(`/api/lich-trinh/search?from=${from}&to=${to}&date=${date}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        updateScheduleTable(data.data);
      } else {
        alert(data.message || 'Có lỗi xảy ra');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Có lỗi xảy ra');
    });
}

// Update schedule table
function updateScheduleTable(schedules) {
  const tbody = document.querySelector('#scheduleTable tbody');
  tbody.innerHTML = '';

  schedules.forEach(schedule => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${schedule.from_location} - ${schedule.to_location}</td>
      <td>${formatDate(schedule.departure_time)}</td>
      <td>${schedule.bus_type}</td>
      <td>${formatCurrency(schedule.price)}</td>
      <td>${schedule.available_seats}</td>
      <td>
        <a href="/dat-ve/form?schedule=${schedule.id}" class="btn btn-primary btn-sm">
          Đặt vé
        </a>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Initialize tooltips
document.addEventListener('DOMContentLoaded', function() {
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  var tooltipList = tooltipTriggerList.map(function(tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
}); 