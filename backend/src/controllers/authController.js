const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password || !phone) {
      return sendError(res, 'All fields (name, email, password, phone) are required', 400);
    }

    // Email uniqueness check
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendError(res, 'Email is already registered', 400);
    }

    // Role check: Normal user registration CANNOT create ADMIN accounts
    let userRole = 'USER';
    if (role) {
      if (role.toUpperCase() === 'ADMIN') {
        return sendError(res, 'Cannot self-register as ADMIN role', 403);
      }
      if (['USER', 'MALL_OWNER', 'GUARD'].includes(role.toUpperCase())) {
        userRole = role.toUpperCase();
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: userRole,
    });

    const token = jwt.sign(
      { userId: user._id, role: user.role, email: user.email, name: user.name },
      process.env.JWT_SECRET || 'parkease_super_secret_jwt_key_2026',
      { expiresIn: '7d' }
    );

    return sendSuccess(res, 'Registration successful', { user, token }, 201);
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, email: user.email, name: user.name },
      process.env.JWT_SECRET || 'parkease_super_secret_jwt_key_2026',
      { expiresIn: '7d' }
    );

    return sendSuccess(res, 'Login successful', { user, token });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    return sendSuccess(res, 'User profile retrieved', { user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
