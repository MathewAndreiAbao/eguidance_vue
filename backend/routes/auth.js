const express = require('express');
const router = express.Router();
const { register, login, requestOTP, verifyOTP } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/request-otp', requestOTP);
router.post('/verify-otp', verifyOTP);

module.exports = router;