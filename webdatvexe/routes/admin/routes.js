const express = require('express');
const router = express.Router();
const adminRouteController = require('../../controllers/admin/adminRouteController');

// List routes
router.get('/', adminRouteController.getAllRoutes);

// Create route
router.get('/create', adminRouteController.showCreateForm);
router.post('/', adminRouteController.createRoute);

// Edit route
router.get('/:id/edit', adminRouteController.showEditForm);
router.post('/:id', adminRouteController.updateRoute);

// Delete route
router.post('/:id/delete', adminRouteController.deleteRoute);

module.exports = router; 