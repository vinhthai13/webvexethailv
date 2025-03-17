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

// Handle booking status update
function updateBookingStatus(bookingId, statusId) {
  fetch(`/admin/bookings/${bookingId}/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ statusId })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Reload page to show updated status
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

// Handle booking deletion
function deleteBooking(bookingId) {
  if (confirm('Bạn có chắc chắn muốn xóa đơn đặt vé này?')) {
    fetch(`/admin/bookings/${bookingId}`, {
      method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Remove booking row from table
        document.getElementById(`booking-${bookingId}`).remove();
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

// Handle schedule deletion
function deleteSchedule(scheduleId) {
  if (confirm('Bạn có chắc chắn muốn xóa lịch trình này?')) {
    fetch(`/admin/schedules/${scheduleId}`, {
      method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Remove schedule row from table
        document.getElementById(`schedule-${scheduleId}`).remove();
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

// Handle route deletion
function deleteRoute(routeId) {
  if (confirm('Bạn có chắc chắn muốn xóa tuyến xe này?')) {
    fetch(`/admin/routes/${routeId}`, {
      method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Remove route row from table
        document.getElementById(`route-${routeId}`).remove();
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

// Initialize tooltips
document.addEventListener('DOMContentLoaded', function() {
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  var tooltipList = tooltipTriggerList.map(function(tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
}); 