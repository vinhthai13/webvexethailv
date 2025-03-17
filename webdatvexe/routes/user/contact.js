const express = require('express');
const router = express.Router();

// Contact page route
router.get('/', (req, res) => {
  res.render('user/contact', { title: 'Liên hệ' });
});

module.exports = router; 