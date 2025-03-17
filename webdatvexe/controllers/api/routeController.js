const db = require('../../config/database');

// Get all routes
exports.getAllRoutes = async (req, res) => {
  try {
    const [routes] = await db.execute('SELECT * FROM routes ORDER BY from_location');
    return res.success(routes);
  } catch (error) {
    console.error('Error fetching routes:', error);
    return res.error('Error fetching routes', 500);
  }
};

// Get route by ID
exports.getRouteById = async (req, res) => {
  try {
    const { id } = req.params;
    const [routes] = await db.execute('SELECT * FROM routes WHERE id = ?', [id]);
    
    if (routes.length === 0) {
      return res.error('Route not found', 404);
    }
    
    return res.success(routes[0]);
  } catch (error) {
    console.error('Error fetching route:', error);
    return res.error('Error fetching route', 500);
  }
};

// Get unique locations (from and to)
exports.getLocations = async (req, res) => {
  try {
    const [fromLocations] = await db.execute('SELECT DISTINCT from_location FROM routes ORDER BY from_location');
    const [toLocations] = await db.execute('SELECT DISTINCT to_location FROM routes ORDER BY to_location');
    
    const locations = {
      from: fromLocations.map(item => item.from_location),
      to: toLocations.map(item => item.to_location)
    };
    
    return res.success(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    return res.error('Error fetching locations', 500);
  }
};

// Create route
exports.createRoute = async (req, res) => {
  try {
    const { from_location, to_location, distance, duration, description, price } = req.body;
    
    // Validate required fields
    if (!from_location || !to_location || !distance || !duration || !price) {
      return res.error('Required fields missing', 400);
    }
    
    // Check if route already exists
    const [existingRoutes] = await db.execute(
      'SELECT * FROM routes WHERE from_location = ? AND to_location = ?',
      [from_location, to_location]
    );
    
    if (existingRoutes.length > 0) {
      return res.error('Route already exists', 400);
    }
    
    // Insert new route
    const [result] = await db.execute(
      'INSERT INTO routes (from_location, to_location, distance, duration, description, price) VALUES (?, ?, ?, ?, ?, ?)',
      [from_location, to_location, distance, duration, description || '', price]
    );
    
    // Get the created route
    const [newRoutes] = await db.execute('SELECT * FROM routes WHERE id = ?', [result.insertId]);
    
    return res.success(newRoutes[0], 'Route created successfully', 201);
  } catch (error) {
    console.error('Error creating route:', error);
    return res.error('Error creating route', 500);
  }
};

// Update route
exports.updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const { from_location, to_location, distance, duration, description, price } = req.body;
    
    // Check if route exists
    const [routes] = await db.execute('SELECT * FROM routes WHERE id = ?', [id]);
    if (routes.length === 0) {
      return res.error('Route not found', 404);
    }
    
    // Prepare update data
    const updates = [];
    const params = [];
    
    if (from_location) {
      updates.push('from_location = ?');
      params.push(from_location);
    }
    
    if (to_location) {
      updates.push('to_location = ?');
      params.push(to_location);
    }
    
    if (distance) {
      updates.push('distance = ?');
      params.push(distance);
    }
    
    if (duration) {
      updates.push('duration = ?');
      params.push(duration);
    }
    
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    
    if (price !== undefined) {
      updates.push('price = ?');
      params.push(price);
    }
    
    if (updates.length === 0) {
      return res.error('No fields to update', 400);
    }
    
    // Check if updated route would duplicate existing route
    if (from_location && to_location) {
      const [existingRoutes] = await db.execute(
        'SELECT * FROM routes WHERE from_location = ? AND to_location = ? AND id != ?',
        [from_location, to_location, id]
      );
      
      if (existingRoutes.length > 0) {
        return res.error('Route with these locations already exists', 400);
      }
    }
    
    // Add id to params
    params.push(id);
    
    // Update route
    await db.execute(
      `UPDATE routes SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    // Get updated route
    const [updatedRoutes] = await db.execute('SELECT * FROM routes WHERE id = ?', [id]);
    
    return res.success(updatedRoutes[0], 'Route updated successfully');
  } catch (error) {
    console.error('Error updating route:', error);
    return res.error('Error updating route', 500);
  }
};

// Delete route
exports.deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if route exists
    const [routes] = await db.execute('SELECT * FROM routes WHERE id = ?', [id]);
    if (routes.length === 0) {
      return res.error('Route not found', 404);
    }
    
    // Check if route is used in schedules
    const [schedules] = await db.execute(
      'SELECT COUNT(*) as count FROM schedules WHERE route_id = ?',
      [id]
    );
    
    if (schedules[0].count > 0) {
      return res.error('Cannot delete route with existing schedules', 400);
    }
    
    // Delete route
    await db.execute('DELETE FROM routes WHERE id = ?', [id]);
    
    return res.success(null, 'Route deleted successfully');
  } catch (error) {
    console.error('Error deleting route:', error);
    return res.error('Error deleting route', 500);
  }
}; 