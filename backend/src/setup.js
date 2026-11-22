/**
 * ParkEase Setup Script
 * - Clears ALL seeded/demo data
 * - Creates real Admin, Guard, Mall Owner accounts
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/parkease';

// ── Inline schemas (avoid circular imports) ──────────────────────────────────
const userSchema = new mongoose.Schema({
  name:     String,
  email:    { type: String, lowercase: true, trim: true },
  password: String,
  phone:    String,
  role:     { type: String, enum: ['USER','MALL_OWNER','GUARD','ADMIN'], default: 'USER' },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User        = mongoose.model('User', userSchema);
const Booking     = mongoose.model('Booking',     new mongoose.Schema({}, { strict: false }));
const ParkingSlot = mongoose.model('ParkingSlot', new mongoose.Schema({}, { strict: false }));
const Mall        = mongoose.model('Mall',        new mongoose.Schema({}, { strict: false }));

// ── Pre-defined staff accounts ────────────────────────────────────────────────
const STAFF_ACCOUNTS = [
  {
    name:     'ParkEase Admin',
    email:    'adminparkease174@gmail.com',
    password: 'admin1@PE',
    phone:    '0000000000',
    role:     'ADMIN',
  },
  {
    name:     'Parking Guard',
    email:    'chikayadav001@gmail.com',
    password: 'guard@1PK',
    phone:    '1111111111',
    role:     'GUARD',
  },
  {
    name:     'Pantaloons Mall Owner',
    email:    'pantaloons@gmail.com',
    password: 'mallowner@1PK',
    phone:    '2222222222',
    role:     'MALL_OWNER',
  },
];

async function setup() {
  console.log('\n🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI, { family: 4, serverSelectionTimeoutMS: 15000 });
  console.log('✅ Connected!\n');

  // ── 1. Clear all collections ──────────────────────────────────────────────
  console.log('🗑️  Clearing all existing data...');
  await Promise.all([
    User.deleteMany({}),
    Booking.deleteMany({}),
    ParkingSlot.deleteMany({}),
    Mall.deleteMany({}),
  ]);
  console.log('   ✅ All users, bookings, malls, slots deleted.\n');

  // ── 2. Create staff accounts ──────────────────────────────────────────────
  console.log('👤 Creating staff accounts...');
  for (const acc of STAFF_ACCOUNTS) {
    const user = new User(acc);
    await user.save();
    console.log(`   ✅ ${acc.role.padEnd(10)} → ${acc.email}`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Setup Complete! Staff Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ADMIN      adminparkease174@gmail.com  /  admin1@PE');
  console.log('  GUARD      chikayadav001@gmail.com     /  guard@1PK');
  console.log('  MALL OWNER pantaloons@gmail.com        /  mallowner@1PK');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚠️  Note: Only USERs can self-register via the app.');
  console.log('   Staff must use above credentials to login.\n');

  await mongoose.disconnect();
  process.exit(0);
}

setup().catch((err) => {
  console.error('❌ Setup failed:', err.message);
  process.exit(1);
});
