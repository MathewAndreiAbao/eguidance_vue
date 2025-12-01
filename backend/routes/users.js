const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

router.get('/counselors', auth, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, email FROM users WHERE role = 'counselor'");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/students', auth, async (req, res) => {
  try {
    const search = req.query.search || '';
    let query = "SELECT id, name, email FROM users WHERE role = 'student'";
    const params = [];
    
    // Add search filter for student name or email
    if (search.trim()) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm);
    }
    
    query += ' ORDER BY name';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
