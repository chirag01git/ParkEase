const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBookingById,
  getBookingQR,
  cancelBooking,
  deleteBookingHistory,
  createRazorpayOrder,
  verifyRazorpayPayment,
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
router.delete('/:id/history', authorizeRoles('USER', 'ADMIN'), deleteBookingHistory);
router.post('/:id/razorpay-order', authorizeRoles('USER', 'ADMIN'), createRazorpayOrder);
router.post('/:id/verify-razorpay-payment', authorizeRoles('USER', 'ADMIN'), verifyRazorpayPayment);

module.exports = router;
