const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    mall: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mall',
      required: [true, 'Mall reference is required'],
      index: true,
    },
    slot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingSlot',
      required: [true, 'Slot reference is required'],
    },
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number is required'],
      trim: true,
      uppercase: true,
    },
    vehicleType: {
      type: String,
      enum: ['CAR', 'BIKE'],
      required: [true, 'Vehicle type is required'],
    },
    qrCode: {
      type: String,
      required: [true, 'QR Code token is required'],
      unique: true,
      index: true,
    },
    bookingStatus: {
      type: String,
      enum: ['BOOKED', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
      default: 'BOOKED',
      index: true,
    },
    entryTime: {
      type: Date,
      default: null,
    },
    exitTime: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number, // in hours
      default: 0,
    },
    amount: {
      type: Number, // in INR
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast check of user's active bookings
bookingSchema.index({ user: 1, bookingStatus: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
