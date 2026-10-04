# ParkEase – Mall Parking Management System

ParkEase is a web-based parking management system for malls. It allows users to book parking slots, guards to verify vehicle entry and exit using QR codes, and mall owners to manage their parking areas.

The project is built using React, Node.js, Express.js and MongoDB. It also includes JWT-based authentication with different roles for users, mall owners, guards and admins.

## Main Features

- User registration and login
- Different access levels for User, Mall Owner, Guard and Admin
- Automatic parking slot allocation
- Parking booking and cancellation
- QR-based entry and exit verification
- Automatic parking fee calculation
- Mall approval system
- Parking slot management
- Admin and owner dashboards
- Protection against double booking when multiple users try to book the same slot

## Tech Stack

### Frontend
- React.js
- Vite
- React Router
- Axios
- Lucide React
- CSS

### Backend
- Node.js
- Express.js
- JWT
- bcryptjs
- QR Code
- CORS
- dotenv
- Morgan

### Database
- MongoDB
- Mongoose

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

## How It Works

### 1. Parking Slot Allocation

When a user books a parking slot, the backend looks for an available slot matching the selected vehicle type. The slot is updated in the same database operation, which helps prevent two users from getting the same slot when they try to book at nearly the same time.

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
### 2. One Active Booking Per User

A user cannot have more than one active parking booking at a time. Before creating a new booking, the backend checks whether the user already has a booking with BOOKED or ACTIVE status.
```
const activeBooking = await Booking.findOne({
  user: userId,
  bookingStatus: { $in: ['BOOKED', 'ACTIVE'] },
});

if (activeBooking) {
  return sendError(res, 'You already have an active parking booking.', 400);
}
```
### 3. Entry, Exit and Billing

The booking goes through different states during the parking process:

BOOKED → ACTIVE when the guard verifies the vehicle at entry.
ACTIVE → COMPLETED when the vehicle exits.
Entry and exit times are recorded by the server.
The parking fee is calculated using the parking duration.
After exit, the parking slot is released and becomes AVAILABLE again.

### 4. Dashboard Data

The dashboards show information such as total slots, available slots, occupied slots, bookings and revenue. These independent database queries are executed together using Promise.all().
```
const [
  totalSlots,
  availableSlots,
  occupiedSlots,
  totalBookings,
  completedBookings,
  revenueResult
] = await Promise.all([
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
