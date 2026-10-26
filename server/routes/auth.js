const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const csrf = require('../middleware/csrf');

router.post('/register', auth.authLimiter, csrf, auth.registerValidators, auth.validate, auth.register);
router.post('/login', auth.authLimiter, csrf, auth.loginValidators, auth.validate, auth.login);
router.post('/logout', csrf, auth.logout);
router.post('/forgot-password', auth.authLimiter, csrf, auth.forgotPasswordValidators, auth.validate, auth.forgotPassword);
router.post('/reset-password', auth.authLimiter, csrf, auth.resetPasswordValidators, auth.validate, auth.resetPassword);
router.get('/me', authenticate, auth.me);
router.patch('/change-password', authenticate, csrf, auth.changePasswordValidators, auth.validate, auth.changePassword);

module.exports = router;
