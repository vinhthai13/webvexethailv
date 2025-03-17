const express = require('express');
const router = express.Router();
const ticketTypeController = require('../../controllers/api/ticketTypeController');
const { verifyToken, verifyAdminToken } = require('../../middleware/token');

// Public routes
router.get('/', ticketTypeController.getAllTicketTypes);
router.get('/:id', ticketTypeController.getTicketTypeById);

// Admin-only routes
router.post('/', verifyAdminToken, ticketTypeController.createTicketType);
router.put('/:id', verifyAdminToken, ticketTypeController.updateTicketType);
router.delete('/:id', verifyAdminToken, ticketTypeController.deleteTicketType);

module.exports = router; 