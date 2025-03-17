const db = require('../../config/database');

// Lấy tất cả loại vé
exports.getAllTicketTypes = async (req, res) => {
  try {
    const [ticketTypes] = await db.execute('SELECT * FROM ticket_types ORDER BY name');
    return res.success(ticketTypes);
  } catch (error) {
    console.error('Error fetching ticket types:', error);
    return res.error('Error fetching ticket types', 500);
  }
};

// Lấy loại vé theo ID
exports.getTicketTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const [ticketTypes] = await db.execute('SELECT * FROM ticket_types WHERE id = ?', [id]);
    
    if (ticketTypes.length === 0) {
      return res.error('Ticket type not found', 404);
    }
    
    return res.success(ticketTypes[0]);
  } catch (error) {
    console.error('Error fetching ticket type:', error);
    return res.error('Error fetching ticket type', 500);
  }
};

// Tạo loại vé mới (admin only)
exports.createTicketType = async (req, res) => {
  try {
    const { name, description, price_modifier } = req.body;
    
    if (!name) {
      return res.error('Name is required', 400);
    }
    
    // Check if name already exists
    const [existingTypes] = await db.execute(
      'SELECT * FROM ticket_types WHERE name = ?',
      [name]
    );
    
    if (existingTypes.length > 0) {
      return res.error('Ticket type with this name already exists', 400);
    }
    
    const [result] = await db.execute(
      'INSERT INTO ticket_types (name, description, price_modifier) VALUES (?, ?, ?)',
      [name, description || '', price_modifier || 1.0]
    );
    
    const [newTicketType] = await db.execute('SELECT * FROM ticket_types WHERE id = ?', [result.insertId]);
    
    return res.success(newTicketType[0], 'Ticket type created successfully', 201);
  } catch (error) {
    console.error('Error creating ticket type:', error);
    return res.error('Error creating ticket type', 500);
  }
};

// Cập nhật loại vé (admin only)
exports.updateTicketType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price_modifier } = req.body;
    
    // Check if ticket type exists
    const [ticketTypes] = await db.execute('SELECT * FROM ticket_types WHERE id = ?', [id]);
    if (ticketTypes.length === 0) {
      return res.error('Ticket type not found', 404);
    }
    
    // Prepare update data
    const updates = [];
    const params = [];
    
    if (name) {
      // Check if name already exists (excluding current ticket type)
      const [existingTypes] = await db.execute(
        'SELECT * FROM ticket_types WHERE name = ? AND id != ?',
        [name, id]
      );
      
      if (existingTypes.length > 0) {
        return res.error('Ticket type with this name already exists', 400);
      }
      
      updates.push('name = ?');
      params.push(name);
    }
    
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    
    if (price_modifier !== undefined) {
      if (isNaN(price_modifier) || price_modifier <= 0) {
        return res.error('Price modifier must be a positive number', 400);
      }
      
      updates.push('price_modifier = ?');
      params.push(price_modifier);
    }
    
    if (updates.length === 0) {
      return res.error('No fields to update', 400);
    }
    
    // Add id to params
    params.push(id);
    
    // Update ticket type
    await db.execute(
      `UPDATE ticket_types SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    // Get updated ticket type
    const [updatedTicketType] = await db.execute('SELECT * FROM ticket_types WHERE id = ?', [id]);
    
    return res.success(updatedTicketType[0], 'Ticket type updated successfully');
  } catch (error) {
    console.error('Error updating ticket type:', error);
    return res.error('Error updating ticket type', 500);
  }
};

// Xóa loại vé (admin only)
exports.deleteTicketType = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if ticket type exists
    const [ticketTypes] = await db.execute('SELECT * FROM ticket_types WHERE id = ?', [id]);
    if (ticketTypes.length === 0) {
      return res.error('Ticket type not found', 404);
    }
    
    // Check if ticket type is used in bookings
    const [bookings] = await db.execute(
      'SELECT COUNT(*) as count FROM bookings WHERE ticket_type_id = ?',
      [id]
    );
    
    if (bookings[0].count > 0) {
      return res.error('Cannot delete ticket type that is used in bookings', 400);
    }
    
    // Delete ticket type
    await db.execute('DELETE FROM ticket_types WHERE id = ?', [id]);
    
    return res.success(null, 'Ticket type deleted successfully');
  } catch (error) {
    console.error('Error deleting ticket type:', error);
    return res.error('Error deleting ticket type', 500);
  }
}; 