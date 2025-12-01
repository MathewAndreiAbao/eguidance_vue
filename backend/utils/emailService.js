const nodemailer = require('nodemailer');
require('dotenv').config();

// Create email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

/**
 * Send OTP email to user
 * @param {string} email - Recipient email address
 * @param {string} otp - Generated OTP code
 * @returns {Promise<Object>} - Result of email send operation
 */
async function sendOTP(email, otp) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'eGuidance <noreply@eguidance.com>',
      to: email,
      subject: 'Your OTP for eGuidance Login',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
          <div style="background-color: #8FBC8F; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">eGuidance</h1>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #2D5D2C; margin-top: 0;">Your One-Time Password</h2>
            <p style="color: #374151; font-size: 16px;">Hello,</p>
            <p style="color: #374151; font-size: 16px;">You have requested to login to your eGuidance account. Please use the following OTP to complete your login:</p>
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h1 style="color: #2D5D2C; margin: 0; font-size: 36px; letter-spacing: 8px;">${otp}</h1>
            </div>
            <p style="color: #6B7280; font-size: 14px;">This OTP will expire in 10 minutes.</p>
            <p style="color: #6B7280; font-size: 14px;">If you did not request this OTP, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
            <p style="color: #9CA3AF; font-size: 12px; text-align: center;">© 2024 eGuidance. All rights reserved.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verify email configuration
 * @returns {Promise<boolean>} - True if email service is configured
 */
async function verifyEmailConfig() {
  try {
    await transporter.verify();
    console.log('Email service is ready');
    return true;
  } catch (error) {
    console.error('Email service configuration error:', error);
    return false;
  }
}

module.exports = { sendOTP, verifyEmailConfig };