const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true, maxlength: 500 },
  status: { type: String, enum: ['open', 'resolved', 'dismissed'], default: 'open' },
  ownerResponse: { type: String, maxlength: 1000 },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: Date,
}, { timestamps: true });

reportSchema.index({ property: 1, reporter: 1, status: 1 });

module.exports = mongoose.model('Report', reportSchema);
