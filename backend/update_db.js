const pool = require('./config/db');

async function updateDatabase() {
  try {
    await pool.query("ALTER TABLE appointments MODIFY COLUMN status ENUM('pending','approved','successful','not_successful','cancelled') DEFAULT 'pending'");
    console.log('Appointments table updated successfully');
    
    // Also create the user_activity table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_activity (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        activity_type VARCHAR(50) NOT NULL,
        activity_date DATE NOT NULL,
        activity_time TIME NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('User activity table ensured');
    
    // Create the resources table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS resources (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_url TEXT NOT NULL,
        uploaded_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_uploaded_by (uploaded_by),
        INDEX idx_created_at (created_at)
      )
    `);
    console.log('Resources table ensured');
    
    // Add missing file_url column if it doesn't exist (for existing databases)
    try {
      await pool.query(`ALTER TABLE resources ADD COLUMN file_url TEXT NOT NULL AFTER description`);
      console.log('file_url column added to resources table');
    } catch (err) {
      // Column might already exist, which is fine
      if (err.code !== 'ER_DUP_FIELDNAME') {
        console.log('Note: file_url column might already exist or there was an issue adding it');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating database:', error);
    process.exit(1);
  }
}

updateDatabase();