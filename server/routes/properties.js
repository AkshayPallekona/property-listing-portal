const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const csrf = require('../middleware/csrf');
const multer = require('multer');
const Property = require('../models/Property');
const { generatePublicId, transitionStatus } = require('../services/propertyService');
const { upload, deleteImage } = require('../services/imageService');
const { escapeRegex } = require('../utils/helpers');

const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only jpeg/png/webp allowed'));
  },
}).array('images', 10);

// Public search
router.get('/', async (req, res, next) => {
  try {
    const { q, city, locality, propertyType, purpose, minPrice, maxPrice, bedrooms, bathrooms, minArea, maxArea, furnishing, amenities, sort = 'newest', page = 1, limit = 20 } = req.query;
    const lim = Math.min(parseInt(limit) || 20, 50);
    const pg = Math.max(parseInt(page) || 1, 1);
    const filter = { status: 'published' };
    if (city) filter.city = new RegExp(escapeRegex(city), 'i');
    if (locality) filter.locality = new RegExp(escapeRegex(locality), 'i');
    if (propertyType) filter.propertyType = propertyType;
    if (purpose) filter.purpose = purpose;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    if (bedrooms) filter.bedrooms = { $gte: parseInt(bedrooms) };
    if (bathrooms) filter.bathrooms = { $gte: parseInt(bathrooms) };
    if (minArea || maxArea) {
      filter.area = {};
      if (minArea) filter.area.$gte = parseFloat(minArea);
      if (maxArea) filter.area.$lte = parseFloat(maxArea);
    }
    if (furnishing) filter.furnishing = furnishing;
    if (amenities) filter.amenities = { $all: Array.isArray(amenities) ? amenities : [amenities] };
    if (q) filter.$text = { $search: q };

    let query = Property.find(filter).populate('owner', 'name memberSince');
    if (sort === 'price_asc') query = query.sort({ price: 1 });
    else if (sort === 'price_desc') query = query.sort({ price: -1 });
    else query = query.sort({ createdAt: -1 });

    const total = await Property.countDocuments(filter);
    const items = await query.skip((pg - 1) * lim).limit(lim);
    res.json({
      success: true,
      data: { items, page: pg, limit: lim, total, totalPages: Math.ceil(total / lim) },
    });
  } catch (err) { next(err); }
});

router.get('/featured', async (req, res, next) => {
  try {
    const items = await Property.find({ status: 'published' }).sort({ createdAt: -1 }).limit(6).populate('owner', 'name memberSince');
    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

router.get('/recent', async (req, res, next) => {
  try {
    const items = await Property.find({ status: 'published' }).sort({ createdAt: -1 }).limit(12).populate('owner', 'name memberSince');
    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const prop = await Property.findById(req.params.id).populate('owner', 'name memberSince');
    if (!prop || prop.status !== 'published') {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Property not found' } });
    }
    res.json({ success: true, data: { property: prop } });
  } catch (err) { next(err); }
});

// Authenticated owner routes
router.post('/', authenticate, authorize('owner', 'admin'), csrf, async (req, res, next) => {
  try {
    // Allowlist fields
    const allowed = ['title', 'description', 'propertyType', 'purpose', 'price', 'deposit', 'bedrooms', 'bathrooms', 'area', 'areaUnit', 'furnishing', 'amenities', 'address', 'locality', 'city', 'state', 'postalCode', 'coordinates'];
    const data = { owner: req.user._id, publicId: generatePublicId() };
    allowed.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
    const prop = await Property.create(data);
    res.status(201).json({ success: true, data: { property: prop }, message: 'Created as draft' });
  } catch (err) { next(err); }
});

router.post('/:id/images', authenticate, authorize('owner', 'admin'), csrf, uploadMiddleware, async (req, res, next) => {
  try {
    const prop = await Property.findOne({ _id: req.params.id, owner: req.user._id });
    if (!prop) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Not found or not owner' } });
    if ((prop.images.length + (req.files || []).length) > 10) {
      return res.status(400).json({ success: false, error: { code: 'LIMIT', message: 'Max 10 images' } });
    }
    const uploaded = [];
    for (const file of req.files || []) {
      const img = await upload(file);
      uploaded.push({ ...img, order: prop.images.length + uploaded.length });
    }
    prop.images.push(...uploaded);
    await prop.save();
    res.json({ success: true, data: { images: prop.images }, message: 'Images uploaded' });
  } catch (err) { next(err); }
});

router.post('/:id/publish', authenticate, authorize('owner', 'admin'), csrf, async (req, res, next) => {
  try {
    const prop = await Property.findOne({ _id: req.params.id, owner: req.user._id });
    if (!prop) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    const updated = await transitionStatus(prop, 'published');
    res.json({ success: true, data: { property: updated }, message: 'Published or submitted for review' });
  } catch (err) { next(err); }
});

module.exports = router;
