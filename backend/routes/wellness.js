const express = require('express');
const router = express.Router();
const wellnessController = require('../controllers/wellnessController');
const authenticate = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// Public routes (if any)
// router.get('/public', wellnessController.getPublicForms);

// Protected routes
router.get('/', authenticate, wellnessController.getWellnessForms);
router.get('/:id', authenticate, wellnessController.getWellnessFormById);

// Counselor routes
router.post('/', authenticate, requireRole(['counselor']), wellnessController.createWellnessForm);

// Student routes
router.post('/responses', authenticate, requireRole(['student']), wellnessController.submitWellnessResponse);
router.get('/responses/student', authenticate, requireRole(['student']), wellnessController.getStudentResponses);
router.get('/responses/student/:id', authenticate, requireRole(['student']), wellnessController.getResponseById);

// Counselor routes for viewing responses
router.get('/responses/counselor', authenticate, requireRole(['counselor']), wellnessController.getCounselorResponses);
router.get('/responses/counselor/:id', authenticate, requireRole(['counselor']), wellnessController.getResponseById);

module.exports = router;