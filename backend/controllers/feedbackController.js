const pool = require('../config/db');

// Create a new feedback (student only)
exports.createFeedback = async (req, res) => {
  const { counselor_id, rating, comment } = req.body;
  
  // Validate required fields
  if (!counselor_id || !rating) {
    return res.status(400).json({ message: 'Counselor ID and rating are required' });
  }
  
  // Validate rating range (1-5)
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }
  
  try {
    // Only students can create feedback
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can create feedback' });
    }
    
    // Check if the counselor exists
    const [counselorRows] = await pool.query(
      'SELECT id, role FROM users WHERE id = ? AND role = ?',
      [counselor_id, 'counselor']
    );
    
    if (!counselorRows.length) {
      return res.status(404).json({ message: 'Counselor not found' });
    }
    
    // Check if student has had appointments with this counselor
    const [appointmentRows] = await pool.query(
      'SELECT id FROM appointments WHERE student_id = ? AND counselor_id = ? AND status IN (?, ?)',
      [req.user.id, counselor_id, 'successful', 'not_successful']
    );
    
    if (!appointmentRows.length) {
      return res.status(403).json({ message: 'You can only provide feedback for counselors you have had appointments with' });
    }
    
    // Check if feedback already exists for this student-counselor pair
    const [existingRows] = await pool.query(
      'SELECT id FROM feedback WHERE student_id = ? AND counselor_id = ?',
      [req.user.id, counselor_id]
    );
    
    if (existingRows.length) {
      return res.status(400).json({ message: 'You have already provided feedback for this counselor' });
    }
    
    // Insert the feedback
    const [result] = await pool.query(
      'INSERT INTO feedback (student_id, counselor_id, rating, comment) VALUES (?, ?, ?, ?)',
      [req.user.id, counselor_id, rating, comment || null]
    );
    
    // Get the inserted feedback with counselor name
    const [rows] = await pool.query(
      `SELECT f.id, f.rating, f.comment, f.created_at, u.name as counselor_name 
       FROM feedback f 
       JOIN users u ON f.counselor_id = u.id 
       WHERE f.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all feedback for a student (student can only see their own)
exports.getStudentFeedback = async (req, res) => {
  try {
    // Students can only see their own feedback
    const [rows] = await pool.query(
      `SELECT f.id, f.rating, f.comment, f.created_at, u.name as counselor_name 
       FROM feedback f 
       JOIN users u ON f.counselor_id = u.id 
       WHERE f.student_id = ? 
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );
    
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all feedback for a counselor (counselor can only see feedback given to them)
exports.getCounselorFeedback = async (req, res) => {
  try {
    // Counselors can only see feedback given to them
    const [rows] = await pool.query(
      `SELECT f.id, f.rating, f.comment, f.created_at, u.name as student_name, u.email as student_email
       FROM feedback f 
       JOIN users u ON f.student_id = u.id 
       WHERE f.counselor_id = ? 
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );
    
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get feedback statistics for a counselor
exports.getCounselorFeedbackStats = async (req, res) => {
  try {
    // Get average rating and feedback count
    const [stats] = await pool.query(
      `SELECT 
         AVG(rating) as average_rating,
         COUNT(*) as total_feedback,
         SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star_count,
         SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star_count,
         SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star_count,
         SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star_count,
         SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star_count
       FROM feedback 
       WHERE counselor_id = ?`,
      [req.user.id]
    );
    
    res.json(stats[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update feedback (student only, and only their own)
exports.updateFeedback = async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  
  // Validate rating if provided
  if (rating && (rating < 1 || rating > 5)) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }
  
  try {
    // Only students can update their own feedback
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can update feedback' });
    }
    
    // Check if feedback exists and belongs to the student
    const [feedbackRows] = await pool.query(
      'SELECT id FROM feedback WHERE id = ? AND student_id = ?',
      [id, req.user.id]
    );
    
    if (!feedbackRows.length) {
      return res.status(404).json({ message: 'Feedback not found or unauthorized' });
    }
    
    // Update the feedback
    const updates = [];
    const values = [];
    
    if (rating !== undefined) {
      updates.push('rating = ?');
      values.push(rating);
    }
    
    if (comment !== undefined) {
      updates.push('comment = ?');
      values.push(comment || null);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'Nothing to update' });
    }
    
    values.push(id);
    
    await pool.query(
      `UPDATE feedback SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    // Get the updated feedback
    const [rows] = await pool.query(
      `SELECT f.id, f.rating, f.comment, f.created_at, u.name as counselor_name 
       FROM feedback f 
       JOIN users u ON f.counselor_id = u.id 
       WHERE f.id = ?`,
      [id]
    );
    
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete feedback (student only, and only their own)
exports.deleteFeedback = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Only students can delete their own feedback
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can delete feedback' });
    }
    
    // Check if feedback exists and belongs to the student
    const [feedbackRows] = await pool.query(
      'SELECT id FROM feedback WHERE id = ? AND student_id = ?',
      [id, req.user.id]
    );
    
    if (!feedbackRows.length) {
      return res.status(404).json({ message: 'Feedback not found or unauthorized' });
    }
    
    // Delete the feedback
    await pool.query('DELETE FROM feedback WHERE id = ?', [id]);
    
    res.json({ message: 'Feedback deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};