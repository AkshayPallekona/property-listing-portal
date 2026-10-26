const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  seeker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['inquiry', 'viewing'], required: true },
  message: { type: String, maxlength: 1000 },
  viewingDate: Date,
  viewingTime: String,
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'], default: 'pending' },
}, { timestamps: true });

inquirySchema.index({ property: 1, seeker: 1, status: 1 });
inquirySchema.index({ property: 1, status: 1, viewingDate: 1 });

module.exports = mongoose.model('Inquiry', inquirySchema);
