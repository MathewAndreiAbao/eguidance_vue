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
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating database:', error);
    process.exit(1);
  }
}

updateDatabase();