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

module.exports = router;

