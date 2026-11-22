const nodemailer = require('nodemailer');

// Create Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD, // Google App Password (16-char)
  },
});

/**
 * Send OTP email to the user
 * @param {string} toEmail  - recipient email
 * @param {string} otp      - 6-digit OTP code
 * @param {string} name     - recipient's name
 */
const sendOTPEmail = async (toEmail, otp, name = 'User') => {
  const mailOptions = {
    from: `"ParkEase" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '🔐 Your ParkEase Email Verification OTP',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8"/>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; margin: 0; padding: 0; }
          .wrapper { max-width: 480px; margin: 40px auto; background: #1e293b; border-radius: 16px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #3b82f6, #6366f1); padding: 32px 24px; text-align: center; }
          .header h1 { color: #fff; margin: 0; font-size: 24px; letter-spacing: 1px; }
          .header p  { color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 14px; }
          .body { padding: 32px 28px; }
          .body p { color: #cbd5e1; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
          .otp-box { background: #0f172a; border: 2px dashed #3b82f6; border-radius: 12px;
                     text-align: center; padding: 24px; margin: 24px 0; }
          .otp-code { font-size: 42px; font-weight: 800; letter-spacing: 10px; color: #60a5fa;
                      font-family: 'Courier New', monospace; }
          .otp-label { color: #64748b; font-size: 12px; margin-top: 8px; }
          .warning { background: rgba(239,68,68,0.1); border-left: 4px solid #ef4444;
                     border-radius: 8px; padding: 12px 16px; }
          .warning p { color: #fca5a5; font-size: 13px; margin: 0; }
          .footer { background: #0f172a; padding: 20px; text-align: center; }
          .footer p { color: #475569; font-size: 12px; margin: 0; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="header">
            <h1>🅿️ ParkEase</h1>
            <p>Email Verification</p>
          </div>
          <div class="body">
            <p>Hi <strong style="color:#e2e8f0">${name}</strong>,</p>
            <p>Thank you for registering with ParkEase! Use the OTP below to verify your email address:</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <div class="otp-label">Valid for <strong>10 minutes</strong> only</div>
            </div>
            <div class="warning">
              <p>⚠️ Never share this OTP with anyone. ParkEase will never ask for your OTP via phone or chat.</p>
            </div>
            <p style="margin-top:20px">If you did not request this, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ParkEase Mall Parking System</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendPasswordResetEmail = async (toEmail, otp, name = 'User') => {
  const mailOptions = {
    from: `"ParkEase" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '🔐 Your ParkEase password reset code',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family:Segoe UI,Arial,sans-serif;background:#0f172a;margin:0;padding:24px;color:#cbd5e1">
        <div style="max-width:480px;margin:auto;background:#1e293b;border-radius:16px;overflow:hidden">
          <div style="background:linear-gradient(135deg,#3b82f6,#6366f1);padding:28px;text-align:center;color:#fff">
            <h1 style="margin:0;font-size:24px">ParkEase</h1>
            <p style="margin:8px 0 0">Password reset</p>
          </div>
          <div style="padding:28px">
            <p>Hi <strong>${name}</strong>,</p>
            <p>Use this code to reset your ParkEase password. It expires in 10 minutes.</p>
            <div style="margin:24px 0;padding:20px;border:2px dashed #3b82f6;border-radius:12px;text-align:center;font-family:monospace;font-size:38px;font-weight:800;letter-spacing:8px;color:#60a5fa">${otp}</div>
            <p style="font-size:13px;color:#fca5a5">Never share this code. If you did not request a reset, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail, sendPasswordResetEmail };
