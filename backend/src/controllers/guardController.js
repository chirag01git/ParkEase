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

    // Update booking state: ACTIVE -> COMPLETED
    booking.exitTime = exitTime;
    booking.duration = billing.duration;
    booking.amount = billing.amount;
    booking.bookingStatus = 'COMPLETED';
    await booking.save();

    // REQUIREMENT 6: Release slot status back to AVAILABLE
    let slotReleased = false;
    if (booking.slot) {
      await ParkingSlot.findByIdAndUpdate(booking.slot._id, { status: 'AVAILABLE' });
      slotReleased = true;
    }

    return sendSuccess(res, 'Gate exit verified successfully. Parking payment bill calculated and slot released.', {
      booking,
      summary: {
        vehicleNumber: booking.vehicleNumber,
        vehicleType: booking.vehicleType,
        entryTime: booking.entryTime,
        exitTime: booking.exitTime,
        durationInHours: billing.duration,
        totalAmount: billing.amount,
        slotReleased,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyEntry,
  verifyExit,
};
