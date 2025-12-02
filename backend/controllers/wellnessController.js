const pool = require('../config/db');
const fs = require('fs').promises;
const path = require('path');

// Get all active wellness forms with their questions
exports.getWellnessForms = async (req, res) => {
  try {
    // Get all active forms
    const [forms] = await pool.query(
      'SELECT id, title, description, created_at FROM wellness_forms WHERE is_active = ? ORDER BY created_at DESC',
      [true]
    );
    
    // Get questions for each form
    for (let form of forms) {
      const [questions] = await pool.query(
        'SELECT id, question_text, question_type, question_options FROM wellness_form_questions WHERE form_id = ? ORDER BY question_order',
        [form.id]
      );
      
      // Parse JSON options
      for (let question of questions) {
        if (question.question_options) {
          try {
            question.options = JSON.parse(question.question_options);
          } catch (parseError) {
            console.error('Error parsing question options:', parseError);
            question.options = [];
          }
        }
      }
      form.questions = questions;
    }
    
    res.json(forms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a specific wellness form by ID with its questions
exports.getWellnessFormById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const [rows] = await pool.query(
      'SELECT id, title, description, created_at FROM wellness_forms WHERE id = ? AND is_active = ?',
      [id, true]
    );
    
    if (!rows.length) {
      return res.status(404).json({ message: 'Wellness form not found' });
    }
    
    // Get questions for the form
    const [questions] = await pool.query(
      'SELECT id, question_text, question_type, question_options FROM wellness_form_questions WHERE form_id = ? ORDER BY question_order',
      [id]
    );
    
    // Parse JSON options
    for (let question of questions) {
      if (question.question_options) {
        try {
          question.options = JSON.parse(question.question_options);
        } catch (parseError) {
          console.error('Error parsing question options:', parseError);
          question.options = [];
        }
      }
    }
    
    const form = rows[0];
    form.questions = questions;
    
    res.json(form);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new wellness form (counselor only)
exports.createWellnessForm = async (req, res) => {
  const { title, description, questions } = req.body;
  
  // Validate required fields
  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }
  
  // Validate questions
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ message: 'At least one question is required' });
  }
  
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    if (!question.question_text || !question.question_type) {
      return res.status(400).json({ message: `Question ${i + 1} must have text and type` });
    }
    
    const validTypes = ['text', 'rating', 'multiple_choice', 'yes_no', 'scale_1_5'];
    if (!validTypes.includes(question.question_type)) {
      return res.status(400).json({ message: `Question ${i + 1} has invalid type` });
    }
    
    // Validate options for multiple choice questions
    if (question.question_type === 'multiple_choice' && (!question.options || !Array.isArray(question.options) || question.options.length === 0)) {
      return res.status(400).json({ message: `Multiple choice question ${i + 1} must have options` });
    }
  }
  
  try {
    // Only counselors can create forms
    if (req.user.role !== 'counselor') {
      return res.status(403).json({ message: 'Only counselors can create wellness forms' });
    }
    
    // Create the form
    const [result] = await pool.query(
      'INSERT INTO wellness_forms (title, description, created_by) VALUES (?, ?, ?)',
      [title, description, req.user.id]
    );
    
    const formId = result.insertId;
    
    // Create the questions
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const optionsJson = question.options ? JSON.stringify(question.options) : null;
      await pool.query(
        'INSERT INTO wellness_form_questions (form_id, question_text, question_type, question_options, question_order) VALUES (?, ?, ?, ?, ?)',
        [formId, question.question_text, question.question_type, optionsJson, i]
      );
    }
    
    // Get the created form with questions
    const [rows] = await pool.query('SELECT id, title, description, created_at FROM wellness_forms WHERE id = ?', [formId]);
    const [questionRows] = await pool.query('SELECT id, question_text, question_type, question_options FROM wellness_form_questions WHERE form_id = ? ORDER BY question_order', [formId]);
    
    // Parse JSON options
    for (let question of questionRows) {
      if (question.question_options) {
        try {
          question.options = JSON.parse(question.question_options);
        } catch (parseError) {
          console.error('Error parsing question options:', parseError);
          question.options = [];
        }
      }
    }
    
    const form = rows[0];
    form.questions = questionRows;
    
    res.status(201).json(form);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Submit a wellness form response (student only)
exports.submitWellnessResponse = async (req, res) => {
  const { form_id, responses } = req.body;
  
  // Validate required fields
  if (!form_id || !responses) {
    return res.status(400).json({ message: 'Form ID and responses are required' });
  }
  
  try {
    // Only students can submit responses
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can submit wellness form responses' });
    }
    
    // Check if the form exists and is active
    const [formRows] = await pool.query(
      'SELECT id FROM wellness_forms WHERE id = ? AND is_active = ?',
      [form_id, true]
    );
    
    if (!formRows.length) {
      return res.status(404).json({ message: 'Wellness form not found or inactive' });
    }
    
    // Calculate score based on responses (simplified scoring)
    let score = 0;
    if (typeof responses === 'object') {
      score = Object.values(responses).reduce((sum, value) => sum + (parseInt(value) || 0), 0);
    }
    
    // Insert the response
    const [result] = await pool.query(
      'INSERT INTO wellness_responses (form_id, student_id, responses, score) VALUES (?, ?, ?, ?)',
      [form_id, req.user.id, JSON.stringify(responses), score]
    );
    
    // Get the inserted response
    const [rows] = await pool.query(
      'SELECT id, form_id, student_id, responses, score, submitted_at FROM wellness_responses WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all responses for a student (student can only see their own)
exports.getStudentResponses = async (req, res) => {
  try {
    // Students can only see their own responses
    const [rows] = await pool.query(
      `SELECT wr.id, wr.form_id, wr.responses, wr.score, wr.submitted_at,
              wf.title as form_title, wf.form_type
       FROM wellness_responses wr
       JOIN wellness_forms wf ON wr.form_id = wf.id
       WHERE wr.student_id = ?
       ORDER BY wr.submitted_at DESC`,
      [req.user.id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all responses for a counselor (counselor can see all responses to their forms)
exports.getCounselorResponses = async (req, res) => {
  try {
    // Counselors can see responses to forms they created
    const [rows] = await pool.query(
      `SELECT wr.id, wr.form_id, wr.student_id, wr.responses, wr.score, wr.submitted_at, 
              wf.title as form_title, u.name as student_name, u.email as student_email
       FROM wellness_responses wr 
       JOIN wellness_forms wf ON wr.form_id = wf.id 
       JOIN users u ON wr.student_id = u.id
       WHERE wf.created_by = ? 
       ORDER BY wr.submitted_at DESC`,
      [req.user.id]
    );
    
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a specific response by ID
exports.getResponseById = async (req, res) => {
  const { id } = req.params;
  
  try {
    let query, params;
    
    if (req.user.role === 'student') {
      // Students can only see their own responses
      query = `SELECT wr.id, wr.form_id, wr.responses, wr.score, wr.submitted_at, wr.counselor_notes,
                      wf.title as form_title 
               FROM wellness_responses wr 
               JOIN wellness_forms wf ON wr.form_id = wf.id 
               WHERE wr.id = ? AND wr.student_id = ?`;
      params = [id, req.user.id];
    } else if (req.user.role === 'counselor') {
      // Counselors can see responses to forms they created
      query = `SELECT wr.id, wr.form_id, wr.student_id, wr.responses, wr.score, wr.submitted_at, wr.counselor_notes,
                      wf.title as form_title, u.name as student_name, u.email as student_email
               FROM wellness_responses wr 
               JOIN wellness_forms wf ON wr.form_id = wf.id 
               JOIN users u ON wr.student_id = u.id
               WHERE wr.id = ? AND wf.created_by = ?`;
      params = [id, req.user.id];
    } else {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    const [rows] = await pool.query(query, params);
    
    if (!rows.length) {
      return res.status(404).json({ message: 'Response not found' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a wellness form response (student only)
exports.updateWellnessResponse = async (req, res) => {
  const { id } = req.params;
  const { responses } = req.body;
  
  // Validate required fields
  if (!responses) {
    return res.status(400).json({ message: 'Responses are required' });
  }
  
  try {
    // Only students can update their own responses
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can update wellness form responses' });
    }
    
    // Check if the response exists and belongs to the student
    const [responseRows] = await pool.query(
      'SELECT id, form_id, responses FROM wellness_responses WHERE id = ? AND student_id = ?',
      [id, req.user.id]
    );
    
    if (!responseRows.length) {
      return res.status(404).json({ message: 'Response not found or unauthorized' });
    }
    
    // Get the form type to calculate score
    const [formRows] = await pool.query(
      'SELECT id FROM wellness_forms WHERE id = ?',
      [responseRows[0].form_id]
    );
    
    // Calculate score based on responses (simplified scoring)
    let score = 0;
    if (typeof responses === 'object') {
      score = Object.values(responses).reduce((sum, value) => sum + (parseInt(value) || 0), 0);
    }
    
    // Update the response
    await pool.query(
      'UPDATE wellness_responses SET responses = ?, score = ? WHERE id = ?',
      [JSON.stringify(responses), score, id]
    );
    
    // Get the updated response
    const [rows] = await pool.query(
      'SELECT id, form_id, student_id, responses, score, submitted_at FROM wellness_responses WHERE id = ?',
      [id]
    );
    
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add counselor notes to a response
exports.addCounselorNotes = async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  
  try {
    // Only counselors can add notes
    if (req.user.role !== 'counselor') {
      return res.status(403).json({ message: 'Only counselors can add notes to responses' });
    }
    
    // Check if the response exists and belongs to a form created by this counselor
    const [responseRows] = await pool.query(
      `SELECT wr.id 
       FROM wellness_responses wr
       JOIN wellness_forms wf ON wr.form_id = wf.id
       WHERE wr.id = ? AND wf.created_by = ?`,
      [id, req.user.id]
    );
    
    if (!responseRows.length) {
      return res.status(404).json({ message: 'Response not found or unauthorized' });
    }
    
    // Update the response with counselor notes
    await pool.query(
      'UPDATE wellness_responses SET counselor_notes = ? WHERE id = ?',
      [notes, id]
    );
    
    res.json({ message: 'Notes added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get statistics for counselor's forms
exports.getCounselorStatistics = async (req, res) => {
  try {
    // Only counselors can view statistics
    if (req.user.role !== 'counselor') {
      return res.status(403).json({ message: 'Only counselors can view statistics' });
    }
    
    // Get total forms created
    const [formStats] = await pool.query(
      'SELECT COUNT(*) as total_forms FROM wellness_forms WHERE created_by = ?',
      [req.user.id]
    );
    
    // Get total responses received
    const [responseStats] = await pool.query(
      `SELECT COUNT(*) as total_responses, AVG(score) as average_score
       FROM wellness_responses wr
       JOIN wellness_forms wf ON wr.form_id = wf.id
       WHERE wf.created_by = ?`,
      [req.user.id]
    );
    
    res.json({
      totalForms: formStats[0].total_forms,
      totalResponses: responseStats[0].total_responses,
      averageScore: responseStats[0].average_score,
      formTypeDistribution: []
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};