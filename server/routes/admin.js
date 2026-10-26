const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
// Admin stubs
router.use(authenticate, authorize('admin'));
router.get('/dashboard', (req, res) => res.json({ success: true, data: { stats: { users: 0, properties: 0, inquiries: 0 } } }));
router.get('/users', (req, res) => res.json({ success: true, data: { items: [] } }));
router.patch('/users/:id/status', (req, res) => res.json({ success: true, message: 'Updated' }));
router.get('/properties', (req, res) => res.json({ success: true, data: { items: [] } }));
router.patch('/properties/:id/moderation', (req, res) => res.json({ success: true }));
router.get('/audit-logs', (req, res) => res.json({ success: true, data: { items: [] } }));
module.exports = router;
