const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const resourceController = require('../controllers/resourceController');

router.get('/', auth, resourceController.getResources);

router.post('/', auth, requireRole('counselor'), resourceController.createResource);
router.put('/:id', auth, requireRole('counselor'), resourceController.updateResource);
router.delete('/:id', auth, requireRole('counselor'), resourceController.deleteResource);

module.exports = router;
