const express = require('express');
const router = express.Router();
const searchController = require('../../controllers/user/searchController');

router.get('/', searchController.showSearchForm);
router.get('/results', searchController.search);

module.exports = router; 