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
    // Try with file_url first, fallback to url if needed
    let result;
    try {
      result = await pool.query('INSERT INTO resources (title, description, file_url, uploaded_by) VALUES (?, ?, ?, ?)', [title, description || '', file_url, req.user.id]);
    } catch (insertErr) {
      if (insertErr.code === 'ER_BAD_FIELD_ERROR' && insertErr.message.includes('file_url')) {
        // Try with 'url' column instead
        result = await pool.query('INSERT INTO resources (title, description, url, uploaded_by) VALUES (?, ?, ?, ?)', [title, description || '', file_url, req.user.id]);
      } else {
        throw insertErr; // Re-throw if it's a different error
      }
    }
    
    const [rows] = await pool.query('SELECT * FROM resources WHERE id = ?', [result[0].insertId]);
    res.json(rows[0]);
  } catch (err) {
    console.error('Error creating resource:', err);
    if (err.code === 'ER_NO_SUCH_TABLE') {
      res.status(500).json({ message: 'Database error: Resources table does not exist. Please run database updates.' });
    } else if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: 'Resource already exists' });
    } else if (err.code === 'ER_BAD_NULL_ERROR') {
      res.status(400).json({ message: 'Required fields are missing' });
    } else if (err.code === 'ER_BAD_FIELD_ERROR') {
      res.status(500).json({ message: 'Database schema error: ' + err.message + '. Please run database updates.' });
    } else {
      res.status(500).json({ message: 'Server error: ' + err.message });
    }
  }
};

exports.getResources = async (req, res) => {
  try {
    // Try with file_url first, fallback to url if needed
    let rows;
    try {
      [rows] = await pool.query('SELECT r.*, u.name AS uploader_name FROM resources r LEFT JOIN users u ON r.uploaded_by = u.id ORDER BY r.created_at DESC');
    } catch (selectErr) {
      if (selectErr.code === 'ER_BAD_FIELD_ERROR' && selectErr.message.includes('file_url')) {
        // Try with 'url' column instead
        [rows] = await pool.query('SELECT r.id, r.title, r.description, r.url as file_url, r.uploaded_by, r.created_at, u.name AS uploader_name FROM resources r LEFT JOIN users u ON r.uploaded_by = u.id ORDER BY r.created_at DESC');
      } else {
        throw selectErr; // Re-throw if it's a different error
      }
    }
    res.json(rows);
  } catch (err) {
    console.error('Error fetching resources:', err);
    if (err.code === 'ER_NO_SUCH_TABLE') {
      res.status(500).json({ message: 'Database error: Resources table does not exist. Please run database updates.' });
    } else {
      res.status(500).json({ message: 'Server error: ' + err.message });
    }
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

    // Try with file_url first, fallback to url if needed
    try {
      await pool.query('UPDATE resources SET title = ?, description = ?, file_url = ? WHERE id = ?', [title, description || '', file_url, id]);
    } catch (updateErr) {
      if (updateErr.code === 'ER_BAD_FIELD_ERROR' && updateErr.message.includes('file_url')) {
        // Try with 'url' column instead
        await pool.query('UPDATE resources SET title = ?, description = ?, url = ? WHERE id = ?', [title, description || '', file_url, id]);
      } else {
        throw updateErr; // Re-throw if it's a different error
      }
    }
    
    const [updated] = await pool.query('SELECT * FROM resources WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    console.error('Error updating resource:', err);
    if (err.code === 'ER_NO_SUCH_TABLE') {
      res.status(500).json({ message: 'Database error: Resources table does not exist. Please run database updates.' });
    } else {
      res.status(500).json({ message: 'Server error: ' + err.message });
    }
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
    console.error('Error deleting resource:', err);
    if (err.code === 'ER_NO_SUCH_TABLE') {
      res.status(500).json({ message: 'Database error: Resources table does not exist. Please run database updates.' });
    } else {
      res.status(500).json({ message: 'Server error: ' + err.message });
    }
  }
};
