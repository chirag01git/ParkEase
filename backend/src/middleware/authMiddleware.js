const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/responseHandler');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return sendError(res, 'Access denied. No token provided.', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'parkease_super_secret_jwt_key_2026');
    req.user = decoded; // { userId, role, email, name }
    next();
  } catch (error) {
    return sendError(res, 'Invalid or expired authentication token', 401);
  }
};

module.exports = authenticateToken;
