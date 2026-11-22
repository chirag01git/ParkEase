const jwt    = require('jsonwebtoken');
const dns    = require('dns').promises;
const User   = require('../models/User');
const { sendSuccess, sendError }         = require('../utils/responseHandler');
const { sendOTPEmail, sendPasswordResetEmail } = require('../utils/emailService');
const {
  generateOTP,
  saveOTP,
  verifyOTP,
  hasRecentOTP,
  savePasswordResetOTP,
  verifyPasswordResetOTP,
  hasRecentPasswordResetOTP,
} = require('../utils/otpStore');

// ─── Helpers ────────────────────────────────────────────────────────────────

const validateEmailFormat = (email) =>
  /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email);

/** Check if the email's domain has valid MX (mail exchange) records */
const validateEmailDomain = async (email) => {
  const domain = email.split('@')[1];
  try {
    const records = await dns.resolveMx(domain);
    return records && records.length > 0;
  } catch {
    return false; // domain doesn't exist or has no mail servers
  }
};

const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8)             errors.push('at least 8 characters');
  if (!/[A-Z]/.test(password))         errors.push('one uppercase letter (A–Z)');
  if (!/[a-z]/.test(password))         errors.push('one lowercase letter (a–z)');
  if (!/[0-9]/.test(password))         errors.push('one number (0–9)');
  if (!/[^A-Za-z0-9]/.test(password))  errors.push('one special character (@, #, $, ! …)');
  return errors;
};

// ─── POST /api/auth/send-otp ──────────────────────────────────────────────────
const sendOtp = async (req, res, next) => {
  try {
    const { email, name } = req.body;

    if (!email) return sendError(res, 'Email is required', 400);

    const cleanEmail = email.trim().toLowerCase();

    // 1. Format check
    if (!validateEmailFormat(cleanEmail)) {
      return sendError(res, 'Invalid email format. Please enter a valid email like user@example.com', 400);
    }

    // 2. DNS / domain existence check — catches fake domains like abc@notadomainxyz.com
    const domainValid = await validateEmailDomain(cleanEmail);
    if (!domainValid) {
      return sendError(
        res,
        `The email domain "@${cleanEmail.split('@')[1]}" does not exist or cannot receive emails. Please provide a real email address.`,
        400
      );
    }

    // 3. Already registered?
    try {
      const existing = await User.findOne({ email: cleanEmail });
      if (existing) {
        return sendError(res, 'This email is already registered. Please login instead.', 400);
      }
    } catch (dbErr) {
      // MongoDB might be down — skip DB check, still allow OTP send
      console.warn('[DB Check Skipped]:', dbErr.message);
    }

    // 4. Spam guard
    if (hasRecentOTP(cleanEmail)) {
      return sendError(res, 'OTP already sent. Please wait 60 seconds before requesting again.', 429);
    }

    // 5. Generate & send OTP
    const otp = generateOTP();
    saveOTP(cleanEmail, otp, name || 'User');

    try {
      await sendOTPEmail(cleanEmail, otp, name || 'User');
    } catch (mailErr) {
      console.error('[Email Error]:', mailErr.message, mailErr.code, mailErr.responseCode);

      // Gmail rejected the recipient address (non-existent inbox)
      if (mailErr.responseCode === 550 || mailErr.responseCode === 551 ||
          (mailErr.message && mailErr.message.includes('does not exist'))) {
        return sendError(
          res,
          `The email address "${cleanEmail}" does not exist. Please provide a real, working email address.`,
          400
        );
      }
      // Auth error
      if (mailErr.code === 'EAUTH' || mailErr.responseCode === 535) {
        return sendError(res, 'Server email configuration error. Please contact support.', 500);
      }
      // Network/other error
      return sendError(res, `Failed to send OTP to "${cleanEmail}". Check your internet and try again.`, 500);
    }

    return sendSuccess(res, `Verification OTP sent to ${cleanEmail}. Valid for 10 minutes.`, {});
  } catch (error) {
    console.error('[sendOtp Error]:', error.message);
    next(error);
  }
};

// ─── POST /api/auth/register ──────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, otp } = req.body;

    if (!name || !email || !password || !phone || !otp) {
      return sendError(res, 'All fields including the OTP are required', 400);
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!validateEmailFormat(cleanEmail)) {
      return sendError(res, 'Invalid email format', 400);
    }

    const pwErrors = validatePassword(password);
    if (pwErrors.length > 0) {
      return sendError(res, `Weak password. Must contain: ${pwErrors.join(', ')}.`, 400);
    }

    // Verify OTP
    const otpResult = verifyOTP(cleanEmail, otp);
    if (!otpResult.valid) {
      return sendError(res, otpResult.reason, 400);
    }

    // Email uniqueness
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return sendError(res, 'This email is already registered.', 400);
    }

    // Role enforcement: ONLY regular USERs can self-register.
    // Admin / Guard / Mall Owner accounts are pre-created by the system.
    const requestedRole = role ? role.toUpperCase() : 'USER';
    if (['ADMIN', 'GUARD', 'MALL_OWNER'].includes(requestedRole)) {
      return sendError(
        res,
        'Only regular user accounts can be created through registration. Staff accounts are pre-configured.',
        403
      );
    }
    const userRole = 'USER';

    const user = await User.create({
      name:     name.trim(),
      email:    cleanEmail,
      password,
      phone:    phone.trim(),
      role:     userRole,
    });

    const token = jwt.sign(
      { userId: user._id, role: user.role, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return sendSuccess(res, 'Email verified! Registration successful.', { user, token }, 201);
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return sendError(res, 'Invalid email or password', 401);

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return sendError(res, 'Invalid email or password', 401);

    const token = jwt.sign(
      { userId: user._id, role: user.role, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return sendSuccess(res, 'Login successful', { user, token });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, 'Email is required', 400);

    const cleanEmail = email.trim().toLowerCase();
    if (!validateEmailFormat(cleanEmail)) return sendError(res, 'Invalid email format', 400);

    const user = await User.findOne({ email: cleanEmail });
    // Do not disclose whether an address is registered.
    if (!user) return sendSuccess(res, 'If an account exists for this email, a reset code has been sent.', {});

    if (hasRecentPasswordResetOTP(cleanEmail)) {
      return sendError(res, 'A reset code was already sent. Please wait 60 seconds before requesting another.', 429);
    }

    const otp = generateOTP();
    savePasswordResetOTP(cleanEmail, otp);
    await sendPasswordResetEmail(cleanEmail, otp, user.name);
    return sendSuccess(res, 'If an account exists for this email, a reset code has been sent.', {});
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/auth/reset-password ───────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) return sendError(res, 'Email, reset code, and new password are required', 400);

    const cleanEmail = email.trim().toLowerCase();
    if (!validateEmailFormat(cleanEmail)) return sendError(res, 'Invalid email format', 400);

    const pwErrors = validatePassword(password);
    if (pwErrors.length > 0) return sendError(res, `Weak password. Must contain: ${pwErrors.join(', ')}.`, 400);

    const user = await User.findOne({ email: cleanEmail });
    if (!user) return sendError(res, 'Unable to reset this password. Please request a new code.', 400);

    const otpResult = verifyPasswordResetOTP(cleanEmail, otp);
    if (!otpResult.valid) return sendError(res, otpResult.reason, 400);

    user.password = password;
    await user.save();
    return sendSuccess(res, 'Password reset successfully. You can now sign in.', {});
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return sendError(res, 'User not found', 404);
    return sendSuccess(res, 'User profile retrieved', { user });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendOtp, register, login, forgotPassword, resetPassword, getMe };
