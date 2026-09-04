const http = require('http');
const app = require('./src/app');
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Mall = require('./src/models/Mall');
const ParkingSlot = require('./src/models/ParkingSlot');
const Booking = require('./src/models/Booking');

let server;
let PORT = 5002;
const BASE_URL = `http://localhost:${PORT}/api`;

const request = async (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const options = {
      method: method.toUpperCase(),
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', err => reject(err));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runConcurrencyTest = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/parkease');
    server = app.listen(PORT);
    console.log(`[Concurrency Test Server Running on Port ${PORT}]`);

    // 1. Log in two different users
    const user1Login = await request('POST', '/auth/login', { email: 'user@parkease.com', password: 'User@123' });
    const user2Login = await request('POST', '/auth/login', { email: 'user2@parkease.com', password: 'User@123' });
    const ownerLogin = await request('POST', '/auth/login', { email: 'owner@parkease.com', password: 'Owner@123' });

    const token1 = user1Login.body.data.token;
    const token2 = user2Login.body.data.token;
    const ownerToken = ownerLogin.body.data.token;

    // 2. Setup a test mall with EXACTLY 1 AVAILABLE SLOT
    const mallRes = await Mall.create({
      name: 'Concurrency Arena Mall',
      address: '1 Race Condition Way',
      city: 'Metropolis',
      owner: ownerLogin.body.data.user._id,
      status: 'APPROVED',
      totalSlots: 1,
    });

    const slotRes = await ParkingSlot.create({
      mall: mallRes._id,
      slotNumber: 'SINGLE-01',
      vehicleType: 'CAR',
      status: 'AVAILABLE',
    });

    console.log(`Created test mall '${mallRes.name}' with 1 single AVAILABLE slot '${slotRes.slotNumber}'.`);
    console.log('Firing TWO simultaneous booking requests from User 1 and User 2 via Promise.all()...');

    // 3. Fire concurrent booking requests
    const [req1Promise, req2Promise] = await Promise.all([
      request('POST', '/bookings', { mallId: mallRes._id, vehicleNumber: 'CAR-1111', vehicleType: 'CAR' }, token1),
      request('POST', '/bookings', { mallId: mallRes._id, vehicleNumber: 'CAR-2222', vehicleType: 'CAR' }, token2),
    ]);

    console.log('\n--- Concurrent Booking Results ---');
    console.log('Request 1 Status:', req1Promise.status, 'Body:', req1Promise.body.message);
    console.log('Request 2 Status:', req2Promise.status, 'Body:', req2Promise.body.message);

    const statuses = [req1Promise.status, req2Promise.status];
    const successCount = statuses.filter(s => s === 201).length;
    const failureCount = statuses.filter(s => s === 400).length;

    console.log(`\nSuccesses (201): ${successCount}`);
    console.log(`Failures (400): ${failureCount}`);

    if (successCount === 1 && failureCount === 1) {
      console.log('\n✅ CONCURRENCY TEST PASSED: Atomic findOneAndUpdate prevented double-booking!');
    } else {
      console.error('\n❌ CONCURRENCY TEST FAILED: Race condition was NOT handled safely.');
      process.exit(1);
    }

    // Clean up test mall and slot
    await Mall.findByIdAndDelete(mallRes._id);
    await ParkingSlot.findByIdAndDelete(slotRes._id);
    await Booking.deleteMany({ mall: mallRes._id });

    server.close();
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Concurrency Test Error:', error);
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
};

runConcurrencyTest();
