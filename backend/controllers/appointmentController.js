const pool = require('../config/db');

exports.createAppointment = async (req, res) => {
  let { counselor_id, date, time, student_id } = req.body;

  // For students, set student_id from the authenticated user
  if (req.user.role === 'student') {
    student_id = req.user.id;
    // Validate that counselor_id is provided
    if (!counselor_id) return res.status(400).json({ message: 'counselor_id is required' });
  }
  // For counselors, set counselor_id from the authenticated user
  else if (req.user.role === 'counselor') {
    counselor_id = req.user.id;
    // Validate that student_id is provided
    if (!student_id) return res.status(400).json({ message: 'student_id is required when counselor creates' });
  }
  // If neither student nor counselor, reject
  else {
    return res.status(403).json({ message: 'Only students and counselors can create appointments' });
  }

  // Validate required fields
  if (!date || !time) return res.status(400).json({ message: 'date and time are required' });

  if (isNaN(Date.parse(date))) return res.status(400).json({ message: 'Invalid date format' });

  if (!/^\d{2}:\d{2}(?::\d{2})?$/.test(time)) return res.status(400).json({ message: 'Invalid time format' });

  // Validate hour-based time slot (8am-4pm = 08:00-16:00)
  const timeParts = time.split(':');
  const hour = parseInt(timeParts[0]);
  const minutes = parseInt(timeParts[1] || 0);
  
  // Only allow full hours (8, 9, 10, 11, 12, 13, 14, 15, 16) with 00 minutes
  if (hour < 8 || hour > 16 || minutes !== 0) {
    return res.status(400).json({ message: 'Time must be a full hour between 8:00 AM and 4:00 PM' });
  }

  try {
    // Validate counselor
    const [cRows] = await pool.query('SELECT id, role FROM users WHERE id = ?', [counselor_id]);
    if (!cRows.length) return res.status(400).json({ message: 'Counselor not found' });
    if (cRows[0].role !== 'counselor') return res.status(400).json({ message: 'User is not a counselor' });

    // Validate student
    const [sRows] = await pool.query('SELECT id, role FROM users WHERE id = ?', [student_id]);
    if (!sRows.length) return res.status(400).json({ message: 'Student not found' });
    if (sRows[0].role !== 'student') return res.status(400).json({ message: 'User is not a student' });

    // Check for existing appointment - exclude cancelled appointments
    const [existing] = await pool.query(
      'SELECT id FROM appointments WHERE counselor_id = ? AND date = ? AND time = ? AND status != ?', 
      [counselor_id, date, time, 'cancelled']
    );
    if (existing.length) return res.status(400).json({ message: 'That counselor already has an appointment at that date and time' });

    const [result] = await pool.query(
      'INSERT INTO appointments (student_id, counselor_id, date, time, status) VALUES (?, ?, ?, ?, ?)',
      [student_id, counselor_id, date, time, 'pending']
    );
    const [rows] = await pool.query('SELECT * FROM appointments WHERE id = ?', [result.insertId]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAppointments = async (req, res) => {
  try {
    const search = req.query.search || '';
    let sortBy = req.query.sortBy || 'date';
    let sortOrder = req.query.sortOrder || 'asc';
    
    // Validate sort parameters
    const validSortColumns = ['date', 'time', 'student_name', 'counselor_name', 'status'];
    const validSortOrders = ['asc', 'desc'];
    
    if (!validSortColumns.includes(sortBy)) {
      sortBy = 'date';
    }
    
    if (!validSortOrders.includes(sortOrder)) {
      sortOrder = 'asc';
    }
    
    if (req.user.role === 'counselor') {
      let query = `
        SELECT a.*, s.name AS student_name, s.email AS student_email, 
               c.name AS counselor_name 
        FROM appointments a 
        JOIN users s ON a.student_id = s.id 
        JOIN users c ON a.counselor_id = c.id 
        WHERE a.counselor_id = ?
      `;
      const params = [req.user.id];
      
      // Add search filter for student name or email (partial match)
      if (search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        query += ' AND (s.name LIKE ? OR s.email LIKE ?)';
        params.push(searchTerm, searchTerm);
      }
      
      // Add sorting
      let sortColumn;
      switch (sortBy) {
        case 'student_name':
          sortColumn = 's.name';
          break;
        case 'counselor_name':
          sortColumn = 'c.name';
          break;
        case 'status':
          sortColumn = 'a.status';
          break;
        case 'date':
          sortColumn = 'a.date';
          break;
        case 'time':
          sortColumn = 'a.time';
          break;
        default:
          sortColumn = 'a.date';
      }
      
      query += ` ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}`;
      const [rows] = await pool.query(query, params);
      return res.json(rows);
    }

    // For students, search by counselor name
    let query = `SELECT a.*, s.name AS student_name, s.email AS student_email, c.name AS counselor_name 
                 FROM appointments a 
                 JOIN users s ON a.student_id = s.id 
                 JOIN users c ON a.counselor_id = c.id 
                 WHERE a.student_id = ?`;
    const params = [req.user.id];
    
    // Add search filter for counselor name (partial match)
    if (search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      query += ' AND c.name LIKE ?';
      params.push(searchTerm);
    }
    
    // Add sorting
    let sortColumn;
    switch (sortBy) {
      case 'student_name':
        sortColumn = 's.name';
        break;
      case 'counselor_name':
        sortColumn = 'c.name';
        break;
      case 'status':
        sortColumn = 'a.status';
        break;
      case 'date':
        sortColumn = 'a.date';
        break;
      case 'time':
        sortColumn = 'a.time';
        break;
      default:
        sortColumn = 'a.date';
    }
    
    query += ` ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}`;
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  // Updated allowed statuses: pending -> approved -> successful/not_successful
  const allowed = ['pending', 'approved', 'successful', 'not_successful', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

  try {
    // Only counselor allowed to update status
    if (req.user.role !== 'counselor') return res.status(403).json({ message: 'Forbidden' });
    // Ensure counselor owns the appointment
    const [rows] = await pool.query('SELECT * FROM appointments WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Appointment not found' });
    if (rows[0].counselor_id !== req.user.id) return res.status(403).json({ message: 'Cannot modify this appointment' });

    // Validate status transitions
    const currentStatus = rows[0].status;
    if (currentStatus === 'approved' && !['successful', 'not_successful'].includes(status)) {
      return res.status(400).json({ message: 'Approved appointments can only be marked as successful or not_successful' });
    }
    if (currentStatus === 'pending' && !['approved', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Pending appointments can only be approved or cancelled' });
    }
    if (currentStatus === 'successful' || currentStatus === 'not_successful') {
      return res.status(400).json({ message: 'Cannot change status of completed appointment' });
    }

    await pool.query('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);
    
    // Track activity for reports
    if (status === 'approved' || status === 'successful') {
      try {
        await pool.query(
          'INSERT INTO user_activity (user_id, activity_type, activity_date, activity_time, details) VALUES (?, ?, ?, ?, ?)',
          [rows[0].student_id, 'appointment', rows[0].date, rows[0].time, JSON.stringify({ appointment_id: id, status })]
        );
      } catch (activityErr) {
        console.error('Failed to log activity:', activityErr);
        // Don't fail the request if activity logging fails
      }
    }
    
    const [updated] = await pool.query('SELECT * FROM appointments WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateAppointment = async (req, res) => {
  const { id } = req.params;
  const { date, time } = req.body;
  if (!date || !time) return res.status(400).json({ message: 'date and time required' });
  if (isNaN(Date.parse(date))) return res.status(400).json({ message: 'Invalid date format' });
  if (!/^\d{2}:\d{2}(?::\d{2})?$/.test(time)) return res.status(400).json({ message: 'Invalid time format' });

  // Validate hour-based time slot (8am-4pm = 08:00-16:00)
  const timeParts = time.split(':');
  const hour = parseInt(timeParts[0]);
  const minutes = parseInt(timeParts[1] || 0);
  
  // Only allow full hours (8, 9, 10, 11, 12, 13, 14, 15, 16) with 00 minutes
  if (hour < 8 || hour > 16 || minutes !== 0) {
    return res.status(400).json({ message: 'Time must be a full hour between 8:00 AM and 4:00 PM' });
  }

  try {

    if (req.user.role !== 'counselor') return res.status(403).json({ message: 'Forbidden' });

    const [rows] = await pool.query('SELECT * FROM appointments WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Appointment not found' });
    const appt = rows[0];
    if (appt.counselor_id !== req.user.id) return res.status(403).json({ message: 'Cannot modify this appointment' });

    // Check for existing appointment - exclude cancelled and current appointment
    const [existing] = await pool.query(
      'SELECT id FROM appointments WHERE counselor_id = ? AND date = ? AND time = ? AND id != ? AND status != ?', 
      [req.user.id, date, time, id, 'cancelled']
    );
    if (existing.length) return res.status(400).json({ message: 'That counselor already has an appointment at that date and time' });

    await pool.query('UPDATE appointments SET date = ?, time = ? WHERE id = ?', [date, time, id]);
    const [updated] = await pool.query('SELECT * FROM appointments WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteAppointment = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM appointments WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    const appt = rows[0];

    if (!(req.user.role === 'counselor' && appt.counselor_id === req.user.id) && !(req.user.role === 'student' && appt.student_id === req.user.id)) {
      return res.status(403).json({ message: 'Cannot delete this appointment' });
    }
    await pool.query('DELETE FROM appointments WHERE id = ?', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get available time slots for a counselor on a specific date
exports.getAvailableTimes = async (req, res) => {
  try {
    const { counselor_id, date } = req.query;
    
    if (!counselor_id || !date) {
      return res.status(400).json({ message: 'counselor_id and date are required' });
    }

    // Get all booked times for this counselor on this date (exclude cancelled)
    const [booked] = await pool.query(
      'SELECT time FROM appointments WHERE counselor_id = ? AND date = ? AND status != ?',
      [counselor_id, date, 'cancelled']
    );

    // All available hours (8am-4pm)
    const allHours = [8, 9, 10, 11, 12, 13, 14, 15, 16];
    const bookedHours = booked.map(b => {
      const parts = b.time.split(':');
      return parseInt(parts[0]);
    });

    // Filter out booked hours
    const availableHours = allHours.filter(h => !bookedHours.includes(h));
    
    // Convert to time format (HH:00:00)
    const availableTimes = availableHours.map(h => {
      const hourStr = String(h).padStart(2, '0');
      return `${hourStr}:00:00`;
    });

    res.json({ available: availableTimes, booked: booked.map(b => b.time) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
