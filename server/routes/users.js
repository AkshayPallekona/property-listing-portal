const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const csrf = require('../middleware/csrf');
const User = require('../models/User');
const Favorite = require('../models/Favorite');
const Inquiry = require('../models/Inquiry');
const Property = require('../models/Property');

router.get('/me', authenticate, async (req, res) => {
  res.json({ success: true, data: { user: req.user.toPublicJSON() } });
});

router.patch('/me', authenticate, csrf, async (req, res, next) => {
  try {
    // Allowlist only
    const allowed = ['name', 'phone'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, data: { user: user.toPublicJSON() }, message: 'Profile updated' });
  } catch (err) { next(err); }
});

router.get('/me/favorites', authenticate, async (req, res, next) => {
  try {
    const favs = await Favorite.find({ user: req.user._id }).populate('property');
    const items = favs.map(f => ({
      ...f.property.toObject(),
      unavailable: f.property.status !== 'published',
    }));
    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

router.get('/me/inquiries', authenticate, async (req, res, next) => {
  try {
    const items = await Inquiry.find({ seeker: req.user._id }).populate('property', 'title city status');
    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

router.patch('/me/inquiries/:id/cancel', authenticate, csrf, async (req, res, next) => {
  try {
    const inq = await Inquiry.findOne({ _id: req.params.id, seeker: req.user._id, status: 'pending' });
    if (!inq) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Inquiry not found or cannot cancel' } });
    inq.status = 'cancelled';
    await inq.save();
    res.json({ success: true, message: 'Cancelled' });
  } catch (err) { next(err); }
});

router.get('/me/properties', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Owner access only' } });
    }
    const items = await Property.find({ owner: req.user._id });
    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

module.exports = router;
