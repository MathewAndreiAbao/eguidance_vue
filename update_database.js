const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

async function updateDatabase() {
  let connection;
  
  try {
    // Connect to MySQL server
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'eguidance123'
    });
    
    console.log('Connected to MySQL server');
    
    // Add form_type column to wellness_forms table
    try {
      await connection.query(`
        ALTER TABLE wellness_forms 
        ADD COLUMN form_type VARCHAR(50) DEFAULT 'general'
      `);
      console.log('Added form_type column to wellness_forms table');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('Column form_type already exists in wellness_forms table');
      } else {
        throw err;
      }
    }
    
    console.log('Database update completed successfully!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Connection closed');
    }
  }
}

updateDatabase();