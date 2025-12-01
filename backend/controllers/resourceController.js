const pool = require('../config/db');

function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch (err) {
    return false;
  }
}

exports.createResource = async (req, res) => {
  const { title, description, file_url } = req.body;
  if (!title || !file_url) return res.status(400).json({ message: 'Title and file_url required' });
  if (!isValidUrl(file_url)) return res.status(400).json({ message: 'Invalid file URL' });

  try {
    const [result] = await pool.query('INSERT INTO resources (title, description, file_url, uploaded_by) VALUES (?, ?, ?, ?)', [title, description || '', file_url, req.user.id]);
    const [rows] = await pool.query('SELECT * FROM resources WHERE id = ?', [result.insertId]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getResources = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT r.*, u.name AS uploader_name FROM resources r LEFT JOIN users u ON r.uploaded_by = u.id ORDER BY r.created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateResource = async (req, res) => {
  const { id } = req.params;
  const { title, description, file_url } = req.body;
  if (!title || !file_url) return res.status(400).json({ message: 'Title and file_url required' });
  if (!isValidUrl(file_url)) return res.status(400).json({ message: 'Invalid file URL' });

  try {
    const [rows] = await pool.query('SELECT * FROM resources WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    if (rows[0].uploaded_by !== req.user.id) return res.status(403).json({ message: 'Cannot modify this resource' });

    await pool.query('UPDATE resources SET title = ?, description = ?, file_url = ? WHERE id = ?', [title, description || '', file_url, id]);
    const [updated] = await pool.query('SELECT * FROM resources WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteResource = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM resources WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    if (rows[0].uploaded_by !== req.user.id) return res.status(403).json({ message: 'Cannot delete this resource' });

    await pool.query('DELETE FROM resources WHERE id = ?', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
