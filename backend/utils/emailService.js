const nodemailer = require('nodemailer');

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Send OTP to user's email
 * @param {string} email - Recipient email address
 * @param {string} otp - OTP to send
 * @returns {Promise<Object>} - Result of the email sending operation
 */
async function sendOTP(email, otp) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for Login',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8FBC8F;">Guidance System OTP</h2>
          <p>Hello,</p>
          <p>Your OTP (One-Time Password) for login is:</p>
          <div style="background-color: #f0f8f0; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="margin: 0; color: #8FBC8F; font-size: 36px; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p>Please enter this code in the application to complete your login process.</p>
          <p>This OTP will expire in 10 minutes.</p>
          <br>
          <p>Best regards,<br>The Guidance System Team</p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { sendOTP };