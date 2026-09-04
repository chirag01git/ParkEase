# ParkEase – Mall Parking Management System

**ParkEase** is a full-stack, enterprise-ready **Mall Parking Management System** built with **Node.js, Express.js, MongoDB (Mongoose), JWT Auth (RBAC), and React (Vite)**.

It delivers real-time atomic slot allocation to eliminate double-booking race conditions, QR code gate entry/exit verification, duration-based server-side billing calculation, and parallelized MongoDB dashboard analytics using `Promise.all()`.

---

## 🌟 Key Features

1. **Role-Based Access Control (RBAC)**
   - 4 distinct roles: `USER`, `MALL_OWNER`, `GUARD`, `ADMIN`.
   - JWT authentication and authorization middleware protecting endpoints.
2. **Atomic Slot Allocation (`findOneAndUpdate`)**
   - Eliminates double-booking race conditions when multiple users attempt to reserve the final available slot simultaneously.
3. **Single Active Booking Enforcement**
   - Server-side rule preventing users from creating multiple active reservations (`BOOKED` or `ACTIVE`).
4. **QR Code Gate Verification**
   - Unique QR token generated per booking.
   - Guard portal verifies gate entry (`BOOKED` $\rightarrow$ `ACTIVE`) and exit (`ACTIVE` $\rightarrow$ `COMPLETED`).
5. **Timestamp & Server-Calculated Billing Engine**
   - Pricing based on actual server-side `entryTime` and `exitTime`.
   - **CAR**: ₹50 for 1st hour + ₹30 for each additional hour.
   - **BIKE**: ₹30 for 1st hour + ₹20 for each additional hour.
6. **Automatic Parking Slot Release**
   - Successful exit verification automatically sets slot status back to `AVAILABLE`.
7. **Mall Approval Workflow**
   - Malls created by owners start as `PENDING`. Only `ADMIN` can approve or reject malls.
   - Users can only view and book parking for `APPROVED` malls.
8. **Owner Authorization Scoping**
   - Mall owners can only inspect and manage slots/analytics for malls they own.
9. **`Promise.all()` Dashboard Analytics Optimization**
   - Independent aggregation and count queries execute concurrently for optimal response speed.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT (`jsonwebtoken`), `bcryptjs`, `qrcode`, `cors`, `dotenv`, `morgan`.
- **Frontend**: React 18, Vite, React Router DOM v6, Axios, Lucide Icons, `qrcode.react`, custom responsive CSS.
- **Database**: MongoDB (Local or Atlas URI).

---

## 📁 Project Architecture & Directory Structure

```
ParkEase/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # MongoDB connection setup
│   │   ├── models/
│   │   │   ├── User.js               # User schema with bcrypt hashing
│   │   │   ├── Mall.js               # Mall schema with approval status
│   │   │   ├── ParkingSlot.js        # Parking slot schema & compound unique index
│   │   │   └── Booking.js            # Booking schema with state machine & billing fields
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js     # JWT token authentication
│   │   │   ├── roleMiddleware.js     # RBAC authorization
│   │   │   └── errorHandler.js     # Centralized Express error handler
│   │   ├── controllers/
│   │   │   ├── authController.js     # Register, Login, Me
│   │   │   ├── mallController.js     # Mall CRUD & Mall Owner Dashboard
│   │   │   ├── slotController.js     # Slot CRUD & Available Slots
│   │   │   ├── bookingController.js  # Atomic Slot Allocation & Cancellation
│   │   │   ├── guardController.js    # Entry/Exit QR Verification & Billing Engine
│   │   │   └── adminController.js    # Admin Mall Approvals & System Analytics
│   │   ├── services/
│   │   │   ├── billingService.js     # Duration & pricing math
│   │   │   └── qrService.js          # QR token & data URL generation
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── mallRoutes.js
│   │   │   ├── bookingRoutes.js
│   │   │   ├── guardRoutes.js
│   │   │   └── adminRoutes.js
│   │   ├── utils/
│   │   │   └── responseHandler.js   # Standardized JSON response wrapper
│   │   ├── app.js
│   │   ├── server.js
│   │   └── seed.js                   # Database seed script
│   ├── test-flow.js                  # Comprehensive API test suite
│   ├── test-concurrency.js            # Race condition verification test
│   ├── .env
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/                      # Axios instance & API services
    │   ├── context/                  # AuthContext React provider
    │   ├── components/               # Navbar, Sidebar, ProtectedRoute, SlotGrid, StatusBadge, QrModal
    │   ├── pages/                    # Login, Register, User, Guard, Owner, Admin pages
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css                 # Modern CSS design system
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## 🔑 Test Credentials (Seed Data)

Running `npm run seed` in `ParkEase/backend` populates the database with:

| Role | Email | Password | Allowed Capabilities |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@parkease.com` | `Admin@123` | Approve/Reject Malls, Manage Users, Platform Dashboard |
| **MALL OWNER** | `owner@parkease.com` | `Owner@123` | Create Malls, Add Parking Slots, Owner Analytics |
| **GUARD** | `guard@parkease.com` | `Guard@123` | Gate QR Verification (Entry & Exit Processing) |
| **USER 1** | `user@parkease.com` | `User@123` | Reserve Parking, View Active QR Ticket, My Bookings |
| **USER 2** | `user2@parkease.com` | `User@123` | Additional User for Concurrency & Multi-user Testing |

### Seeded Malls:
1. **Grand Galleria Mall** (Status: `APPROVED`, Total Slots: 10)
2. **Phoenix Town Plaza** (Status: `PENDING`, Total Slots: 5)

---

## 🚀 Installation & Running Instructions

### Prerequisites:
- **Node.js**: v18+
- **MongoDB**: Local MongoDB instance running on `mongodb://127.0.0.1:27017`

### 1. Backend Setup & Run

```bash
cd ParkEase/backend
npm install
npm run seed
npm start
```
*Backend API will run on `http://localhost:5000`.*

### 2. Frontend Setup & Run

```bash
cd ParkEase/frontend
npm install
npm run dev
```
*Frontend web application will run on `http://localhost:5173`.*

---

## 🧪 Automated Testing & Concurrency Verification

Run automated test suites inside `ParkEase/backend`:

```bash
# Full API lifecycle and state machine transition test
npm run test:flow

# Race condition concurrency test (Simultaneous booking on last remaining slot)
npm run test:concurrency
```

---

## 📖 Deep Technical Explanations

### 1. Atomic Slot Allocation (`findOneAndUpdate`)
To prevent double-booking when two users attempt to reserve the last available slot simultaneously, slot allocation is executed in a single atomic MongoDB operation:

```javascript
const allocatedSlot = await ParkingSlot.findOneAndUpdate(
  {
    mall: mallId,
    status: 'AVAILABLE',
    vehicleType: { $in: [vehicleType, 'ANY'] },
  },
  {
    $set: { status: 'OCCUPIED' },
  },
  { new: true }
);

if (!allocatedSlot) {
  return sendError(res, 'No parking slots available for this vehicle type.', 400);
}
```

### 2. Single Active Booking Constraint
Server-side validation ensures a user cannot create multiple active reservations while holding a `BOOKED` or `ACTIVE` pass:

```javascript
const activeBooking = await Booking.findOne({
  user: userId,
  bookingStatus: { $in: ['BOOKED', 'ACTIVE'] },
});
if (activeBooking) {
  return sendError(res, 'You already have an active parking booking.', 400);
}
```

### 3. State Machine Transitions & Gate Logic
- **Entry**: `BOOKED` $\rightarrow$ `ACTIVE`. Sets server `entryTime` date. Rejects duplicate entry or exit prior to entry.
- **Exit**: `ACTIVE` $\rightarrow$ `COMPLETED`. Sets server `exitTime` date, computes duration and billing amount, and releases parking slot back to `AVAILABLE`.

### 4. `Promise.all()` Dashboard Analytics Optimization
Independent MongoDB aggregation queries execute in parallel to maximize throughput:

```javascript
const [totalSlots, availableSlots, occupiedSlots, totalBookings, completedBookings, revenueResult] = await Promise.all([
  ParkingSlot.countDocuments({ mall: id }),
  ParkingSlot.countDocuments({ mall: id, status: 'AVAILABLE' }),
  ParkingSlot.countDocuments({ mall: id, status: 'OCCUPIED' }),
  Booking.countDocuments({ mall: id }),
  Booking.countDocuments({ mall: id, bookingStatus: 'COMPLETED' }),
  Booking.aggregate([
    { $match: { mall: mall._id, bookingStatus: 'COMPLETED' } },
    { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
  ]),
]);
```

---

## 💼 How This Project Demonstrates Resume Claims

1. **Role-Based Access Control (RBAC)**: Implemented via custom JWT authentication & `authorizeRoles()` middleware.
2. **Mall Approval Workflow**: Strict status lifecycle (`PENDING` $\rightarrow$ `APPROVED` / `REJECTED`) where only approved malls are exposed for user booking.
3. **Automated Slot Allocation**: Zero manual slot pick needed; system selects available slots automatically.
4. **Atomic findOneAndUpdate**: Eliminates race conditions under concurrent workloads.
5. **One-Active-Booking Constraint**: Strict server-enforced business rule preventing multiple simultaneous reservations.
6. **QR-Based Verification**: Server-side QR token generation and gate verification without trusting frontend state.
7. **Server-Side Validation**: All timestamps, status transitions, duration, and price math occur strictly on backend.
8. **State Machine Transitions**: Clean `BOOKED` $\rightarrow$ `ACTIVE` $\rightarrow$ `COMPLETED` flow.
9. **Duration Billing Engine**: Dynamic hour-based pricing math for Cars and Bikes.
10. **Promise.all Analytics Optimization**: High-performance parallel MongoDB query execution for analytics dashboards.
