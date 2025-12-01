const pool = require('../config/db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Get weekly student usage statistics
exports.getWeeklyStats = async (req, res) => {
  try {
    if (req.user.role !== 'counselor') {
      return res.status(403).json({ message: 'Forbidden - Only counselors can access reports' });
    }

    const { startDate } = req.query;
    
    // Default to current week if no date provided
    let weekStart;
    if (startDate) {
      weekStart = new Date(startDate);
    } else {
      weekStart = new Date();
      // Get Monday of current week
      const day = weekStart.getDay();
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
      weekStart.setDate(diff);
    }
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Get all students who had appointments in this week
    const [students] = await pool.query(
      `SELECT DISTINCT 
        u.id, 
        u.name, 
        u.email,
        COUNT(DISTINCT a.id) AS appointment_count,
        SUM(CASE WHEN a.status = 'successful' THEN 1 ELSE 0 END) AS successful_count,
        SUM(CASE WHEN a.status = 'approved' THEN 1 ELSE 0 END) AS approved_count
      FROM users u
      INNER JOIN appointments a ON u.id = a.student_id
      WHERE a.counselor_id = ? 
        AND a.date >= ? 
        AND a.date <= ?
        AND a.status != 'cancelled'
      GROUP BY u.id, u.name, u.email
      ORDER BY appointment_count DESC, u.name`,
      [req.user.id, weekStart.toISOString().split('T')[0], weekEnd.toISOString().split('T')[0]]
    );

    // Get activity data from user_activity table
    const [activities] = await pool.query(
      `SELECT 
        user_id,
        COUNT(*) AS activity_count,
        activity_type
      FROM user_activity
      WHERE activity_date >= ? 
        AND activity_date <= ?
      GROUP BY user_id, activity_type`,
      [weekStart.toISOString().split('T')[0], weekEnd.toISOString().split('T')[0]]
    );

    // Combine data
    const studentMap = new Map();
    students.forEach(s => {
      studentMap.set(s.id, {
        ...s,
        activities: []
      });
    });

    activities.forEach(a => {
      if (studentMap.has(a.user_id)) {
        studentMap.get(a.user_id).activities.push(a);
      }
    });

    res.json({
      period: {
        start: weekStart.toISOString().split('T')[0],
        end: weekEnd.toISOString().split('T')[0]
      },
      students: Array.from(studentMap.values()),
      total_students: studentMap.size
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get monthly student usage statistics
exports.getMonthlyStats = async (req, res) => {
  try {
    if (req.user.role !== 'counselor') {
      return res.status(403).json({ message: 'Forbidden - Only counselors can access reports' });
    }

    const { year, month } = req.query;
    
    // Default to current month if no date provided
    let targetDate;
    if (year && month) {
      targetDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    } else {
      targetDate = new Date();
      targetDate.setDate(1);
    }
    
    const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    
    const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    // Get all students who had appointments in this month
    const [students] = await pool.query(
      `SELECT DISTINCT 
        u.id, 
        u.name, 
        u.email,
        COUNT(DISTINCT a.id) AS appointment_count,
        SUM(CASE WHEN a.status = 'successful' THEN 1 ELSE 0 END) AS successful_count,
        SUM(CASE WHEN a.status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
        MIN(a.date) AS first_appointment,
        MAX(a.date) AS last_appointment
      FROM users u
      INNER JOIN appointments a ON u.id = a.student_id
      WHERE a.counselor_id = ? 
        AND a.date >= ? 
        AND a.date <= ?
        AND a.status != 'cancelled'
      GROUP BY u.id, u.name, u.email
      ORDER BY appointment_count DESC, u.name`,
      [req.user.id, monthStart.toISOString().split('T')[0], monthEnd.toISOString().split('T')[0]]
    );

    // Get activity data from user_activity table
    const [activities] = await pool.query(
      `SELECT 
        user_id,
        COUNT(*) AS activity_count,
        activity_type
      FROM user_activity
      WHERE activity_date >= ? 
        AND activity_date <= ?
      GROUP BY user_id, activity_type`,
      [monthStart.toISOString().split('T')[0], monthEnd.toISOString().split('T')[0]]
    );

    // Combine data
    const studentMap = new Map();
    students.forEach(s => {
      studentMap.set(s.id, {
        ...s,
        activities: []
      });
    });

    activities.forEach(a => {
      if (studentMap.has(a.user_id)) {
        studentMap.get(a.user_id).activities.push(a);
      }
    });

    res.json({
      period: {
        year: monthStart.getFullYear(),
        month: monthStart.getMonth() + 1,
        start: monthStart.toISOString().split('T')[0],
        end: monthEnd.toISOString().split('T')[0]
      },
      students: Array.from(studentMap.values()),
      total_students: studentMap.size
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to get stats data (used by CSV and PDF exports)
async function getStatsData(userId, viewMode, params) {
  let startDate, endDate, period;
  
  if (viewMode === 'weekly') {
    const { startDate: startDateParam } = params;
    let weekStart;
    if (startDateParam) {
      weekStart = new Date(startDateParam);
      // Validate date
      if (isNaN(weekStart.getTime())) {
        throw new Error('Invalid start date');
      }
    } else {
      weekStart = new Date();
      const day = weekStart.getDay();
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
      weekStart.setDate(diff);
    }
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    startDate = weekStart.toISOString().split('T')[0];
    endDate = weekEnd.toISOString().split('T')[0];
    period = { start: startDate, end: endDate };
  } else {
    const { year, month } = params;
    let targetDate;
    if (year && month) {
      // Validate year and month
      const yearInt = parseInt(year);
      const monthInt = parseInt(month);
      if (isNaN(yearInt) || isNaN(monthInt) || monthInt < 1 || monthInt > 12) {
        throw new Error('Invalid year or month');
      }
      targetDate = new Date(yearInt, monthInt - 1, 1);
    } else {
      targetDate = new Date();
      targetDate.setDate(1);
    }
    
    const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    
    const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);
    
    startDate = monthStart.toISOString().split('T')[0];
    endDate = monthEnd.toISOString().split('T')[0];
    period = {
      year: monthStart.getFullYear(),
      month: monthStart.getMonth() + 1,
      start: startDate,
      end: endDate
    };
  }

  let query;
  let queryParams;
  
  if (viewMode === 'monthly') {
    query = `SELECT DISTINCT 
      u.id, 
      u.name, 
      u.email,
      COUNT(DISTINCT a.id) AS appointment_count,
      SUM(CASE WHEN a.status = 'successful' THEN 1 ELSE 0 END) AS successful_count,
      SUM(CASE WHEN a.status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
      MIN(a.date) AS first_appointment, 
      MAX(a.date) AS last_appointment
    FROM users u
    INNER JOIN appointments a ON u.id = a.student_id
    WHERE a.counselor_id = ? 
      AND a.date >= ? 
      AND a.date <= ?
      AND a.status != 'cancelled'
    GROUP BY u.id, u.name, u.email
    ORDER BY appointment_count DESC, u.name`;
    queryParams = [userId, startDate, endDate];
  } else {
    query = `SELECT DISTINCT 
      u.id, 
      u.name, 
      u.email,
      COUNT(DISTINCT a.id) AS appointment_count,
      SUM(CASE WHEN a.status = 'successful' THEN 1 ELSE 0 END) AS successful_count,
      SUM(CASE WHEN a.status = 'approved' THEN 1 ELSE 0 END) AS approved_count
    FROM users u
    INNER JOIN appointments a ON u.id = a.student_id
    WHERE a.counselor_id = ? 
      AND a.date >= ? 
      AND a.date <= ?
      AND a.status != 'cancelled'
    GROUP BY u.id, u.name, u.email
    ORDER BY appointment_count DESC, u.name`;
    queryParams = [userId, startDate, endDate];
  }
  
  const [students] = await pool.query(query, queryParams);

  return { students, period };
}

// Download weekly stats as CSV
exports.downloadWeeklyCSV = async (req, res) => {
  try {
    if (req.user.role !== 'counselor') {
      return res.status(403).json({ message: 'Forbidden - Only counselors can access reports' });
    }

    const { startDate } = req.query;
    const { students, period } = await getStatsData(req.user.id, 'weekly', { startDate });

    let csv = 'Student Name,Email,Total Appointments,Approved,Successful\n';
    students.forEach(student => {
      csv += `"${student.name}","${student.email}",${student.appointment_count},${student.approved_count || 0},${student.successful_count || 0}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="weekly-report-${period.start}-to-${period.end}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('Error generating weekly CSV report:', err);
    if (err.message === 'Invalid start date') {
      return res.status(400).json({ message: 'Invalid start date provided' });
    }
    res.status(500).json({ message: 'Error generating report. Please try again.' });
  }
};

// Download monthly stats as CSV
exports.downloadMonthlyCSV = async (req, res) => {
  try {
    if (req.user.role !== 'counselor') {
      return res.status(403).json({ message: 'Forbidden - Only counselors can access reports' });
    }

    const { year, month } = req.query;
    const { students, period } = await getStatsData(req.user.id, 'monthly', { year, month });

    let csv = 'Student Name,Email,Total Appointments,Approved,Successful,First Appointment,Last Appointment\n';
    students.forEach(student => {
      csv += `"${student.name}","${student.email}",${student.appointment_count},${student.approved_count || 0},${student.successful_count || 0},"${student.first_appointment || ''}","${student.last_appointment || ''}"\n`;
    });

    const monthName = new Date(period.year, period.month - 1, 1).toLocaleString('default', { month: 'long' });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="monthly-report-${monthName}-${period.year}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('Error generating monthly CSV report:', err);
    if (err.message === 'Invalid year or month') {
      return res.status(400).json({ message: 'Invalid year or month provided' });
    }
    res.status(500).json({ message: 'Error generating report. Please try again.' });
  }
};

// Download weekly stats as PDF
exports.downloadWeeklyPDF = async (req, res) => {
  try {
    if (req.user.role !== 'counselor') {
      return res.status(403).json({ message: 'Forbidden - Only counselors can access reports' });
    }

    const { startDate } = req.query;
    const { students, period } = await getStatsData(req.user.id, 'weekly', { startDate });

    const doc = new PDFDocument({ margin: 50 });
    const filename = `weekly-report-${period.start}-to-${period.end}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    doc.fontSize(20).text('Weekly Student Usage Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Period: ${period.start} to ${period.end}`, { align: 'center' });
    doc.text(`Total Students: ${students.length}`, { align: 'center' });
    doc.moveDown();

    let y = doc.y;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Student Name', 50, y);
    doc.text('Email', 200, y);
    doc.text('Total', 320, y, { width: 50, align: 'right' });
    doc.text('Approved', 380, y, { width: 50, align: 'right' });
    doc.text('Successful', 450, y, { width: 60, align: 'right' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica');
    students.forEach((student, index) => {
      if (doc.y > 700) {
        doc.addPage();
        y = 50;
      }
      doc.text(student.name, 50, doc.y, { width: 140 });
      doc.text(student.email, 200, doc.y, { width: 110 });
      doc.text(String(student.appointment_count), 320, doc.y, { width: 50, align: 'right' });
      doc.text(String(student.approved_count || 0), 380, doc.y, { width: 50, align: 'right' });
      doc.text(String(student.successful_count || 0), 450, doc.y, { width: 60, align: 'right' });
      doc.moveDown(0.8);
      if (index < students.length - 1) {
        doc.moveTo(50, doc.y - 5).lineTo(550, doc.y - 5).stroke();
      }
    });

    doc.end();
  } catch (err) {
    console.error('Error generating weekly PDF report:', err);
    if (err.message === 'Invalid start date') {
      return res.status(400).json({ message: 'Invalid start date provided' });
    }
    res.status(500).json({ message: 'Error generating report. Please try again.' });
  }
};

// Download monthly stats as PDF
exports.downloadMonthlyPDF = async (req, res) => {
  try {
    if (req.user.role !== 'counselor') {
      return res.status(403).json({ message: 'Forbidden - Only counselors can access reports' });
    }

    const { year, month } = req.query;
    const { students, period } = await getStatsData(req.user.id, 'monthly', { year, month });

    const doc = new PDFDocument({ margin: 50 });
    const monthName = new Date(period.year, period.month - 1, 1).toLocaleString('default', { month: 'long' });
    const filename = `monthly-report-${monthName}-${period.year}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    doc.fontSize(20).text('Monthly Student Usage Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`${monthName} ${period.year}`, { align: 'center' });
    doc.text(`Total Students: ${students.length}`, { align: 'center' });
    doc.moveDown();

    let y = doc.y;
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Student Name', 50, y, { width: 100 });
    doc.text('Email', 160, y, { width: 100 });
    doc.text('Total', 270, y, { width: 40, align: 'right' });
    doc.text('Approved', 320, y, { width: 40, align: 'right' });
    doc.text('Successful', 370, y, { width: 50, align: 'right' });
    doc.text('First Appt', 430, y, { width: 60 });
    doc.text('Last Appt', 500, y, { width: 60 });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica');
    students.forEach((student, index) => {
      if (doc.y > 700) {
        doc.addPage();
        y = 50;
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Student Name', 50, y, { width: 100 });
        doc.text('Email', 160, y, { width: 100 });
        doc.text('Total', 270, y, { width: 40, align: 'right' });
        doc.text('Approved', 320, y, { width: 40, align: 'right' });
        doc.text('Successful', 370, y, { width: 50, align: 'right' });
        doc.text('First Appt', 430, y, { width: 60 });
        doc.text('Last Appt', 500, y, { width: 60 });
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke();
        doc.moveDown(0.5);
        doc.font('Helvetica');
      }
      
      const firstAppt = student.first_appointment ? new Date(student.first_appointment).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-';
      const lastAppt = student.last_appointment ? new Date(student.last_appointment).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-';
      
      doc.text(student.name, 50, doc.y, { width: 100 });
      doc.text(student.email, 160, doc.y, { width: 100 });
      doc.text(String(student.appointment_count), 270, doc.y, { width: 40, align: 'right' });
      doc.text(String(student.approved_count || 0), 320, doc.y, { width: 40, align: 'right' });
      doc.text(String(student.successful_count || 0), 370, doc.y, { width: 50, align: 'right' });
      doc.text(firstAppt, 430, doc.y, { width: 60 });
      doc.text(lastAppt, 500, doc.y, { width: 60 });
      doc.moveDown(0.8);
      if (index < students.length - 1) {
        doc.moveTo(50, doc.y - 5).lineTo(560, doc.y - 5).stroke();
      }
    });

    doc.end();
  } catch (err) {
    console.error('Error generating monthly PDF report:', err);
    if (err.message === 'Invalid year or month') {
      return res.status(400).json({ message: 'Invalid year or month provided' });
    }
    res.status(500).json({ message: 'Error generating report. Please try again.' });
  }
};

