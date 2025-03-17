const express = require('express');
const router = express.Router();
const adminUserController = require('../../controllers/admin/adminUserController');

// List all users
router.get('/', adminUserController.getAllUsers);

// Show create user form
router.get('/create', adminUserController.showCreateForm);

// Create new user
router.post('/', adminUserController.createUser);

// Show edit user form
router.get('/:id/edit', adminUserController.showEditForm);

// Update user
router.post('/:id', adminUserController.updateUser);

// Show user details
router.get('/:id', adminUserController.getUserDetails);

// Delete user
router.post('/:id/delete', adminUserController.deleteUser);

module.exports = router; 