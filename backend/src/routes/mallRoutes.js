const express = require('express');
const router = express.Router();
const {
  createMall,
  getMalls,
  getMyMalls,
  getMallById,
  getMallDashboard,
} = require('../controllers/mallController');
const { createSlots, getSlots, getAvailableSlots } = require('../controllers/slotController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Public/Authenticated mall viewing
router.get('/', getMalls);

// Mall Owner routes
router.post('/', authenticateToken, authorizeRoles('MALL_OWNER', 'ADMIN'), createMall);
router.get('/my', authenticateToken, authorizeRoles('MALL_OWNER', 'ADMIN'), getMyMalls);
router.get('/:id', getMallById);

// Mall slots routes
router.post('/:id/slots', authenticateToken, authorizeRoles('MALL_OWNER', 'ADMIN'), createSlots);
router.get('/:id/slots', getSlots);
router.get('/:id/available-slots', getAvailableSlots);

// Mall Owner Dashboard stats
router.get('/:id/dashboard', authenticateToken, authorizeRoles('MALL_OWNER', 'ADMIN'), getMallDashboard);

module.exports = router;
