-- Database Updates for Enhanced Appointment System
-- Run this SQL script to update your database schema

-- Update appointments table to support new status values
ALTER TABLE appointments 
MODIFY COLUMN status ENUM('pending', 'approved', 'successful', 'not_successful', 'cancelled') 
DEFAULT 'pending';

-- Add index for better search performance
CREATE INDEX IF NOT EXISTS idx_appointments_counselor_date ON appointments(counselor_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(date, time);

-- Create user_activity table for tracking student usage (for reports)
CREATE TABLE IF NOT EXISTS user_activity (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  activity_type VARCHAR(50) NOT NULL, -- 'appointment', 'login', 'resource_access', etc.
  activity_date DATE NOT NULL,
  activity_time TIME NOT NULL,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_activity_user_date (user_id, activity_date),
  INDEX idx_user_activity_date (activity_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Update appointments table to store hour (1-16 format for 8am-4pm)
-- Note: Time will still be stored in TIME format, but we'll validate for hour-based slots
-- Hours: 8=8am, 9=9am, 10=10am, 11=11am, 12=12pm, 13=1pm, 14=2pm, 15=3pm, 16=4pm

-- Create wellness_forms table for storing different types of wellness forms
CREATE TABLE IF NOT EXISTS wellness_forms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  form_type ENUM('anxiety', 'depression', 'stress', 'general_wellness') NOT NULL,
  created_by INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_form_type (form_type),
  INDEX idx_created_by (created_by),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create wellness_responses table for storing student responses to wellness forms
CREATE TABLE IF NOT EXISTS wellness_responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  form_id INT NOT NULL,
  student_id INT NOT NULL,
  counselor_id INT,
  responses JSON NOT NULL,
  score INT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_id) REFERENCES wellness_forms(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (counselor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_form_id (form_id),
  INDEX idx_student_id (student_id),
  INDEX idx_counselor_id (counselor_id),
  INDEX idx_submitted_at (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;