const pool = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query('SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?', [userId]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, password } = req.body;

    const [rows] = await pool.query('SELECT id, email FROM users WHERE id = ?', [userId]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && email !== rows[0].email) {
      if (!emailRegex.test(email)) return res.status(400).json({ message: 'Invalid email format' });
      const [check] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
      if (check.length) return res.status(400).json({ message: 'Email already in use' });
    }
    if (name && name !== rows[0].name) {
      if (typeof name !== 'string' || name.trim().length < 3) return res.status(400).json({ message: 'Name must be at least 3 characters' });
      const [checkName] = await pool.query('SELECT id FROM users WHERE name = ?', [name]);
      if (checkName.length) return res.status(400).json({ message: 'Name already in use' });
    }

    const updates = [];
    const params = [];
    if (name) { updates.push('name = ?'); params.push(name); }
    if (email) { updates.push('email = ?'); params.push(email); }
    if (password) { if (typeof password !== 'string' || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' }); const salt = await bcrypt.genSalt(10); const hash = await bcrypt.hash(password, salt); updates.push('password = ?'); params.push(hash); }

    if (!updates.length) return res.status(400).json({ message: 'No fields to update' });

    params.push(userId);
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await pool.query(sql, params);

    const [updated] = await pool.query('SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?', [userId]);
    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
