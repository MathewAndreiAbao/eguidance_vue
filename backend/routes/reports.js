const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const reportsController = require('../controllers/reportsController');

router.get('/weekly', auth, requireRole('counselor'), reportsController.getWeeklyStats);
router.get('/monthly', auth, requireRole('counselor'), reportsController.getMonthlyStats);

router.get('/weekly/download/csv', auth, requireRole('counselor'), reportsController.downloadWeeklyCSV);
router.get('/weekly/download/pdf', auth, requireRole('counselor'), reportsController.downloadWeeklyPDF);
router.get('/monthly/download/csv', auth, requireRole('counselor'), reportsController.downloadMonthlyCSV);
router.get('/monthly/download/pdf', auth, requireRole('counselor'), reportsController.downloadMonthlyPDF);

// Analytics routes
router.get('/analytics/summary', auth, requireRole('counselor'), reportsController.getAnalyticsSummary);
router.get('/analytics/trends', auth, requireRole('counselor'), reportsController.getAppointmentTrends);
router.get('/analytics/engagement', auth, requireRole('counselor'), reportsController.getStudentEngagement);

module.exports = router;

