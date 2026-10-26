const express = require('express');
const router = express.Router();
// Reports stubs
router.post('/properties/:id/reports', (req, res) => res.status(201).json({ success: true, message: 'Reported' }));
router.get('/owner/reports', (req, res) => res.json({ success: true, data: { items: [] } }));
router.patch('/owner/reports/:id/response', (req, res) => res.json({ success: true }));
router.get('/admin/reports', (req, res) => res.json({ success: true, data: { items: [] } }));
router.patch('/admin/reports/:id', (req, res) => res.json({ success: true }));
module.exports = router;
