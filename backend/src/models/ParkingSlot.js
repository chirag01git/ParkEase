const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema(
  {
    mall: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mall',
      required: [true, 'Mall reference is required'],
      index: true,
    },
    slotNumber: {
      type: String,
      required: [true, 'Slot number is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'OCCUPIED'],
      default: 'AVAILABLE',
      index: true,
    },
    vehicleType: {
      type: String,
      enum: ['CAR', 'BIKE', 'ANY'],
      default: 'ANY',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: slot number must be unique within each mall
parkingSlotSchema.index({ mall: 1, slotNumber: 1 }, { unique: true });

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);
