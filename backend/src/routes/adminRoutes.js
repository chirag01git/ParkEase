const express = require('express');
const router = express.Router();
const {
  getUsers,
  getAllMalls,
  approveMall,
  rejectMall,
  getAdminDashboard,
} = require('../controllers/adminController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// All admin routes require ADMIN role
router.use(authenticateToken, authorizeRoles('ADMIN'));

router.get('/users', getUsers);
router.get('/malls', getAllMalls);
router.put('/malls/:id/approve', approveMall);
router.put('/malls/:id/reject', rejectMall);
router.get('/dashboard', getAdminDashboard);

module.exports = router;
