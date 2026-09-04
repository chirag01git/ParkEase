const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBookingById,
  getBookingQR,
  cancelBooking,
} = require('../controllers/bookingController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// All booking routes require authentication
router.use(authenticateToken);

router.post('/', authorizeRoles('USER', 'ADMIN'), createBooking);
router.get('/my', getMyBookings);
router.get('/:id', getBookingById);
router.get('/:id/qr', getBookingQR);
router.put('/:id/cancel', cancelBooking);

module.exports = router;
