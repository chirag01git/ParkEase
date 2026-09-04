const ParkingSlot = require('../models/ParkingSlot');
const Mall = require('../models/Mall');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// POST /api/malls/:id/slots (Add single or multiple slots to a mall)
const createSlots = async (req, res, next) => {
  try {
    const { id: mallId } = req.params;
    const { slots, slotNumber, vehicleType } = req.body;

    const mall = await Mall.findById(mallId);
    if (!mall) {
      return sendError(res, 'Mall not found', 404);
    }

    // Owner authorization check
    if (req.user.role !== 'ADMIN' && mall.owner.toString() !== req.user.userId) {
      return sendError(res, 'Unauthorized. You do not own this mall.', 403);
    }

    let createdSlots = [];

    if (Array.isArray(slots) && slots.length > 0) {
      // Bulk slot creation
      const slotDocs = slots.map(s => ({
        mall: mallId,
        slotNumber: s.slotNumber,
        vehicleType: s.vehicleType || 'ANY',
        status: 'AVAILABLE',
      }));

      createdSlots = await ParkingSlot.insertMany(slotDocs, { ordered: false });
    } else if (slotNumber) {
      // Single slot creation
      const newSlot = await ParkingSlot.create({
        mall: mallId,
        slotNumber,
        vehicleType: vehicleType || 'ANY',
        status: 'AVAILABLE',
      });
      createdSlots = [newSlot];
    } else {
      return sendError(res, 'Please provide slotNumber or an array of slots', 400);
    }

    // Update totalSlots in Mall document
    const currentCount = await ParkingSlot.countDocuments({ mall: mallId });
    mall.totalSlots = currentCount;
    await mall.save();

    return sendSuccess(res, 'Parking slots added successfully', { slots: createdSlots, totalSlots: mall.totalSlots }, 201);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 'One or more slot numbers already exist in this mall', 400);
    }
    next(error);
  }
};

// GET /api/malls/:id/slots (Get all slots of a mall)
const getSlots = async (req, res, next) => {
  try {
    const { id: mallId } = req.params;
    const slots = await ParkingSlot.find({ mall: mallId }).sort({ slotNumber: 1 });
    return sendSuccess(res, 'Parking slots retrieved successfully', { slots });
  } catch (error) {
    next(error);
  }
};

// GET /api/malls/:id/available-slots (Get AVAILABLE slots of a mall)
const getAvailableSlots = async (req, res, next) => {
  try {
    const { id: mallId } = req.params;
    const { vehicleType } = req.query;

    const filter = { mall: mallId, status: 'AVAILABLE' };
    if (vehicleType) {
      filter.vehicleType = { $in: [vehicleType.toUpperCase(), 'ANY'] };
    }

    const availableSlots = await ParkingSlot.find(filter).sort({ slotNumber: 1 });
    return sendSuccess(res, 'Available parking slots retrieved', {
      count: availableSlots.length,
      slots: availableSlots,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSlots,
  getSlots,
  getAvailableSlots,
};
