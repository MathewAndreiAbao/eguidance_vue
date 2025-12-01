const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const appointmentController = require('../controllers/appointmentController');

router.post('/', auth, requireRole(['student','counselor']), appointmentController.createAppointment);

router.get('/', auth, appointmentController.getAppointments);

router.get('/available-times', auth, appointmentController.getAvailableTimes);

router.put('/:id/status', auth, requireRole('counselor'), appointmentController.updateStatus);

router.put('/:id', auth, requireRole('counselor'), appointmentController.updateAppointment);

router.delete('/:id', auth, appointmentController.deleteAppointment);

module.exports = router;
