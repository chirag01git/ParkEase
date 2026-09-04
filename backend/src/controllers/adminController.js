const User = require('../models/User');
const Mall = require('../models/Mall');
const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// GET /api/admin/users
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return sendSuccess(res, 'Users list retrieved', { users });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/malls
const getAllMalls = async (req, res, next) => {
  try {
    const malls = await Mall.find().populate('owner', 'name email phone').sort({ createdAt: -1 });
    return sendSuccess(res, 'All malls retrieved', { malls });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/malls/:id/approve
const approveMall = async (req, res, next) => {
  try {
    const { id } = req.params;
    const mall = await Mall.findById(id);

    if (!mall) {
      return sendError(res, 'Mall not found', 404);
    }

    mall.status = 'APPROVED';
    await mall.save();

    return sendSuccess(res, `Mall '${mall.name}' has been APPROVED successfully`, { mall });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/malls/:id/reject
const rejectMall = async (req, res, next) => {
  try {
    const { id } = req.params;
    const mall = await Mall.findById(id);

    if (!mall) {
      return sendError(res, 'Mall not found', 404);
    }

    mall.status = 'REJECTED';
    await mall.save();

    return sendSuccess(res, `Mall '${mall.name}' has been REJECTED`, { mall });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/dashboard (System-wide Admin Analytics using Promise.all())
const getAdminDashboard = async (req, res, next) => {
  try {
    // Parallel execution of independent database count & aggregation queries
    const [
      totalUsers,
      totalMalls,
      pendingMalls,
      approvedMalls,
      totalSlots,
      occupiedSlots,
      totalBookings,
      completedBookings,
      revenueResult,
    ] = await Promise.all([
      User.countDocuments(),
      Mall.countDocuments(),
      Mall.countDocuments({ status: 'PENDING' }),
      Mall.countDocuments({ status: 'APPROVED' }),
      ParkingSlot.countDocuments(),
      ParkingSlot.countDocuments({ status: 'OCCUPIED' }),
      Booking.countDocuments(),
      Booking.countDocuments({ bookingStatus: 'COMPLETED' }),
      Booking.aggregate([
        { $match: { bookingStatus: 'COMPLETED' } },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
      ]),
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    return sendSuccess(res, 'Admin dashboard statistics retrieved', {
      stats: {
        totalUsers,
        totalMalls,
        pendingMalls,
        approvedMalls,
        totalSlots,
        occupiedSlots,
        availableSlots: totalSlots - occupiedSlots,
        totalBookings,
        completedBookings,
        totalRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getAllMalls,
  approveMall,
  rejectMall,
  getAdminDashboard,
};
