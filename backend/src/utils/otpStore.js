/**
 * In-memory OTP Store
 * Stores OTPs temporarily with auto-expiry (10 minutes)
 * Format: { email -> { otp, expiresAt, name } }
 */

const otpMap = new Map();
const passwordResetOtpMap = new Map();

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

/** Generate a cryptographically random 6-digit OTP */
const generateOTP = () => {
  const { randomInt } = require('crypto');
  return randomInt(100000, 1000000).toString();
};

/** Save OTP for an email (overwrites any existing OTP) */
const saveOTP = (email, otp, name) => {
  otpMap.set(email.toLowerCase(), {
    otp,
    name,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
  });
};

/** Verify OTP — returns true/false and auto-deletes on success */
const verifyOTP = (email, enteredOTP) => {
  const record = otpMap.get(email.toLowerCase());

  if (!record) return { valid: false, reason: 'No OTP found. Please request a new OTP.' };
  if (Date.now() > record.expiresAt) {
    otpMap.delete(email.toLowerCase());
    return { valid: false, reason: 'OTP has expired. Please request a new one.' };
  }
  if (record.otp !== enteredOTP.trim()) {
    return { valid: false, reason: 'Incorrect OTP. Please check your email and try again.' };
  }

  // OTP is correct — delete it so it can't be reused
  otpMap.delete(email.toLowerCase());
  return { valid: true };
};

/** Check if an OTP was already sent recently (prevent spam) */
const hasRecentOTP = (email) => {
  const record = otpMap.get(email.toLowerCase());
  if (!record) return false;
  // Block resend if OTP was sent less than 60 seconds ago
  const sentAt = record.expiresAt - OTP_EXPIRY_MS;
  return Date.now() - sentAt < 60 * 1000;
};

/** Save an OTP used only to authorize a password reset. */
const savePasswordResetOTP = (email, otp) => {
  passwordResetOtpMap.set(email.toLowerCase(), {
    otp,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
  });
};

/** Verify a password-reset OTP and delete it after successful use. */
const verifyPasswordResetOTP = (email, enteredOTP) => {
  const key = email.toLowerCase();
  const record = passwordResetOtpMap.get(key);

  if (!record) return { valid: false, reason: 'No password reset code found. Please request a new one.' };
  if (Date.now() > record.expiresAt) {
    passwordResetOtpMap.delete(key);
    return { valid: false, reason: 'The reset code has expired. Please request a new one.' };
  }
  if (record.otp !== enteredOTP.trim()) {
    return { valid: false, reason: 'Incorrect reset code. Please check your email and try again.' };
  }

  passwordResetOtpMap.delete(key);
  return { valid: true };
};

const hasRecentPasswordResetOTP = (email) => {
  const record = passwordResetOtpMap.get(email.toLowerCase());
  if (!record) return false;
  const sentAt = record.expiresAt - OTP_EXPIRY_MS;
  return Date.now() - sentAt < 60 * 1000;
};

module.exports = {
  generateOTP,
  saveOTP,
  verifyOTP,
  hasRecentOTP,
  savePasswordResetOTP,
  verifyPasswordResetOTP,
  hasRecentPasswordResetOTP,
};
