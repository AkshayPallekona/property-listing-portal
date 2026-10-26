const mongoose = require('mongoose');
const crypto = require('crypto');

const passwordResetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL
}, { timestamps: true });

passwordResetSchema.statics.createToken = async function(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await this.deleteMany({ user: userId }); // single active
  await this.create({
    user: userId,
    tokenHash,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });
  return token;
};

passwordResetSchema.statics.verifyAndConsume = async function(token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const doc = await this.findOneAndDelete({ tokenHash, expiresAt: { $gt: new Date() } });
  return doc ? doc.user : null;
};

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
