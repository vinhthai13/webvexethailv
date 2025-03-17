const express = require('express');
const router = express.Router();

// News page route
router.get('/', (req, res) => {
  res.render('user/news', { title: 'Tin tức' });
});

module.exports = router; 