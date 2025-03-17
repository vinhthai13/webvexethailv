const db = require('../../config/database');
const Schedule = require('../../models/Schedule');

// Get all schedules
exports.getAllSchedules = async (req, res) => {
  try {
    const [schedules] = await db.execute(`
      SELECT s.*, r.from_location, r.to_location 
      FROM schedules s
      JOIN routes r ON s.route_id = r.id
      ORDER BY s.departure_date, s.departure_time
    `);
    
    return res.success(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return res.error('Error fetching schedules', 500);
  }
};

// Get upcoming schedules
exports.getUpcomingSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.getUpcoming();
    return res.success(schedules);
  } catch (error) {
    console.error('Error fetching upcoming schedules:', error);
    return res.error('Error fetching upcoming schedules', 500);
  }
};

// Get schedule by ID
exports.getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await Schedule.getById(id);
    
    if (!schedule) {
      return res.error('Schedule not found', 404);
    }
    
    return res.success(schedule);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return res.error('Error fetching schedule', 500);
  }
};

// Search schedules
exports.searchSchedules = async (req, res) => {
  try {
    const { from, to, date } = req.query;
    
    if (!from && !to && !date) {
      return res.error('At least one search parameter is required', 400);
    }
    
    const schedules = await Schedule.search({ from, to, date });
    return res.success(schedules);
  } catch (error) {
    console.error('Error searching schedules:', error);
    return res.error('Error searching schedules', 500);
  }
};

// Create schedule
exports.createSchedule = async (req, res) => {
  try {
    const { route_id, departure_date, departure_time, vehicle_type, available_seats, price } = req.body;
    
    // Validate required fields
    if (!route_id || !departure_date || !departure_time || !vehicle_type || !available_seats || !price) {
      return res.error('All fields are required', 400);
    }
    
    // Check if route exists
    const [routes] = await db.execute('SELECT * FROM routes WHERE id = ?', [route_id]);
    if (routes.length === 0) {
      return res.error('Route not found', 404);
    }
    
    // Insert new schedule
    const [result] = await db.execute(
      'INSERT INTO schedules (route_id, departure_date, departure_time, vehicle_type, available_seats, price) VALUES (?, ?, ?, ?, ?, ?)',
      [route_id, departure_date, departure_time, vehicle_type, available_seats, price]
    );
    
    // Get the created schedule
    const newSchedule = await Schedule.getById(result.insertId);
    
    return res.success(newSchedule, 'Schedule created successfully', 201);
  } catch (error) {
    console.error('Error creating schedule:', error);
    return res.error('Error creating schedule', 500);
  }
};

// Update schedule
exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { route_id, departure_date, departure_time, vehicle_type, available_seats, price } = req.body;
    
    // Check if schedule exists
    const schedule = await Schedule.getById(id);
    if (!schedule) {
      return res.error('Schedule not found', 404);
    }
    
    // Prepare update data
    const updates = [];
    const params = [];
    
    if (route_id) {
      // Check if route exists
      const [routes] = await db.execute('SELECT * FROM routes WHERE id = ?', [route_id]);
      if (routes.length === 0) {
        return res.error('Route not found', 404);
      }
      updates.push('route_id = ?');
      params.push(route_id);
    }
    
    if (departure_date) {
      updates.push('departure_date = ?');
      params.push(departure_date);
    }
    
    if (departure_time) {
      updates.push('departure_time = ?');
      params.push(departure_time);
    }
    
    if (vehicle_type) {
      updates.push('vehicle_type = ?');
      params.push(vehicle_type);
    }
    
    if (available_seats !== undefined) {
      updates.push('available_seats = ?');
      params.push(available_seats);
    }
    
    if (price !== undefined) {
      updates.push('price = ?');
      params.push(price);
    }
    
    if (updates.length === 0) {
      return res.error('No fields to update', 400);
    }
    
    // Add id to params
    params.push(id);
    
    // Update schedule
    await db.execute(
      `UPDATE schedules SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    // Get updated schedule
    const updatedSchedule = await Schedule.getById(id);
    
    return res.success(updatedSchedule, 'Schedule updated successfully');
  } catch (error) {
    console.error('Error updating schedule:', error);
    return res.error('Error updating schedule', 500);
  }
};

// Delete schedule
exports.deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if schedule exists
    const schedule = await Schedule.getById(id);
    if (!schedule) {
      return res.error('Schedule not found', 404);
    }
    
    // Check if schedule has bookings
    const [bookings] = await db.execute(
      'SELECT COUNT(*) as count FROM bookings WHERE schedule_id = ?',
      [id]
    );
    
    if (bookings[0].count > 0) {
      return res.error('Cannot delete schedule with existing bookings', 400);
    }
    
    // Delete schedule
    await db.execute('DELETE FROM schedules WHERE id = ?', [id]);
    
    return res.success(null, 'Schedule deleted successfully');
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return res.error('Error deleting schedule', 500);
  }
}; 