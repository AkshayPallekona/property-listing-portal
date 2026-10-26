require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../server/models/User');
const { connectDB } = require('../server/config/db');

async function createAdmin() {
  await connectDB();
  const email = process.env.ADMIN_EMAIL || process.argv[2];
  const password = process.env.ADMIN_PASSWORD || process.argv[3];
  const name = process.env.ADMIN_NAME || 'Admin';
  if (!email || !password) {
    console.error('Provide ADMIN_EMAIL and ADMIN_PASSWORD in .env or as arguments');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters');
    process.exit(1);
  }
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Admin already exists');
    process.exit(0);
  }
  await User.create({ name, email, password, role: 'admin', status: 'active' });
  console.log(`Admin created: ${email}`);
  process.exit(0);
}

createAdmin().catch(err => { console.error(err); process.exit(1); });
