-- E-Guidance System Database Schema
-- Complete SQL queries for all tables and databases

-- 1. Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'counselor') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Appointments Table
CREATE TABLE appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    counselor_id INT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    status ENUM('pending', 'approved', 'successful', 'not_successful', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (counselor_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_student_id (student_id),
    INDEX idx_counselor_id (counselor_id),
    INDEX idx_date (date),
    INDEX idx_status (status)
);

-- 3. Feedback Table
CREATE TABLE feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    counselor_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (counselor_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_student_id (student_id),
    INDEX idx_counselor_id (counselor_id)
);

-- 4. Wellness Forms Table
CREATE TABLE wellness_forms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    form_type VARCHAR(50) DEFAULT 'general',
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_created_by (created_by),
    INDEX idx_is_active (is_active)
);

-- 5. Wellness Form Questions Table
CREATE TABLE wellness_form_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    form_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('text', 'rating', 'multiple_choice', 'yes_no', 'scale_1_5') NOT NULL,
    question_options JSON,
    question_order INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES wellness_forms(id) ON DELETE CASCADE,
    INDEX idx_form_id (form_id),
    INDEX idx_question_order (question_order)
);

-- 6. Wellness Responses Table
CREATE TABLE wellness_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    form_id INT NOT NULL,
    student_id INT NOT NULL,
    responses JSON NOT NULL,
    score INT NOT NULL,
    counselor_notes TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES wellness_forms(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_form_id (form_id),
    INDEX idx_student_id (student_id)
);

-- 6. Announcements Table
CREATE TABLE announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_created_by (created_by),
    INDEX idx_created_at (created_at)
);

-- 7. Resources Table
CREATE TABLE resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    uploaded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_created_at (created_at)
);

-- 8. User Activity Table
CREATE TABLE user_activity (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    activity_date DATE NOT NULL,
    activity_time TIME NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_activity_date (activity_date),
    INDEX idx_activity_type (activity_type)
);

-- Sample Data Insertion Queries

-- Insert sample users
INSERT INTO users (name, email, password, role) VALUES
('John Doe', 'john.doe@example.com', '$2a$10$example_hash', 'student'),
('Jane Smith', 'jane.smith@example.com', '$2a$10$example_hash', 'counselor'),
('Robert Johnson', 'robert.johnson@example.com', '$2a$10$example_hash', 'student'),
('Emily Davis', 'emily.davis@example.com', '$2a$10$example_hash', 'counselor');

-- Insert sample appointments
INSERT INTO appointments (student_id, counselor_id, date, time, status) VALUES
(1, 2, '2025-12-10', '09:00:00', 'pending'),
(3, 4, '2025-12-11', '10:00:00', 'approved'),
(1, 4, '2025-12-12', '11:00:00', 'successful');

-- Insert sample feedback
INSERT INTO feedback (student_id, counselor_id, rating, comment) VALUES
(1, 2, 5, 'Great session, very helpful'),
(3, 4, 4, 'Good advice, but session ran long');

-- Insert sample wellness forms
INSERT INTO wellness_forms (title, description, created_by) VALUES
('Anxiety Assessment', 'Assess your anxiety levels', 2),
('Stress Management', 'Evaluate your stress levels', 4);

-- Insert sample wellness responses
INSERT INTO wellness_responses (form_id, student_id, responses, score) VALUES
(1, 1, '{"q1": 3, "q2": 4, "q3": 2}', 9),
(2, 3, '{"q1": 5, "q2": 4, "q3": 5}', 14);

-- Insert sample announcements
INSERT INTO announcements (title, content, created_by) VALUES
('Important Notice', 'Counseling services will be closed on December 25th for Christmas.', 2),
('New Resource Available', 'Check out our new stress management guide in the resources section.', 4);

-- Insert sample resources
INSERT INTO resources (title, description, file_url, uploaded_by) VALUES
('Stress Management Guide', 'A comprehensive guide to managing stress', 'https://example.com/stress-guide.pdf', 2),
('Anxiety Coping Strategies', 'Techniques to cope with anxiety', 'https://example.com/anxiety-strategies.pdf', 4);

-- Insert sample user activities
INSERT INTO user_activity (user_id, activity_type, activity_date, activity_time, details) VALUES
(1, 'appointment', '2025-12-10', '09:00:00', '{"appointment_id": 1, "status": "pending"}'),
(3, 'appointment', '2025-12-11', '10:00:00', '{"appointment_id": 2, "status": "approved"}');