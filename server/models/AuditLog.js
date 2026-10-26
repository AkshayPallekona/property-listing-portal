const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  targetType: { type: String, required: true }, // user, property, report, etc.
  targetId: mongoose.Schema.Types.ObjectId,
  details: mongoose.Schema.Types.Mixed, // no secrets
  ip: String,
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
