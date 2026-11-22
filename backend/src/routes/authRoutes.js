const express = require('express');
const router  = express.Router();
const { sendOtp, register, login, forgotPassword, resetPassword, getMe } = require('../controllers/authController');
const authenticateToken = require('../middleware/authMiddleware');

router.post('/send-otp', sendOtp);       // Step 1: send OTP to email
router.post('/register',  register);     // Step 2: verify OTP + create account
router.post('/login',     login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me',         authenticateToken, getMe);

module.exports = router;
