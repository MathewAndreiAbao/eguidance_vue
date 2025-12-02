const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

async function createTables() {
  let connection;
  
  try {
    // Connect to MySQL server (without specifying database)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    
    console.log('Connected to MySQL server');
    
    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'eguidance123'}`);
    console.log(`Database ${process.env.DB_NAME || 'eguidance123'} created or already exists`);
    
    // Use the database
    await connection.query(`USE ${process.env.DB_NAME || 'eguidance123'}`);
    console.log(`Using database ${process.env.DB_NAME || 'eguidance123'}`);
    
    // Read the schema file
    const fs = require('fs');
    const path = require('path');
    // Correct path to the schema file
    const schemaPath = path.join(__dirname, 'database_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the schema into individual statements
    const statements = schema.split(';').filter(stmt => stmt.trim() !== '');
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim() !== '') {
        try {
          await connection.query(statement);
          console.log('Executed statement:', statement.substring(0, 50) + '...');
        } catch (err) {
          // Skip errors for CREATE TABLE statements if tables already exist
          if (err.code !== 'ER_TABLE_EXISTS_ERROR') {
            console.error('Error executing statement:', err.message);
            console.error('Statement:', statement);
            throw err;
          } else {
            console.log('Table already exists, skipping:', statement.substring(0, 50) + '...');
          }
        }
      }
    }
    
    console.log('All tables created successfully!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Connection closed');
    }
  }
}

createTables();