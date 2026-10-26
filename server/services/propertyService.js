const crypto = require('crypto');
const Property = require('../models/Property');

const ALLOWED_TRANSITIONS = {
  draft: ['pending_review', 'published'],
  pending_review: ['published', 'rejected'],
  rejected: ['draft'],
  published: ['unpublished', 'rented', 'sold', 'archived'],
  unpublished: ['published', 'archived'],
  rented: ['published', 'archived'],
  sold: ['published', 'archived'],
  archived: [], // terminal except admin restore
};

const canTransition = (from, to, { isAdmin = false, purpose } = {}) => {
  if (from === 'archived' && isAdmin && to === 'published') return true;
  const allowed = ALLOWED_TRANSITIONS[from] || [];
  if (!allowed.includes(to)) return false;
  if (to === 'rented' && purpose !== 'rent') return false;
  if (to === 'sold' && purpose !== 'sale') return false;
  return true;
};

const transitionStatus = async (property, newStatus, options = {}) => {
  if (!canTransition(property.status, newStatus, { ...options, purpose: property.purpose })) {
    const err = new Error(`Cannot transition from ${property.status} to ${newStatus}`);
    err.statusCode = 400;
    err.code = 'INVALID_TRANSITION';
    throw err;
  }
  // Publishing checks
  if (newStatus === 'published') {
    if (!property.images || property.images.length === 0) {
      const err = new Error('At least one image required to publish');
      err.statusCode = 400;
      throw err;
    }
    if (!property.price || property.price <= 0) {
      const err = new Error('Valid price required');
      err.statusCode = 400;
      throw err;
    }
    if (!property.address || !property.city || !property.state || !property.postalCode) {
      const err = new Error('Complete address required');
      err.statusCode = 400;
      throw err;
    }
    if (process.env.MODERATION_REQUIRED === 'true' && property.status !== 'pending_review' && !options.skipModeration) {
      newStatus = 'pending_review';
    }
  }
  property.status = newStatus;
  if (newStatus === 'published') {
    property.moderation.status = 'approved';
  } else if (newStatus === 'rejected') {
    property.moderation.status = 'rejected';
  }
  await property.save();
  return property;
};

const generatePublicId = () => crypto.randomBytes(6).toString('hex').toUpperCase();

module.exports = { canTransition, transitionStatus, generatePublicId, ALLOWED_TRANSITIONS };
