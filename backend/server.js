const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const appointmentRoutes = require('./routes/appointments');
const announcementRoutes = require('./routes/announcements');
const resourceRoutes = require('./routes/resources');
const usersRoutes = require('./routes/users');
const reportsRoutes = require('./routes/reports');
const wellnessRoutes = require('./routes/wellness');
const feedbackRoutes = require('./routes/feedback');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/wellness', wellnessRoutes);
app.use('/api/feedback', feedbackRoutes);

app.get('/', (req, res) => res.json({ message: 'eGuidance backend running' }));

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await pool.getConnection();
    console.log('Connected to MySQL');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Unable to connect to DB', err);
    process.exit(1);
  }
})();
