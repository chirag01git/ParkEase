const Mall = require('../models/Mall');
const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// POST /api/malls (Create a mall, default status PENDING)
const createMall = async (req, res, next) => {
  try {
    const { name, address, city, totalSlots } = req.body;

    if (!name || !address || !city) {
      return sendError(res, 'Name, address, and city are required', 400);
    }

    const mall = await Mall.create({
      name,
      address,
      city,
      owner: req.user.userId,
      status: 'PENDING', // Requirement: newly created malls MUST be PENDING
      totalSlots: Number(totalSlots) || 0,
    });

    return sendSuccess(res, 'Mall created successfully and pending admin approval', { mall }, 201);
  } catch (error) {
    next(error);
  }
};

// GET /api/malls (Get approved malls for normal users, or filter by query)
const getMalls = async (req, res, next) => {
  try {
    let filter = { status: 'APPROVED' };

    // If admin or mall owner requests all malls
    if (req.user && req.user.role === 'ADMIN') {
      filter = {};
    }

    const malls = await Mall.find(filter).populate('owner', 'name email phone').sort({ createdAt: -1 });
    return sendSuccess(res, 'Malls retrieved successfully', { malls });
  } catch (error) {
    next(error);
  }
};

// GET /api/malls/my (Get malls owned by logged-in MALL_OWNER)
const getMyMalls = async (req, res, next) => {
  try {
    const malls = await Mall.find({ owner: req.user.userId }).sort({ createdAt: -1 });
    return sendSuccess(res, 'My malls retrieved successfully', { malls });
  } catch (error) {
    next(error);
  }
};

// GET /api/malls/:id (Get single mall details)
const getMallById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const mall = await Mall.findById(id).populate('owner', 'name email phone');

    if (!mall) {
      return sendError(res, 'Mall not found', 404);
    }

    return sendSuccess(res, 'Mall details retrieved', { mall });
  } catch (error) {
    next(error);
  }
};

// GET /api/malls/:id/dashboard (Mall Owner Dashboard Stats - Promise.all optimization)
const getMallDashboard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const mall = await Mall.findById(id);

    if (!mall) {
      return sendError(res, 'Mall not found', 404);
    }

    // Owner authorization check: only owner or admin can view mall dashboard
    if (req.user.role !== 'ADMIN' && mall.owner.toString() !== req.user.userId) {
      return sendError(res, 'Unauthorized to view dashboard for this mall', 403);
    }

    // Parallel execution of independent aggregation & count queries using Promise.all()
    const [totalSlots, availableSlots, occupiedSlots, totalBookings, completedBookings, revenueResult] = await Promise.all([
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

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    return sendSuccess(res, 'Mall dashboard analytics retrieved', {
      mall,
      stats: {
        totalSlots,
        availableSlots,
        occupiedSlots,
        totalBookings,
        completedBookings,
        revenue: totalRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMall,
  getMalls,
  getMyMalls,
  getMallById,
  getMallDashboard,
};
