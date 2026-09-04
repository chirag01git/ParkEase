const mongoose = require('mongoose');

const mallSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Mall name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Mall owner is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    totalSlots: {
      type: Number,
      default: 0,
      min: [0, 'Total slots cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Mall', mallSchema);
