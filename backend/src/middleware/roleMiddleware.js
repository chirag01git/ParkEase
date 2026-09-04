const { sendError } = require('../utils/responseHandler');

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return sendError(res, `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]`, 403);
    }
    next();
  };
};

module.exports = authorizeRoles;
