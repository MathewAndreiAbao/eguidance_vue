const mysql = require('./backend/node_modules/mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'eguidance123',
  waitForConnections: true,
  connectionLimit: 10
});

async function insertTestData() {
  try {
    // Insert a test form
    const [formResult] = await pool.execute(
      'INSERT INTO wellness_forms (title, description, created_by) VALUES (?, ?, ?)',
      ['Test Form with Different Question Types', 'A test form to verify different question types', 2]
    );
    
    const formId = formResult.insertId;
    console.log('Inserted form with ID:', formId);
    
    // Insert different types of questions
    await pool.execute(
      'INSERT INTO wellness_form_questions (form_id, question_text, question_type, question_order) VALUES (?, ?, ?, ?)',
      [formId, 'How are you feeling today?', 'text', 1]
    );
    
    await pool.execute(
      'INSERT INTO wellness_form_questions (form_id, question_text, question_type, question_order) VALUES (?, ?, ?, ?)',
      [formId, 'Rate your stress level (1-10)', 'rating', 2]
    );
    
    // Insert multiple choice question with options
    const optionsJson = JSON.stringify(['Very Good', 'Good', 'Neutral', 'Bad', 'Very Bad']);
    await pool.execute(
      'INSERT INTO wellness_form_questions (form_id, question_text, question_type, question_options, question_order) VALUES (?, ?, ?, ?, ?)',
      [formId, 'How would you describe your overall mood?', 'multiple_choice', optionsJson, 3]
    );
    
    // Insert yes/no question
    await pool.execute(
      'INSERT INTO wellness_form_questions (form_id, question_text, question_type, question_order) VALUES (?, ?, ?, ?)',
      [formId, 'Have you had trouble sleeping recently?', 'yes_no', 4]
    );
    
    // Insert scale question
    await pool.execute(
      'INSERT INTO wellness_form_questions (form_id, question_text, question_type, question_order) VALUES (?, ?, ?, ?)',
      [formId, 'How satisfied are you with your current situation?', 'scale_1_5', 5]
    );
    
    console.log('Test data inserted successfully!');
  } catch (error) {
    console.error('Error inserting test data:', error);
  } finally {
    await pool.end();
  }
}

insertTestData();