require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Mall = require('./models/Mall');
const ParkingSlot = require('./models/ParkingSlot');
const Booking = require('./models/Booking');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/parkease';
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing database collections...');
    await Promise.all([
      User.deleteMany({}),
      Mall.deleteMany({}),
      ParkingSlot.deleteMany({}),
      Booking.deleteMany({}),
    ]);

    console.log('Creating default users...');
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@parkease.com',
      password: 'Admin@123',
      phone: '9876543210',
      role: 'ADMIN',
    });

    const owner = await User.create({
      name: 'Mall Owner',
      email: 'owner@parkease.com',
      password: 'Owner@123',
      phone: '9876543211',
      role: 'MALL_OWNER',
    });

    const guard = await User.create({
      name: 'Gate Guard',
      email: 'guard@parkease.com',
      password: 'Guard@123',
      phone: '9876543212',
      role: 'GUARD',
    });

    const user1 = await User.create({
      name: 'John Driver',
      email: 'user@parkease.com',
      password: 'User@123',
      phone: '9876543213',
      role: 'USER',
    });

    const user2 = await User.create({
      name: 'Sarah Rider',
      email: 'user2@parkease.com',
      password: 'User@123',
      phone: '9876543214',
      role: 'USER',
    });

    console.log('Creating malls...');
    // Approved Mall
    const approvedMall = await Mall.create({
      name: 'Grand Galleria Mall',
      address: '100 Metro Avenue, Downtown',
      city: 'Metropolis',
      owner: owner._id,
      status: 'APPROVED',
      totalSlots: 10,
    });

    // Pending Mall
    const pendingMall = await Mall.create({
      name: 'Phoenix Town Plaza',
      address: '45 Sunshine Highway',
      city: 'Metropolis',
      owner: owner._id,
      status: 'PENDING',
      totalSlots: 5,
    });

    console.log('Creating parking slots for Grand Galleria Mall...');
    const grandSlots = [
      { mall: approvedMall._id, slotNumber: 'C-101', vehicleType: 'CAR', status: 'AVAILABLE' },
      { mall: approvedMall._id, slotNumber: 'C-102', vehicleType: 'CAR', status: 'AVAILABLE' },
      { mall: approvedMall._id, slotNumber: 'C-103', vehicleType: 'CAR', status: 'AVAILABLE' },
      { mall: approvedMall._id, slotNumber: 'C-104', vehicleType: 'CAR', status: 'AVAILABLE' },
      { mall: approvedMall._id, slotNumber: 'C-105', vehicleType: 'CAR', status: 'AVAILABLE' },
      { mall: approvedMall._id, slotNumber: 'C-106', vehicleType: 'CAR', status: 'AVAILABLE' },
      { mall: approvedMall._id, slotNumber: 'B-201', vehicleType: 'BIKE', status: 'AVAILABLE' },
      { mall: approvedMall._id, slotNumber: 'B-202', vehicleType: 'BIKE', status: 'AVAILABLE' },
      { mall: approvedMall._id, slotNumber: 'B-203', vehicleType: 'BIKE', status: 'AVAILABLE' },
      { mall: approvedMall._id, slotNumber: 'B-204', vehicleType: 'BIKE', status: 'AVAILABLE' },
    ];
    await ParkingSlot.insertMany(grandSlots);

    console.log('Creating parking slots for Phoenix Town Plaza...');
    const phoenixSlots = [
      { mall: pendingMall._id, slotNumber: 'P-01', vehicleType: 'ANY', status: 'AVAILABLE' },
      { mall: pendingMall._id, slotNumber: 'P-02', vehicleType: 'ANY', status: 'AVAILABLE' },
      { mall: pendingMall._id, slotNumber: 'P-03', vehicleType: 'ANY', status: 'AVAILABLE' },
      { mall: pendingMall._id, slotNumber: 'P-04', vehicleType: 'ANY', status: 'AVAILABLE' },
      { mall: pendingMall._id, slotNumber: 'P-05', vehicleType: 'ANY', status: 'AVAILABLE' },
    ];
    await ParkingSlot.insertMany(phoenixSlots);

    console.log('Database seeded successfully!');
    console.log('Seed Credentials:');
    console.log('  ADMIN:      admin@parkease.com / Admin@123');
    console.log('  MALL OWNER: owner@parkease.com / Owner@123');
    console.log('  GUARD:      guard@parkease.com / Guard@123');
    console.log('  USER 1:     user@parkease.com  / User@123');
    console.log('  USER 2:     user2@parkease.com / User@123');

    process.exit(0);
  } catch (error) {
    console.error('Seed Error:', error);
    process.exit(1);
  }
};

seedData();
