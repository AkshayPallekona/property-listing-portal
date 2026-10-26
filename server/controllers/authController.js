const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const { generateToken, setTokenCookie } = require('../middleware/auth');
const { sendPasswordReset } = require('../services/emailService');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many auth attempts' } },
});

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, error: { code: 'VALIDATION', message: 'Validation failed', details: errors.array() } });
  }
  next();
};

const registerValidators = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name 2-100 chars'),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password ≥8 with upper, lower, digit'),
  body('role').optional().isIn(['seeker', 'owner']),
];

const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'seeker' } = req.body;
    // Role allowlist - ignore others
    const safeRole = ['seeker', 'owner'].includes(role) ? role : 'seeker';
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, error: { code: 'DUPLICATE', message: 'Email already registered' } });
    }
    const user = await User.create({ name, email, password, role: safeRole });
    const token = generateToken(user);
    setTokenCookie(res, token);
    res.status(201).json({ success: true, data: { user: user.toPublicJSON() }, message: 'Registered successfully' });
  } catch (err) {
    next(err);
  }
};

const loginValidators = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password +tokenVersion +status');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, error: { code: 'SUSPENDED', message: 'Account suspended' } });
    }
    const token = generateToken(user);
    setTokenCookie(res, token);
    res.json({ success: true, data: { user: user.toPublicJSON() }, message: 'Logged in' });
  } catch (err) {
    next(err);
  }
};

const logout = (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax', path: '/' });
  res.json({ success: true, message: 'Logged out' });
};

const forgotPasswordValidators = [body('email').isEmail().normalizeEmail()];

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    // Always same response
    if (user) {
      const token = await PasswordReset.createToken(user._id);
      await sendPasswordReset(email, token);
    }
    res.json({ success: true, message: 'If an account exists, a reset link has been sent' });
  } catch (err) {
    next(err);
  }
};

const resetPasswordValidators = [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
];

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const userId = await PasswordReset.verifyAndConsume(token);
    if (!userId) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } });
    }
    const user = await User.findById(userId).select('+tokenVersion');
    if (!user) return res.status(400).json({ success: false, error: { code: 'INVALID', message: 'User not found' } });
    user.password = password;
    user.tokenVersion += 1;
    await user.save();
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res) => {
  res.json({ success: true, data: { user: req.user.toPublicJSON() } });
};

const changePasswordValidators = [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
];

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password +tokenVersion');
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, error: { code: 'INVALID', message: 'Current password incorrect' } });
    }
    user.password = newPassword;
    user.tokenVersion += 1;
    await user.save();
    res.json({ success: true, message: 'Password changed. Please login again.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  authLimiter,
  registerValidators, register, validate,
  loginValidators, login,
  logout,
  forgotPasswordValidators, forgotPassword,
  resetPasswordValidators, resetPassword,
  me,
  changePasswordValidators, changePassword,
};
