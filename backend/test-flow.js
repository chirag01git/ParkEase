const http = require('http');
const app = require('./src/app');
const mongoose = require('mongoose');

let server;
let PORT = 5001;
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

const runTests = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/parkease');
    server = app.listen(PORT);
    console.log(`[Test Server Running on Port ${PORT}]`);

    console.log('\n--- 1. Testing Auth & Login for all Roles ---');
    const adminLogin = await request('POST', '/auth/login', { email: 'admin@parkease.com', password: 'Admin@123' });
    console.log('Admin Login status:', adminLogin.status, 'Success:', adminLogin.body.success);
    const adminToken = adminLogin.body.data.token;

    const ownerLogin = await request('POST', '/auth/login', { email: 'owner@parkease.com', password: 'Owner@123' });
    console.log('Owner Login status:', ownerLogin.status, 'Success:', ownerLogin.body.success);
    const ownerToken = ownerLogin.body.data.token;

    const guardLogin = await request('POST', '/auth/login', { email: 'guard@parkease.com', password: 'Guard@123' });
    console.log('Guard Login status:', guardLogin.status, 'Success:', guardLogin.body.success);
    const guardToken = guardLogin.body.data.token;

    const userLogin = await request('POST', '/auth/login', { email: 'user@parkease.com', password: 'User@123' });
    console.log('User Login status:', userLogin.status, 'Success:', userLogin.body.success);
    const userToken = userLogin.body.data.token;

    console.log('\n--- 2. Testing Self-Registration Self-Admin Block ---');
    const adminRegAttempt = await request('POST', '/auth/register', {
      name: 'Hacker',
      email: 'hacker@test.com',
      password: 'Password123',
      phone: '1111111111',
      role: 'ADMIN',
    });
    console.log('Self Admin Registration status (should be 403):', adminRegAttempt.status, 'Msg:', adminRegAttempt.body.message);

    console.log('\n--- 3. Testing Mall Creation & Pending State ---');
    const newMallRes = await request('POST', '/malls', {
      name: 'Starlight Mall',
      address: '77 Galaxy Blvd',
      city: 'Star City',
      totalSlots: 2,
    }, ownerToken);
    console.log('Create Mall status:', newMallRes.status, 'Status field (should be PENDING):', newMallRes.body.data.mall.status);
    const pendingMallId = newMallRes.body.data.mall._id;

    console.log('\n--- 4. Testing User Cannot Book Pending Mall ---');
    const bookPendingRes = await request('POST', '/bookings', {
      mallId: pendingMallId,
      vehicleNumber: 'KA-01-AB-1234',
      vehicleType: 'CAR',
    }, userToken);
    console.log('Book Pending Mall status (should be 400):', bookPendingRes.status, 'Msg:', bookPendingRes.body.message);

    console.log('\n--- 5. Testing Admin Approving Mall ---');
    const approveRes = await request('PUT', `/admin/malls/${pendingMallId}/approve`, {}, adminToken);
    console.log('Admin Approve status:', approveRes.status, 'New Status:', approveRes.body.data.mall.status);

    console.log('\n--- 6. Testing Slot Creation & Mall Owner Authorization ---');
    const addSlotsRes = await request('POST', `/malls/${pendingMallId}/slots`, {
      slots: [
        { slotNumber: 'S-01', vehicleType: 'CAR' },
        { slotNumber: 'S-02', vehicleType: 'CAR' },
      ],
    }, ownerToken);
    console.log('Add Slots status:', addSlotsRes.status, 'Total slots created:', addSlotsRes.body.data.slots.length);

    // Non-owner attempt to add slots
    const user2Login = await request('POST', '/auth/login', { email: 'user2@parkease.com', password: 'User@123' });
    const user2Token = user2Login.body.data.token;
    const unauthorizedSlotAdd = await request('POST', `/malls/${pendingMallId}/slots`, { slotNumber: 'S-99' }, user2Token);
    console.log('Unauthorized Slot Add status (should be 403):', unauthorizedSlotAdd.status, 'Msg:', unauthorizedSlotAdd.body.message);

    console.log('\n--- 7. Testing Booking Creation & Atomic Slot Allocation ---');
    const bookingRes = await request('POST', '/bookings', {
      mallId: pendingMallId,
      vehicleNumber: 'KA-05-MH-9999',
      vehicleType: 'CAR',
    }, userToken);
    console.log('Booking status:', bookingRes.status, 'Booking ID:', bookingRes.body.data.booking._id);
    const bookingId = bookingRes.body.data.booking._id;
    const qrCodeToken = bookingRes.body.data.booking.qrCode;

    console.log('\n--- 8. Testing Single Active Booking Constraint ---');
    const secondBookingRes = await request('POST', '/bookings', {
      mallId: pendingMallId,
      vehicleNumber: 'KA-05-MH-8888',
      vehicleType: 'CAR',
    }, userToken);
    console.log('Second Active Booking status (should be 400):', secondBookingRes.status, 'Msg:', secondBookingRes.body.message);

    console.log('\n--- 9. Testing Guard Invalid State Entry & Exit Rejection ---');
    // Attempt exit before entry
    const invalidExitRes = await request('POST', '/guard/verify-exit', { qrCode: qrCodeToken }, guardToken);
    console.log('Exit before entry status (should be 400):', invalidExitRes.status, 'Msg:', invalidExitRes.body.message);

    console.log('\n--- 10. Testing Guard Entry Verification (BOOKED -> ACTIVE) ---');
    const entryRes = await request('POST', '/guard/verify-entry', { qrCode: qrCodeToken }, guardToken);
    console.log('Entry Verification status:', entryRes.status, 'Booking Status:', entryRes.body.data.booking.bookingStatus);

    // Duplicate entry attempt
    const duplicateEntryRes = await request('POST', '/guard/verify-entry', { qrCode: qrCodeToken }, guardToken);
    console.log('Duplicate Entry status (should be 400):', duplicateEntryRes.status, 'Msg:', duplicateEntryRes.body.message);

    console.log('\n--- 11. Testing Guard Exit Verification (ACTIVE -> COMPLETED & Billing) ---');
    const exitRes = await request('POST', '/guard/verify-exit', { qrCode: qrCodeToken }, guardToken);
    console.log('Exit Verification status:', exitRes.status, 'Booking Status:', exitRes.body.data.booking.bookingStatus);
    console.log('  Calculated Duration (hrs):', exitRes.body.data.summary.durationInHours);
    console.log('  Calculated Bill Amount (₹):', exitRes.body.data.summary.totalAmount);
    console.log('  Slot Released back to AVAILABLE:', exitRes.body.data.summary.slotReleased);

    // Duplicate exit attempt
    const duplicateExitRes = await request('POST', '/guard/verify-exit', { qrCode: qrCodeToken }, guardToken);
    console.log('Duplicate Exit status (should be 400):', duplicateExitRes.status, 'Msg:', duplicateExitRes.body.message);

    console.log('\n--- 12. Testing Dashboards (Promise.all Parallel Aggregations) ---');
    const adminDashRes = await request('GET', '/admin/dashboard', null, adminToken);
    console.log('Admin Dashboard status:', adminDashRes.status, 'Total Revenue:', adminDashRes.body.data.stats.totalRevenue);

    const ownerDashRes = await request('GET', `/malls/${pendingMallId}/dashboard`, null, ownerToken);
    console.log('Mall Owner Dashboard status:', ownerDashRes.status, 'Stats:', ownerDashRes.body.data.stats);

    console.log('\nALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!');
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Test Suite Failed:', error);
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
};

runTests();
