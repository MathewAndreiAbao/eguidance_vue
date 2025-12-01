const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const announcementController = require('../controllers/announcementController');

router.get('/', auth, announcementController.getAnnouncements);

router.post('/', auth, requireRole('counselor'), announcementController.createAnnouncement);

router.put('/:id', auth, requireRole('counselor'), announcementController.updateAnnouncement);
router.delete('/:id', auth, requireRole('counselor'), announcementController.deleteAnnouncement);

module.exports = router;
