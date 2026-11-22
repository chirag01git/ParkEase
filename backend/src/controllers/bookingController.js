const Booking = require('../models/Booking');
const ParkingSlot = require('../models/ParkingSlot');
const Mall = require('../models/Mall');
const { createHmac, timingSafeEqual } = require('crypto');
const { generateQRToken, generateQRDataUrl } = require('../services/qrService');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// POST /api/bookings (Create Booking with Atomic Slot Allocation)
const createBooking = async (req, res, next) => {
  try {
    const { mallId, vehicleNumber, vehicleType } = req.body;
    const userId = req.user.userId;

    if (!mallId || !vehicleNumber || !vehicleType) {
      return sendError(res, 'Mall ID, vehicle number, and vehicle type (CAR/BIKE) are required', 400);
    }

    const vType = vehicleType.toUpperCase();
    if (!['CAR', 'BIKE'].includes(vType)) {
      return sendError(res, 'Invalid vehicle type. Allowed types: CAR, BIKE', 400);
    }

    // REQUIREMENT 7: Check Mall Approval
    const mall = await Mall.findById(mallId);
    if (!mall) {
      return sendError(res, 'Mall not found', 404);
    }
    if (mall.status !== 'APPROVED') {
      return sendError(res, 'Cannot book parking for a mall that is not approved', 400);
    }

    // REQUIREMENT 2: Server-side check for ONE ACTIVE BOOKING PER USER
    // A user must clear an outstanding parking bill before creating another booking.
    const activeBooking = await Booking.findOne({
      user: userId,
      bookingStatus: { $in: ['BOOKED', 'ACTIVE', 'PAYMENT_PENDING', 'PAYMENT_PAID'] },
    });

    if (activeBooking) {
      return sendError(res, 'You already have an active parking booking.', 400);
    }

    // REQUIREMENT 1: ATOMIC SLOT ALLOCATION using findOneAndUpdate
    // Atomically find an AVAILABLE slot matching the mall and vehicle type and set status = OCCUPIED in one operation.
    const allocatedSlot = await ParkingSlot.findOneAndUpdate(
      {
        mall: mallId,
        status: 'AVAILABLE',
        vehicleType: { $in: [vType, 'ANY'] },
      },
      {
        $set: { status: 'OCCUPIED' },
      },
      {
        new: true,
      }
    );

    if (!allocatedSlot) {
      return sendError(res, 'No parking slots available for this vehicle type.', 400);
    }

    // Generate unique QR token
    const qrToken = generateQRToken();
    let booking;

    try {
      booking = await Booking.create({
        user: userId,
        mall: mallId,
        slot: allocatedSlot._id,
        vehicleNumber: vehicleNumber.toUpperCase().trim(),
        vehicleType: vType,
        qrCode: qrToken,
        bookingStatus: 'BOOKED',
      });
    } catch (err) {
      // If booking creation fails, rollback allocated slot status back to AVAILABLE
      await ParkingSlot.findByIdAndUpdate(allocatedSlot._id, { status: 'AVAILABLE' });
      throw err;
    }

    // Generate QR Data URL for display
    const qrDataUrl = await generateQRDataUrl(qrToken);

    await booking.populate([
      { path: 'mall', select: 'name address city' },
      { path: 'slot', select: 'slotNumber vehicleType' },
      { path: 'user', select: 'name email phone' },
    ]);

    return sendSuccess(res, 'Booking created successfully', {
      booking,
      qrDataUrl,
    }, 201);
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings/my (Get logged-in user's bookings)
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user.userId })
      .populate('mall', 'name address city')
      .populate('slot', 'slotNumber vehicleType')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'User bookings retrieved', { bookings });
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings/:id (Get single booking details)
const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate('mall', 'name address city owner')
      .populate('slot', 'slotNumber vehicleType status')
      .populate('user', 'name email phone');

    if (!booking) {
      return sendError(res, 'Booking not found', 404);
    }

    // Authorization check: User who owns booking, Mall Owner, Guard, or Admin
    const isOwner = booking.user._id.toString() === req.user.userId;
    const isMallOwner = booking.mall && booking.mall.owner && booking.mall.owner.toString() === req.user.userId;
    const isStaff = ['GUARD', 'ADMIN'].includes(req.user.role);

    if (!isOwner && !isMallOwner && !isStaff) {
      return sendError(res, 'Unauthorized access to booking details', 403);
    }

    const qrDataUrl = await generateQRDataUrl(booking.qrCode);

    return sendSuccess(res, 'Booking details retrieved', { booking, qrDataUrl });
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings/:id/qr (Get QR Data URL image for booking)
const getBookingQR = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return sendError(res, 'Booking not found', 404);
    }

    if (booking.user.toString() !== req.user.userId && !['GUARD', 'ADMIN'].includes(req.user.role)) {
      return sendError(res, 'Unauthorized to view QR for this booking', 403);
    }

    const qrDataUrl = await generateQRDataUrl(booking.qrCode);
    return sendSuccess(res, 'QR Code generated', { qrCode: booking.qrCode, qrDataUrl });
  } catch (error) {
    next(error);
  }
};

// PUT /api/bookings/:id/cancel (Cancel booking if state is BOOKED)
const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return sendError(res, 'Booking not found', 404);
    }

    if (booking.user.toString() !== req.user.userId && req.user.role !== 'ADMIN') {
      return sendError(res, 'Unauthorized to cancel this booking', 403);
    }

    // Transition check: Only BOOKED bookings can be cancelled
    if (booking.bookingStatus !== 'BOOKED') {
      return sendError(res, `Cannot cancel booking with status '${booking.bookingStatus}'. Only 'BOOKED' bookings can be cancelled.`, 400);
    }

    booking.bookingStatus = 'CANCELLED';
    await booking.save();

    // Release allocated slot back to AVAILABLE
    if (booking.slot) {
      await ParkingSlot.findByIdAndUpdate(booking.slot, { status: 'AVAILABLE' });
    }

    return sendSuccess(res, 'Booking cancelled successfully and slot released', { booking });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/bookings/:id/history (Remove a user's finished/cancelled history item)
const deleteBookingHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) return sendError(res, 'Booking history item not found', 404);
    if (booking.user.toString() !== req.user.userId) {
      return sendError(res, 'Unauthorized to delete this booking history item', 403);
    }
    if (!['COMPLETED', 'CANCELLED'].includes(booking.bookingStatus)) {
      return sendError(res, 'Only completed or cancelled booking history can be deleted. Pay or complete the current booking first.', 400);
    }

    await booking.deleteOne();
    return sendSuccess(res, 'Booking history item deleted successfully', { id });
  } catch (error) {
    next(error);
  }
};

const ensurePaymentReady = (booking, userId) => {
  const bookingUserId = booking.user?._id ? booking.user._id.toString() : booking.user.toString();
  if (bookingUserId !== userId) return 'Unauthorized to pay for this booking';
  if (booking.bookingStatus !== 'PAYMENT_PENDING' || !booking.exitTime) {
    return 'Payment is available after the vehicle exit has been verified and the bill is calculated.';
  }
  if (booking.paymentStatus === 'PAID') return 'This parking bill has already been paid.';
  if (!booking.amount || booking.amount <= 0) return 'There is no payable amount for this booking.';
  return null;
};

// POST /api/bookings/:id/razorpay-order
const createRazorpayOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate('mall', 'name address city')
      .populate('slot', 'slotNumber vehicleType')
      .populate('user', 'name email phone');

    if (!booking) return sendError(res, 'Booking not found', 404);
    const readinessError = ensurePaymentReady(booking, req.user.userId);
    if (readinessError) return sendError(res, readinessError, readinessError.startsWith('Unauthorized') ? 403 : 400);
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return sendError(res, 'Razorpay Test Mode is not configured. Add the Razorpay test keys to the backend environment.', 503);
    }

    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(booking.amount * 100),
        currency: 'INR',
        receipt: `parking_${booking._id.toString().slice(-12)}`,
        notes: { bookingId: booking._id.toString(), mall: booking.mall.name },
      }),
    });
    const order = await razorpayResponse.json();
    if (!razorpayResponse.ok) {
      console.error('[Razorpay order error]:', order);
      return sendError(res, 'Could not start the Razorpay checkout. Please try again.', 502);
    }

    booking.razorpayOrderId = order.id;
    await booking.save();

    return sendSuccess(res, 'Razorpay order created.', {
      order: { id: order.id, amount: order.amount, currency: order.currency },
      keyId: process.env.RAZORPAY_KEY_ID,
      customer: { name: booking.user.name, email: booking.user.email, contact: booking.user.phone },
      booking: { id: booking._id, amount: booking.amount, mall: booking.mall.name },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/bookings/:id/verify-razorpay-payment
const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { razorpay_payment_id: paymentId, razorpay_order_id: orderId, razorpay_signature: signature } = req.body;
    if (!paymentId || !orderId || !signature) return sendError(res, 'Incomplete Razorpay payment response.', 400);

    const booking = await Booking.findById(id)
      .populate('mall', 'name address city')
      .populate('slot', 'slotNumber vehicleType');
    if (!booking) return sendError(res, 'Booking not found', 404);
    const readinessError = ensurePaymentReady(booking, req.user.userId);
    if (readinessError) return sendError(res, readinessError, readinessError.startsWith('Unauthorized') ? 403 : 400);
    if (!process.env.RAZORPAY_KEY_SECRET) return sendError(res, 'Razorpay Test Mode is not configured.', 503);
    if (booking.razorpayOrderId !== orderId) return sendError(res, 'The Razorpay order does not match this parking bill.', 400);

    const expectedSignature = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const receivedBuffer = Buffer.from(signature, 'utf8');
    if (expectedBuffer.length !== receivedBuffer.length || !timingSafeEqual(expectedBuffer, receivedBuffer)) {
      return sendError(res, 'Razorpay payment verification failed.', 400);
    }

    booking.paymentStatus = 'PAID';
    booking.paymentMethod = 'RAZORPAY';
    booking.paymentReference = paymentId;
    booking.paidAt = new Date();
    // The vehicle can only be released after a guard confirms this paid bill.
    booking.bookingStatus = 'PAYMENT_PAID';
    await booking.save();

    return sendSuccess(res, 'Razorpay payment verified successfully.', {
      booking,
      receipt: { reference: paymentId, amount: booking.amount, method: 'RAZORPAY', paidAt: booking.paidAt },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  getBookingQR,
  cancelBooking,
  deleteBookingHistory,
  createRazorpayOrder,
  verifyRazorpayPayment,
};
