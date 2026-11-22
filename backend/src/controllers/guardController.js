const Booking = require('../models/Booking');
const ParkingSlot = require('../models/ParkingSlot');
const Mall = require('../models/Mall');
const { calculateBilling } = require('../services/billingService');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// POST /api/guard/verify-entry
const verifyEntry = async (req, res, next) => {
  try {
    const { qrCode, bookingId } = req.body;

    if (!qrCode && !bookingId) {
      return sendError(res, 'QR Code token or Booking ID is required for entry verification', 400);
    }

    // Find booking by qrCode token or ObjectId
    const query = qrCode ? { qrCode } : { _id: bookingId };
    const booking = await Booking.findOne(query)
      .populate('mall', 'name status')
      .populate('slot', 'slotNumber status')
      .populate('user', 'name phone email');

    if (!booking) {
      return sendError(res, 'Invalid QR code or booking record not found', 404);
    }

    // Check mall status
    if (booking.mall.status !== 'APPROVED') {
      return sendError(res, 'Entry denied. Mall is not approved.', 400);
    }

    // State machine check: Allowed ONLY if BOOKED
    if (booking.bookingStatus === 'ACTIVE') {
      return sendError(res, 'Entry verification failed. Booking is already ACTIVE (vehicle already entered).', 400);
    }
    if (booking.bookingStatus === 'COMPLETED') {
      return sendError(res, 'Entry verification failed. Booking is already COMPLETED.', 400);
    }
    if (booking.bookingStatus === 'CANCELLED') {
      return sendError(res, 'Entry verification failed. Booking was CANCELLED.', 400);
    }
    if (booking.bookingStatus !== 'BOOKED') {
      return sendError(res, `Entry verification failed. Invalid booking status: '${booking.bookingStatus}'`, 400);
    }

    // Execute state transition: BOOKED -> ACTIVE
    booking.bookingStatus = 'ACTIVE';
    booking.entryTime = new Date();
    await booking.save();

    // Ensure slot status remains OCCUPIED
    if (booking.slot) {
      await ParkingSlot.findByIdAndUpdate(booking.slot._id, { status: 'OCCUPIED' });
    }

    return sendSuccess(res, 'Gate entry verified successfully. Vehicle is parked.', {
      booking,
      entryTime: booking.entryTime,
      slotNumber: booking.slot ? booking.slot.slotNumber : 'N/A',
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/guard/verify-exit
const verifyExit = async (req, res, next) => {
  try {
    const { qrCode, bookingId } = req.body;

    if (!qrCode && !bookingId) {
      return sendError(res, 'QR Code token or Booking ID is required for exit verification', 400);
    }

    const query = qrCode ? { qrCode } : { _id: bookingId };
    const booking = await Booking.findOne(query)
      .populate('mall', 'name')
      .populate('slot', 'slotNumber')
      .populate('user', 'name phone email');

    if (!booking) {
      return sendError(res, 'Invalid QR code or booking record not found', 404);
    }

    // State machine check: Allowed ONLY if ACTIVE
    if (booking.bookingStatus === 'BOOKED') {
      return sendError(res, 'Exit verification failed. Booking is BOOKED but vehicle never entered.', 400);
    }
    if (booking.bookingStatus === 'COMPLETED') {
      return sendError(res, 'Exit verification failed. Booking has ALREADY been completed / exited.', 400);
    }
    if (booking.bookingStatus === 'PAYMENT_PENDING') {
      return sendError(res, 'Exit has already been recorded. This booking is awaiting payment.', 400);
    }
    if (booking.bookingStatus === 'CANCELLED') {
      return sendError(res, 'Exit verification failed. Booking was CANCELLED.', 400);
    }
    if (booking.bookingStatus !== 'ACTIVE') {
      return sendError(res, `Exit verification failed. Invalid booking status: '${booking.bookingStatus}'`, 400);
    }

    if (!booking.entryTime) {
      return sendError(res, 'Exit verification failed. Missing entry timestamp on booking record.', 400);
    }

    const exitTime = new Date();

    // Server-side duration and billing calculation
    const billing = calculateBilling(booking.entryTime, exitTime, booking.vehicleType);

    // Update booking state: ACTIVE -> PAYMENT_PENDING. Completion happens only after payment verification.
    booking.exitTime = exitTime;
    booking.duration = billing.duration;
    booking.amount = billing.amount;
    booking.paymentStatus = 'PENDING';
    booking.bookingStatus = 'PAYMENT_PENDING';
    await booking.save();

    // Keep the slot occupied. It is released only after the paid bill is confirmed by a guard.
    return sendSuccess(res, 'Parking bill calculated. Collect payment before releasing the vehicle.', {
      booking,
      summary: {
        vehicleNumber: booking.vehicleNumber,
        vehicleType: booking.vehicleType,
        entryTime: booking.entryTime,
        exitTime: booking.exitTime,
        durationInHours: billing.duration,
        totalAmount: billing.amount,
        slotReleased: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/guard/bookings/:id/release (Release only a verified paid vehicle)
const releasePaidVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate('mall', 'name')
      .populate('slot', 'slotNumber');

    if (!booking) return sendError(res, 'Booking not found', 404);
    if (booking.bookingStatus !== 'PAYMENT_PAID' || booking.paymentStatus !== 'PAID') {
      return sendError(res, 'Vehicle cannot be released until the parking payment is verified.', 400);
    }

    booking.bookingStatus = 'COMPLETED';
    await booking.save();
    if (booking.slot) await ParkingSlot.findByIdAndUpdate(booking.slot._id, { status: 'AVAILABLE' });

    return sendSuccess(res, 'Payment confirmed. Vehicle released and parking slot is now available.', { booking });
  } catch (error) {
    next(error);
  }
};

// GET /api/guard/payments (Recent exited bookings and their payment state)
const getRecentPayments = async (req, res, next) => {
  try {
    const payments = await Booking.find({ bookingStatus: { $in: ['PAYMENT_PENDING', 'PAYMENT_PAID', 'COMPLETED'] } })
      .populate('mall', 'name city')
      .populate('slot', 'slotNumber')
      .populate('user', 'name phone')
      .sort({ exitTime: -1 })
      .limit(25);

    return sendSuccess(res, 'Recent payment statuses retrieved.', { payments });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyEntry,
  verifyExit,
  releasePaidVehicle,
  getRecentPayments,
};
