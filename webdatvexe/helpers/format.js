exports.formatDate = (date) => {
  return new Date(date).toLocaleDateString('vi-VN');
};

exports.formatCurrency = (amount) => {
  return amount.toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND'
  });
}; 