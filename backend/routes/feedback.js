const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const authenticate = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// Student routes
router.post('/', authenticate, requireRole(['student']), feedbackController.createFeedback);
router.get('/student', authenticate, requireRole(['student']), feedbackController.getStudentFeedback);
router.put('/:id', authenticate, requireRole(['student']), feedbackController.updateFeedback);
router.delete('/:id', authenticate, requireRole(['student']), feedbackController.deleteFeedback);

// Counselor routes
router.get('/counselor', authenticate, requireRole(['counselor']), feedbackController.getCounselorFeedback);

module.exports = router;