const express = require('express');
const router = express.Router();
const { verifyEntry, verifyExit } = require('../controllers/guardController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Guard APIs require GUARD or ADMIN role
router.use(authenticateToken, authorizeRoles('GUARD', 'ADMIN'));

router.post('/verify-entry', verifyEntry);
router.post('/verify-exit', verifyExit);

module.exports = router;
