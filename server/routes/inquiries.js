const express = require('express');
const router = express.Router();
// Owner inquiries stubs
router.get('/inquiries', (req, res) => res.json({ success: true, data: { items: [] } }));
router.get('/inquiries/:id', (req, res) => res.status(404).json({ success: false, error: { code: 'NOT_IMPLEMENTED' } }));
router.patch('/inquiries/:id/status', (req, res) => res.status(404).json({ success: false, error: { code: 'NOT_IMPLEMENTED' } }));
module.exports = router;
