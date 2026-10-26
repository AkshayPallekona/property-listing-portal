require('dotenv').config();
if (process.env.NODE_ENV === 'production') {
  console.error('Seed script refused to run in production');
  process.exit(1);
}
const mongoose = require('mongoose');
const User = require('../server/models/User');
const Property = require('../server/models/Property');
const { connectDB } = require('../server/config/db');
const { generatePublicId } = require('../server/services/propertyService');

async function seed() {
  await connectDB();
  console.log('Seeding development data...');
  await User.deleteMany({});
  await Property.deleteMany({});
  const owner = await User.create({
    name: 'Demo Owner',
    email: 'owner@example.com',
    password: 'Owner123!',
    role: 'owner',
  });
  const seeker = await User.create({
    name: 'Demo Seeker',
    email: 'seeker@example.com',
    password: 'Seeker123!',
    role: 'seeker',
  });
  await Property.create({
    title: 'Spacious 2BHK Apartment',
    publicId: generatePublicId(),
    description: 'Bright apartment near metro. Ideal for families.',
    propertyType: 'apartment',
    purpose: 'rent',
    price: 25000,
    deposit: 50000,
    bedrooms: 2,
    bathrooms: 2,
    area: 1100,
    areaUnit: 'sqft',
    furnishing: 'semi-furnished',
    amenities: ['parking', 'gym', 'security'],
    address: '123 Main Road',
    locality: 'Koramangala',
    city: 'Bangalore',
    state: 'Karnataka',
    postalCode: '560034',
    owner: owner._id,
    status: 'published',
    images: [{ url: '/assets/images/placeholder.jpg', publicId: 'demo1', order: 0 }],
  });
  console.log('Seed complete. Demo users: owner@example.com / Owner123! and seeker@example.com / Seeker123!');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
