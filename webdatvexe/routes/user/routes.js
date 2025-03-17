const express = require('express');
const router = express.Router();
const routeController = require('../../controllers/user/routeController');

// Route list route
router.get('/', routeController.index);

// Route details route
router.get('/:id', routeController.getRouteDetails);

// API routes
router.get('/api/tuyen-xe', routeController.getRoutesApi);
router.get('/api/tuyen-xe/search', routeController.searchRoutes);

module.exports = router; 