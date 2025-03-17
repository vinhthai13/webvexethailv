const express = require('express');
const router = express.Router();
const routeController = require('../../controllers/api/routeController');
const { verifyToken, verifyAdminToken } = require('../../middleware/token');

// Public routes
router.get('/', routeController.getAllRoutes);
router.get('/locations', routeController.getLocations);
router.get('/:id', routeController.getRouteById);

// Protected admin routes
router.post('/', verifyAdminToken, routeController.createRoute);
router.put('/:id', verifyAdminToken, routeController.updateRoute);
router.delete('/:id', verifyAdminToken, routeController.deleteRoute);

module.exports = router; 