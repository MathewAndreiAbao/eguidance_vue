const pool = require('../config/db');

exports.createAnnouncement = async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ message: 'Title and content required' });
  try {
    const [result] = await pool.query('INSERT INTO announcements (title, content, created_by) VALUES (?, ?, ?)', [title, content, req.user.id]);
    const [rows] = await pool.query('SELECT * FROM announcements WHERE id = ?', [result.insertId]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAnnouncements = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT a.*, u.name AS author_name FROM announcements a LEFT JOIN users u ON a.created_by = u.id ORDER BY a.created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateAnnouncement = async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ message: 'Title and content required' });
  try {

    if (req.user.role !== 'counselor') return res.status(403).json({ message: 'Forbidden' });
    const [rows] = await pool.query('SELECT * FROM announcements WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    if (rows[0].created_by !== req.user.id) return res.status(403).json({ message: 'Cannot edit this announcement' });

    await pool.query('UPDATE announcements SET title = ?, content = ? WHERE id = ?', [title, content, id]);
    const [updated] = await pool.query('SELECT * FROM announcements WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  const { id } = req.params;
  try {
    if (req.user.role !== 'counselor') return res.status(403).json({ message: 'Forbidden' });
    const [rows] = await pool.query('SELECT * FROM announcements WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    if (rows[0].created_by !== req.user.id) return res.status(403).json({ message: 'Cannot delete this announcement' });

    await pool.query('DELETE FROM announcements WHERE id = ?', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
